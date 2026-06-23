import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotificationCenterContext } from './NotificationCenterProvider';

interface NotificationBellProps {
  collapsed?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ collapsed = false }) => {
  const { unreadCount, openDialog } = useNotificationCenterContext();

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'relative shrink-0 text-white/80 hover:bg-white/10 hover:text-white',
        collapsed && 'h-9 w-9'
      )}
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      onClick={() => openDialog('all')}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {badgeLabel}
        </span>
      )}
    </Button>
  );
};

export default NotificationBell;
