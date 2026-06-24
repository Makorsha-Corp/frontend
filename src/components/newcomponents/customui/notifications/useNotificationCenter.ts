import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseISO } from 'date-fns';
import { MOCK_NOTIFICATIONS } from './mockNotifications';
import {
  kindMatchesFilter,
  NOTIFICATION_FILTERS,
  type AppNotification,
  type NotificationFilter,
} from './notificationTypes';
import {
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
} from '@/features/notifications/notificationsApi';
import { transformBackendNotification } from './notificationTransform';
import { useNotificationStream } from './useNotificationStream';

export const READ_IDS_KEY = 'erp-notification-read-ids';
export const DISMISSED_IDS_KEY = 'erp-notification-dismissed-ids';

function loadStringSet(key: string): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveStringSet(key: string, set: Set<string>) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify([...set]));
}

export interface NotificationCenterState {
  notifications: AppNotification[];
  unreadCount: number;
  dialogOpen: boolean;
  filter: NotificationFilter;
  overviewPreview: AppNotification[];
  filteredForDialog: AppNotification[];
  filterUnreadCounts: Record<NotificationFilter, number>;
  isRead: (id: string) => boolean;
  setDialogOpen: (open: boolean) => void;
  openDialog: (filter?: NotificationFilter) => void;
  setFilter: (filter: NotificationFilter) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  toggleRead: (id: string) => void;
  markManyRead: (ids: string[]) => void;
  dismiss: (id: string) => void;
  toastNotifications: AppNotification[];
  dismissToast: (id: string) => void;
}

export function useNotificationCenter(): NotificationCenterState {
  const [readIds, setReadIds] = useState<Set<string>>(() => loadStringSet(READ_IDS_KEY));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadStringSet(DISMISSED_IDS_KEY));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [toastNotifications, setToastNotifications] = useState<AppNotification[]>([]);
  const pendingToastIdsRef = useRef<Set<number>>(new Set());
  const dialogOpenRef = useRef(dialogOpen);
  dialogOpenRef.current = dialogOpen;

  const handleStreamNotification = useCallback((notificationId: number) => {
    if (dialogOpenRef.current) return;
    pendingToastIdsRef.current.add(notificationId);
  }, []);

  const streamConnected = useNotificationStream({ onNotification: handleStreamNotification });

  // Poll as fallback when SSE is disconnected; long safety net when connected
  const { data: backendData, refetch: refetchNotifications } = useGetNotificationsQuery(
    {},
    {
      pollingInterval: streamConnected ? 300_000 : dialogOpen ? 15_000 : 60_000,
      refetchOnFocus: true,
    }
  );
  const [markBackendRead] = useMarkNotificationsReadMutation();

  useEffect(() => {
    if (!backendData?.items.length || pendingToastIdsRef.current.size === 0) return;

    const resolved: AppNotification[] = [];
    for (const id of pendingToastIdsRef.current) {
      const item = backendData.items.find((n) => n.id === id);
      if (item) {
        resolved.push(transformBackendNotification(item));
        pendingToastIdsRef.current.delete(id);
      }
    }

    if (resolved.length === 0) return;

    setToastNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const fresh = resolved.filter((n) => !existingIds.has(n.id));
      return [...fresh, ...prev];
    });
  }, [backendData]);

  const dismissToast = useCallback((id: string) => {
    setToastNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const backendNotifications = useMemo<AppNotification[]>(
    () =>
      (backendData?.items ?? [])
        .filter((n) => !dismissedIds.has(`api_${n.id}`))
        .map(transformBackendNotification),
    [backendData, dismissedIds]
  );

  const mockNotifications = useMemo(
    () => MOCK_NOTIFICATIONS.filter((n) => !dismissedIds.has(n.id)),
    [dismissedIds]
  );

  const notifications = useMemo(
    () =>
      [...backendNotifications, ...mockNotifications].sort(
        (a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()
      ),
    [backendNotifications, mockNotifications]
  );

  const isRead = useCallback(
    (id: string) => {
      if (id.startsWith('api_')) {
        const numId = parseInt(id.replace('api_', ''), 10);
        return backendData?.items.find((n) => n.id === numId)?.is_read ?? false;
      }
      return readIds.has(id);
    },
    [readIds, backendData]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !isRead(n.id)),
    [notifications, isRead]
  );

  const unreadCount = unreadNotifications.length;

  const filteredForDialog = useMemo(() => {
    const items = notifications.filter((n) => kindMatchesFilter(n.kind, filter));

    if (filter === 'unread') {
      return [...items].sort((a, b) => {
        const aUnread = isRead(a.id) ? 1 : 0;
        const bUnread = isRead(b.id) ? 1 : 0;
        if (aUnread !== bUnread) return aUnread - bUnread;
        return parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime();
      });
    }

    return items;
  }, [notifications, filter, isRead]);

  const filterUnreadCounts = useMemo(() => {
    const counts = {} as Record<NotificationFilter, number>;
    for (const f of NOTIFICATION_FILTERS) {
      counts[f] = notifications.filter(
        (n) => kindMatchesFilter(n.kind, f) && !isRead(n.id)
      ).length;
    }
    return counts;
  }, [notifications, isRead]);

  const overviewPreview = useMemo(() => {
    const unread = notifications.filter((n) => !isRead(n.id));
    const read = notifications.filter((n) => isRead(n.id));
    return [...unread, ...read].slice(0, 4);
  }, [notifications, isRead]);

  const markRead = useCallback((id: string) => {
    if (id.startsWith('api_')) {
      const numId = parseInt(id.replace('api_', ''), 10);
      markBackendRead({ ids: [numId] });
    } else {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveStringSet(READ_IDS_KEY, next);
        return next;
      });
    }
  }, [markBackendRead]);

  const markUnread = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      saveStringSet(READ_IDS_KEY, next);
      return next;
    });
  }, []);

  const toggleRead = useCallback(
    (id: string) => {
      if (isRead(id)) markUnread(id);
      else markRead(id);
    },
    [isRead, markRead, markUnread]
  );

  const markManyRead = useCallback(
    (ids: string[]) => {
      const unreadIds = ids.filter((id) => !isRead(id));
      if (unreadIds.length === 0) return;

      const backendIds = unreadIds
        .filter((id) => id.startsWith('api_'))
        .map((id) => parseInt(id.replace('api_', ''), 10));

      if (backendIds.length > 0) {
        markBackendRead({ ids: backendIds });
      }

      const mockIds = unreadIds.filter((id) => !id.startsWith('api_'));
      if (mockIds.length > 0) {
        setReadIds((prev) => {
          const next = new Set(prev);
          for (const id of mockIds) next.add(id);
          saveStringSet(READ_IDS_KEY, next);
          return next;
        });
      }
    },
    [isRead, markBackendRead]
  );

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStringSet(DISMISSED_IDS_KEY, next);
      return next;
    });
  }, []);

  const openDialog = useCallback(
    (nextFilter?: NotificationFilter) => {
      if (nextFilter) setFilter(nextFilter);
      setDialogOpen(true);
      void refetchNotifications();
    },
    [refetchNotifications]
  );

  return {
    notifications,
    unreadCount,
    dialogOpen,
    filter,
    overviewPreview,
    filteredForDialog,
    filterUnreadCounts,
    isRead,
    setDialogOpen,
    openDialog,
    setFilter,
    markRead,
    markUnread,
    toggleRead,
    markManyRead,
    dismiss,
    toastNotifications,
    dismissToast,
  };
}
