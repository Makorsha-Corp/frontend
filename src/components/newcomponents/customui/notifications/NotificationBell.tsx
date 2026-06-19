import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationCenterContext } from './NotificationCenterProvider';
import NotificationListItem from './NotificationListItem';

interface NotificationBellProps {
  collapsed?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ collapsed = false }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const {
    unreadCount,
    unreadPreview,
    isRead,
    markAllRead,
    toggleRead,
    openDialog,
  } = useNotificationCenterContext();

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'relative shrink-0 text-white/80 hover:bg-white/10 hover:text-white',
            collapsed && 'h-9 w-9'
          )}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {badgeLabel}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border-border bg-popover text-popover-foreground"
        align={collapsed ? 'start' : 'end'}
        side="right"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs text-brand-primary hover:underline"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {unreadPreview.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up
            </p>
          ) : (
            <div className="divide-y divide-border">
              {unreadPreview.map((n) => (
                <NotificationListItem
                  key={n.id}
                  notification={n}
                  isRead={isRead(n.id)}
                  variant="compact"
                  onNavigate={() => setPopoverOpen(false)}
                  onToggleRead={toggleRead}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setPopoverOpen(false);
              openDialog('all');
            }}
          >
            View all
          </button>
          {unreadCount > unreadPreview.length && (
            <span className="text-xs text-muted-foreground">
              +{unreadCount - unreadPreview.length} more unread
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
