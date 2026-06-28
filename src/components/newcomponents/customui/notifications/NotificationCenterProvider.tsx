import React, { createContext, useContext } from 'react';
import { useNotificationCenter, type NotificationCenterState } from './useNotificationCenter';
import NotificationCenterDialog from './NotificationCenterDialog';
import NotificationToastStack from './NotificationToastStack';

const NotificationCenterContext = createContext<NotificationCenterState | null>(null);

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const value = useNotificationCenter();

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
      <NotificationCenterDialog />
      <NotificationToastStack
        notifications={value.toastNotifications}
        onDismiss={value.dismissToast}
        onOpen={(notification) => {
          if (!value.isRead(notification.id)) {
            value.markRead(notification.id);
          }
        }}
      />
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenterContext(): NotificationCenterState {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) {
    throw new Error('useNotificationCenterContext must be used within NotificationCenterProvider');
  }
  return ctx;
}
