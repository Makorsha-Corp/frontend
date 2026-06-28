import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AppNotification } from './notificationTypes';
import { getNotificationVisual } from './notificationVisuals';

const AUTO_DISMISS_MS = 8_000;
const MAX_VISIBLE = 5;

export interface NotificationToastStackProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  onOpen?: (notification: AppNotification) => void;
}

function NotificationToast({
  notification,
  onDismiss,
  onOpen,
}: {
  notification: AppNotification;
  onDismiss: () => void;
  onOpen: () => void;
}) {
  const visual = getNotificationVisual(notification.kind, notification.severity);
  const Icon = visual.icon;

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-border',
        'bg-background shadow-lg ring-1 ring-black/5 dark:ring-white/10'
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full items-start gap-3 px-3 py-3 pr-10 text-left transition-colors hover:bg-muted/40"
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              visual.wrapClass
            )}
          >
            <Icon className={cn('h-4 w-4', visual.colorClass)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
              {notification.title}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
            {notification.entityRef && (
              <span className="mt-2 inline-flex rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {notification.entityRef}
              </span>
            )}
          </div>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7 shrink-0 text-muted-foreground"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

const NotificationToastStack: React.FC<NotificationToastStackProps> = ({
  notifications,
  onDismiss,
  onOpen,
}) => {
  const navigate = useNavigate();
  const visible = notifications.slice(0, MAX_VISIBLE);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col-reverse gap-2"
      aria-label="New notifications"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
            onOpen={() => {
              onOpen?.(notification);
              onDismiss(notification.id);
              navigate(notification.href);
            }}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default NotificationToastStack;
