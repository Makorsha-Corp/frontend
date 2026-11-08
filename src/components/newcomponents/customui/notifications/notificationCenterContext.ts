import { createContext, useContext } from 'react';
import type { NotificationCenterState } from './useNotificationCenter';

export const NotificationCenterContext = createContext<NotificationCenterState | null>(null);

export function useNotificationCenterContext(): NotificationCenterState {
  const ctx = useContext(NotificationCenterContext);
  if (!ctx) {
    throw new Error('useNotificationCenterContext must be used within NotificationCenterProvider');
  }
  return ctx;
}
