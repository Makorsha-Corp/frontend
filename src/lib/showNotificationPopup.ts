import { createElement } from 'react';
import type { AppNotification } from '@/components/newcomponents/customui/notifications/notificationTypes';
import { localizedNotificationTitle } from '@/components/newcomponents/customui/notifications/notificationI18n';
import i18n from '@/i18n';
import { appToast, type Toast } from '@/lib/appToast';

const NOTIFICATION_POPUP_DURATION_MS = 8_000;

/** Inbound notification popup — same host + card style as action toasts. */
export function showNotificationPopup(
  notification: AppNotification,
  onOpen: () => void,
): string {
  const t = i18n.getFixedT(i18n.language, 'notifications');
  const title = localizedNotificationTitle(notification, t);

  return appToast.custom(
    (toast: Toast) =>
      createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            appToast.dismiss(toast.id);
            onOpen();
          },
          className:
            'w-full text-left text-sm leading-snug text-card-foreground transition-opacity hover:opacity-90',
          style: {
            opacity: toast.visible ? 1 : 0,
            transform: toast.visible ? 'scale(1)' : 'scale(0.98)',
            transition: 'opacity 150ms ease, transform 150ms ease',
          },
        },
        title,
      ),
    {
      id: `notification-${notification.id}`,
      duration: NOTIFICATION_POPUP_DURATION_MS,
    },
  );
}
