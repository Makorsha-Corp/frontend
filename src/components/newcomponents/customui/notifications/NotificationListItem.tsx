import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ChevronRight, ExternalLink, Mail, MailOpen, X } from 'lucide-react';
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
          'rounded-lg border border-border p-2 transition-colors',
          !isRead && 'border-l-4 border-l-brand-primary bg-card shadow-sm',
          isRead && 'border-l-4 border-l-transparent bg-muted/50'
        )}
      >
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
              visual.wrapClass
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', visual.colorClass)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm leading-tight',
                    isRead ? 'font-normal text-muted-foreground' : 'font-medium text-foreground'
                  )}
                >
                  {notification.title}
                </p>
                {notification.entityRef && (
                  <span className="mt-0.5 inline-flex rounded bg-muted/60 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                    {notification.entityRef}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[10px] leading-tight text-muted-foreground">{timeAgo}</span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{notification.body}</p>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
            <Link
              to={notification.href}
              onClick={() => {
                onNavigate?.();
                if (!isRead && onToggleRead) onToggleRead(notification.id);
              }}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Open
            </Link>
          </Button>
          {onToggleRead && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={isRead ? 'Mark unread' : 'Mark read'}
              onClick={() => onToggleRead(notification.id)}
            >
              {isRead ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
            </Button>
          )}
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Dismiss"
              onClick={() => onDismiss(notification.id)}
            >
              <X className="h-3.5 w-3.5" />
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
        !isRead && 'border-l-4 border-l-brand-primary bg-card',
        isRead && 'bg-muted/50',
        variant === 'compact' && 'py-2'
      )}
    >
      {content}
    </Link>
  );
};

export default NotificationListItem;
