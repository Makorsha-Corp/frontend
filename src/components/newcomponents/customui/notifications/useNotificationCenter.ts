import { useCallback, useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { MOCK_NOTIFICATIONS } from './mockNotifications';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  kindMatchesFilter,
  preferenceKeyForKind,
  type AppNotification,
  type NotificationFilter,
  type NotificationPreferences,
} from './notificationTypes';

export const READ_IDS_KEY = 'erp-notification-read-ids';
export const DISMISSED_IDS_KEY = 'erp-notification-dismissed-ids';
export const PREFS_KEY = 'erp-notification-prefs';

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

function loadPreferences(): NotificationPreferences {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

function savePreferences(prefs: NotificationPreferences) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export interface NotificationCenterState {
  notifications: AppNotification[];
  unreadCount: number;
  unreadPreview: AppNotification[];
  dialogOpen: boolean;
  filter: NotificationFilter;
  preferences: NotificationPreferences;
  overviewPreview: AppNotification[];
  filteredForDialog: AppNotification[];
  isRead: (id: string) => boolean;
  setDialogOpen: (open: boolean) => void;
  openDialog: (filter?: NotificationFilter) => void;
  setFilter: (filter: NotificationFilter) => void;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  toggleRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  setPreference: (key: keyof NotificationPreferences, enabled: boolean) => void;
}

export function useNotificationCenter(): NotificationCenterState {
  const [readIds, setReadIds] = useState<Set<string>>(() => loadStringSet(READ_IDS_KEY));
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadStringSet(DISMISSED_IDS_KEY));
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => loadPreferences());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const notifications = useMemo(
    () =>
      MOCK_NOTIFICATIONS.filter((n) => {
        if (dismissedIds.has(n.id)) return false;
        const prefKey = preferenceKeyForKind(n.kind);
        return preferences[prefKey];
      }).sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()),
    [dismissedIds, preferences]
  );

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)),
    [notifications, readIds]
  );

  const unreadCount = unreadNotifications.length;

  const unreadPreview = useMemo(() => unreadNotifications.slice(0, 5), [unreadNotifications]);

  const filteredForDialog = useMemo(() => {
    return notifications.filter((n) => {
      if (!kindMatchesFilter(n.kind, filter)) return false;
      if (filter === 'unread' && readIds.has(n.id)) return false;
      return true;
    });
  }, [notifications, filter, readIds]);

  const overviewPreview = useMemo(() => {
    const unread = notifications.filter((n) => !readIds.has(n.id));
    const read = notifications.filter((n) => readIds.has(n.id));
    return [...unread, ...read].slice(0, 4);
  }, [notifications, readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStringSet(READ_IDS_KEY, next);
      return next;
    });
  }, []);

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
      if (readIds.has(id)) markUnread(id);
      else markRead(id);
    },
    [readIds, markRead, markUnread]
  );

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of notifications) next.add(n.id);
      saveStringSet(READ_IDS_KEY, next);
      return next;
    });
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStringSet(DISMISSED_IDS_KEY, next);
      return next;
    });
  }, []);

  const setPreference = useCallback((key: keyof NotificationPreferences, enabled: boolean) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: enabled };
      savePreferences(next);
      return next;
    });
  }, []);

  const openDialog = useCallback((nextFilter?: NotificationFilter) => {
    if (nextFilter) setFilter(nextFilter);
    setDialogOpen(true);
  }, []);

  return {
    notifications,
    unreadCount,
    unreadPreview,
    dialogOpen,
    filter,
    preferences,
    overviewPreview,
    filteredForDialog,
    isRead,
    setDialogOpen,
    openDialog,
    setFilter,
    markRead,
    markUnread,
    toggleRead,
    markAllRead,
    dismiss,
    setPreference,
  };
}
