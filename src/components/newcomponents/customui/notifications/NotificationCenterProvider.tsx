import React from 'react';
import { useNotificationCenter } from './useNotificationCenter';
import NotificationCenterDialog from './NotificationCenterDialog';
import { NotificationCenterContext } from './notificationCenterContext';

export { useNotificationCenterContext } from './notificationCenterContext';

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const value = useNotificationCenter();

  return (
    <NotificationCenterContext.Provider value={value}>
      {children}
      <NotificationCenterDialog />
    </NotificationCenterContext.Provider>
  );
}
