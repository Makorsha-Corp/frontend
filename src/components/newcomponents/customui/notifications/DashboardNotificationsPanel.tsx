import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotificationCenterContext } from './NotificationCenterProvider';
import NotificationListItem from './NotificationListItem';

const DashboardNotificationsPanel: React.FC = () => {
  const { unreadCount, overviewPreview, isRead, toggleRead, openDialog, notifications } =
    useNotificationCenterContext();

  const isEmpty = notifications.length === 0;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <CardTitle className="text-card-foreground text-base">Notifications</CardTitle>
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[11px] font-medium text-brand-primary">
              {unreadCount}
            </span>
          )}
        </div>
        {!isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs text-muted-foreground"
            onClick={() => openDialog()}
          >
            View all
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isEmpty ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing new</p>
        ) : (
          <>
            <div className="divide-y divide-border">
              {overviewPreview.map((n) => (
                <NotificationListItem
                  key={n.id}
                  notification={n}
                  isRead={isRead(n.id)}
                  variant="compact"
                  onToggleRead={toggleRead}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => openDialog()}
              className="flex w-full items-center justify-center gap-1 border-t border-border py-2.5 text-sm font-medium text-brand-primary hover:bg-muted/40 transition-colors"
            >
              Open notification center
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardNotificationsPanel;
