import type { TFunction } from 'i18next';
import type { AppNotification } from './notificationTypes';

function withActor(t: TFunction, params?: Record<string, string>): Record<string, string> {
  const next = { ...(params ?? {}) };
  if (!next.actor?.trim()) {
    next.actor = t('someone', { ns: 'notifications' });
  }
  return next;
}

export function localizedNotificationTitle(notification: AppNotification, t: TFunction): string {
  if (!notification.titleKey) return notification.title;
  const params =
    notification.titleKey === 'titleMention' || notification.titleKey === 'titleGenericNotify'
      ? withActor(t, notification.titleParams)
      : { ...(notification.titleParams ?? {}) };
  return t(notification.titleKey, {
    ns: 'notifications',
    defaultValue: notification.title,
    ...params,
  });
}

export function localizedNotificationBody(notification: AppNotification, t: TFunction): string {
  if (notification.bodyFromPreview) return notification.body;
  if (!notification.bodyKey) return notification.body;
  return t(notification.bodyKey, {
    ns: 'notifications',
    defaultValue: notification.body,
    ...(notification.bodyParams ?? {}),
  });
}
