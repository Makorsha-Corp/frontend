import type { CSSProperties } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  APP_TOAST_DEFAULTS,
  APP_TOAST_DURATIONS,
} from '@/lib/appToast';

const toastStyle: CSSProperties = {
  background: 'hsl(var(--card))',
  color: 'hsl(var(--card-foreground))',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  borderRadius: '0.75rem',
  padding: '12px 16px',
  fontSize: '0.875rem',
  maxWidth: '22rem',
};

/** Single app-wide react-hot-toast host — mount once in main.tsx. */
export function AppToaster() {
  return (
    <Toaster
      position={APP_TOAST_DEFAULTS.position}
      containerStyle={{
        bottom: APP_TOAST_DEFAULTS.containerBottomOffsetPx,
      }}
      toastOptions={{
        duration: APP_TOAST_DEFAULTS.duration,
        style: toastStyle,
        success: {
          duration: APP_TOAST_DURATIONS.success,
          style: toastStyle,
        },
        error: {
          duration: APP_TOAST_DURATIONS.error,
          style: toastStyle,
        },
      }}
    />
  );
}

export default AppToaster;
