import type { CSSProperties, ReactElement } from 'react';
import toast, { type Toast, type ToastOptions } from 'react-hot-toast';

/** Global react-hot-toast defaults — edit here to change app-wide behavior. */
export const APP_TOAST_DEFAULTS = {
  position: 'bottom-right' as const,
  duration: 4000,
  containerBottomOffsetPx: 16,
} as const;

export const APP_TOAST_DURATIONS = {
  success: 4000,
  error: 5000,
  auth: 3000,
  neutral: 4000,
} as const;

export const APP_TOAST_IDS = {
  sessionExpired: 'session-expired',
  loginSuccess: 'login-success',
} as const;

/** Shared card styling for action toasts and notification popups. */
export const APP_TOAST_STYLE: CSSProperties = {
  background: 'hsl(var(--card))',
  color: 'hsl(var(--card-foreground))',
  border: '1px solid hsl(var(--border))',
  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  borderRadius: '0.75rem',
  padding: '12px 16px',
  fontSize: '0.875rem',
  maxWidth: '22rem',
};

function mergeOptions(
  options: ToastOptions | undefined,
  defaults: Partial<ToastOptions>,
): ToastOptions {
  return {
    ...defaults,
    ...options,
    style: { ...defaults.style, ...options?.style },
  };
}

export const appToast = {
  success(message: string, options?: ToastOptions): string {
    return toast.success(
      message,
      mergeOptions(options, {
        duration: APP_TOAST_DURATIONS.success,
        style: APP_TOAST_STYLE,
      }),
    );
  },

  error(message: string, options?: ToastOptions): string {
    return toast.error(
      message,
      mergeOptions(options, {
        duration: APP_TOAST_DURATIONS.error,
        style: APP_TOAST_STYLE,
      }),
    );
  },

  /** Non-success/error feedback (warnings, info) without default green/red icons. */
  neutral(message: string, options?: ToastOptions): string {
    return toast(
      message,
      mergeOptions(options, {
        duration: APP_TOAST_DURATIONS.neutral,
        style: APP_TOAST_STYLE,
      }),
    );
  },

  loading(message: string, options?: ToastOptions): string {
    return toast.loading(
      message,
      mergeOptions(options, {
        style: APP_TOAST_STYLE,
      }),
    );
  },

  dismiss(toastId?: string): void {
    toast.dismiss(toastId);
  },

  promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
    options?: ToastOptions,
  ): Promise<T> {
    return toast.promise(
      promise,
      messages,
      mergeOptions(options, { style: APP_TOAST_STYLE }),
    );
  },

  custom(render: (t: Toast) => ReactElement, options?: ToastOptions): string {
    return toast.custom(render, mergeOptions(options, { style: APP_TOAST_STYLE }));
  },
};

export default appToast;
