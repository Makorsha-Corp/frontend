import { createElement } from 'react';
import type { Toast } from 'react-hot-toast';

import type { AppNotification } from '@/components/newcomponents/customui/notifications/notificationTypes';
import { appToast } from '@/lib/appToast';

const NOTIFICATION_POPUP_DURATION_MS = 8_000;

/** Inbound notification popup — same host + card style as action toasts. */
export function showNotificationPopup(
  notification: AppNotification,
  onOpen: () => void,
): string {
  return appToast.custom(
    (t: Toast) =>
      createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            appToast.dismiss(t.id);
            onOpen();
          },
          className:
            'w-full text-left text-sm leading-snug text-card-foreground transition-opacity hover:opacity-90',
          style: {
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'scale(1)' : 'scale(0.98)',
            transition: 'opacity 150ms ease, transform 150ms ease',
          },
        },
        notification.title,
      ),
    {
      id: `notification-${notification.id}`,
      duration: NOTIFICATION_POPUP_DURATION_MS,
    },
  );
}
