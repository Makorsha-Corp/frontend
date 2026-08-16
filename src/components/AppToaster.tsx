import { Toaster } from 'react-hot-toast';
import {
  APP_TOAST_DEFAULTS,
  APP_TOAST_DURATIONS,
  APP_TOAST_STYLE,
} from '@/lib/appToast';

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
        style: APP_TOAST_STYLE,
        success: {
          duration: APP_TOAST_DURATIONS.success,
          style: APP_TOAST_STYLE,
        },
        error: {
          duration: APP_TOAST_DURATIONS.error,
          style: APP_TOAST_STYLE,
        },
      }}
    />
  );
}

export default AppToaster;
