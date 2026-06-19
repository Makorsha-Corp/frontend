import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ChevronRight, Mail, MailOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AppNotification } from './notificationTypes';
import { getNotificationVisual } from './notificationVisuals';

export interface NotificationListItemProps {
  notification: AppNotification;
  isRead: boolean;
  variant?: 'default' | 'compact';
  showActions?: boolean;
  onNavigate?: () => void;
  onToggleRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const NotificationListItem: React.FC<NotificationListItemProps> = ({
  notification,
  isRead,
  variant = 'default',
  showActions = false,
  onNavigate,
  onToggleRead,
  onDismiss,
}) => {
  const visual = getNotificationVisual(notification.kind, notification.severity);
  const Icon = visual.icon;
  const timeAgo = formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true });

  const content = (
    <>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          visual.wrapClass
        )}
      >
        <Icon className={cn('h-4 w-4', visual.colorClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          {!isRead && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'truncate text-sm',
                isRead ? 'font-normal text-muted-foreground' : 'font-medium text-foreground'
              )}
            >
              {notification.title}
            </p>
            {variant === 'default' && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground/80">{timeAgo}</p>
          </div>
        </div>
      </div>
      {!showActions && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </>
  );

  if (showActions) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          !isRead && 'bg-brand-primary/5'
        )}
      >
        {content}
        <div className="flex shrink-0 items-center gap-1">
          {onToggleRead && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={isRead ? 'Mark unread' : 'Mark read'}
              onClick={() => onToggleRead(notification.id)}
            >
              {isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
            </Button>
          )}
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Dismiss"
              onClick={() => onDismiss(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      to={notification.href}
      onClick={() => {
        onNavigate?.();
        if (!isRead && onToggleRead) onToggleRead(notification.id);
      }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50',
        !isRead && 'bg-brand-primary/5',
        variant === 'compact' && 'py-2'
      )}
    >
      {content}
    </Link>
  );
};

export default NotificationListItem;
