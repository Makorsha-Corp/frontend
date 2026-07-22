import { useEffect, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import type { RootState } from '@/app/store';
import { useAppDispatch } from '@/app/hooks';
import { authApi } from '@/features/auth/authApi';
import { logout, setTokens } from '@/features/auth/authSlice';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { readEventStream, SseOpenError } from './sseClient';

const MAX_RETRY_MS = 30_000;

function streamUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? '';
  return `${base.replace(/\/?$/, '/')}me/notifications/stream`;
}

export interface UseNotificationStreamOptions {
  onNotification?: (notificationId: number) => void;
}

export function useNotificationStream(options?: UseNotificationStreamOptions): boolean {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const token = useSelector((state: RootState) => state.auth.token);
  const workspaceId = useSelector((state: RootState) => state.auth.workspace?.id);
  const [streamConnected, setStreamConnected] = useState(false);
  const retryDelayRef = useRef(1000);
  const onNotificationRef = useRef(options?.onNotification);
  onNotificationRef.current = options?.onNotification;

  useEffect(() => {
    const authToken = store.getState().auth.token;
    const wsId = store.getState().auth.workspace?.id;

    if (!authToken || wsId == null) {
      setStreamConnected(false);
      return;
    }

    const abort = new AbortController();
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const scheduleReconnect = () => {
      if (cancelled) return;
      retryTimeout = setTimeout(() => {
        void connect();
      }, retryDelayRef.current);
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_MS);
    };

    const tryRefreshToken = async (): Promise<boolean> => {
      const refreshToken = store.getState().auth.refreshToken;
      if (!refreshToken) {
        dispatch(logout());
        return false;
      }

      try {
        const data = await dispatch(
          authApi.endpoints.refreshToken.initiate({ refresh_token: refreshToken })
        ).unwrap();

        dispatch(
          setTokens({
            token: data.access_token,
            refreshToken: data.refresh_token,
          })
        );
        retryDelayRef.current = 1000;
        return true;
      } catch {
        dispatch(logout());
        return false;
      }
    };

    const connect = async () => {
      if (cancelled) return;

      const currentToken = store.getState().auth.token;
      const currentWorkspaceId = store.getState().auth.workspace?.id;
      if (!currentToken || currentWorkspaceId == null) return;

      try {
        await readEventStream(streamUrl(), {
          signal: abort.signal,
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'X-Workspace-ID': String(currentWorkspaceId),
          },
          onOpen: () => {
            if (!cancelled) {
              setStreamConnected(true);
              retryDelayRef.current = 1000;
            }
          },
          onMessage: (message) => {
            if (message.event === 'notification') {
              dispatch(notificationsApi.util.invalidateTags(['Notification']));
              try {
                const payload = JSON.parse(message.data) as { notification_id?: number };
                if (typeof payload.notification_id === 'number') {
                  onNotificationRef.current?.(payload.notification_id);
                }
              } catch {
                // ignore malformed payloads
              }
            }
          },
        });

        setStreamConnected(false);
        if (!abort.signal.aborted && !cancelled) {
          scheduleReconnect();
        }
      } catch (error) {
        if (abort.signal.aborted || cancelled) return;
        setStreamConnected(false);

        if (error instanceof SseOpenError && error.status === 401) {
          const refreshed = await tryRefreshToken();
          // Fresh token triggers a new effect run; don't retry with stale bearer.
          if (refreshed) return;
          return;
        }

        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      abort.abort();
      setStreamConnected(false);
    };
  }, [token, workspaceId, dispatch, store]);

  return streamConnected;
}
