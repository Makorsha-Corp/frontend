import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { readEventStream } from './sseClient';

const MAX_RETRY_MS = 30_000;

function streamUrl(): string {
  const base = import.meta.env.VITE_API_URL ?? '';
  return `${base.replace(/\/?$/, '/')}me/notifications/stream`;
}

export function useNotificationStream(): boolean {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const workspaceId = useSelector((state: RootState) => state.auth.workspace?.id);
  const [streamConnected, setStreamConnected] = useState(false);
  const retryDelayRef = useRef(1000);

  useEffect(() => {
    if (!token || workspaceId == null) {
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

    const connect = async () => {
      if (cancelled) return;

      try {
        setStreamConnected(true);
        retryDelayRef.current = 1000;

        await readEventStream(streamUrl(), {
          signal: abort.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Workspace-ID': String(workspaceId),
          },
          onMessage: (message) => {
            if (message.event === 'notification') {
              dispatch(notificationsApi.util.invalidateTags(['Notification']));
            }
          },
        });

        setStreamConnected(false);
        if (!abort.signal.aborted && !cancelled) {
          scheduleReconnect();
        }
      } catch {
        if (abort.signal.aborted || cancelled) return;
        setStreamConnected(false);
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
  }, [token, workspaceId, dispatch]);

  return streamConnected;
}
