import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useNotificationCenterContext } from './NotificationCenterProvider';
import NotificationListItem from './NotificationListItem';
import { getFilterEmptyMessage } from './notificationVisuals';
import type { NotificationFilter, NotificationPreferenceKey } from './notificationTypes';

const FILTER_TABS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'alerts', label: 'Alerts' },
];

const PREFERENCE_ROWS: { key: NotificationPreferenceKey; label: string; description: string }[] = [
  {
    key: 'order_approvals',
    label: 'Order approvals',
    description: 'Assignments, pending approvals, section confirms, invoices',
  },
  {
    key: 'low_stock',
    label: 'Low stock',
    description: 'Inventory below reorder point',
  },
  {
    key: 'project_updates',
    label: 'Project updates',
    description: 'Deadlines and project activity',
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    description: 'Machine service schedules',
  },
  {
    key: 'system',
    label: 'System',
    description: 'Workspace and account events',
  },
];

const NotificationCenterDialog: React.FC = () => {
  const {
    dialogOpen,
    setDialogOpen,
    filter,
    setFilter,
    filteredForDialog,
    unreadCount,
    isRead,
    toggleRead,
    dismiss,
    markAllRead,
    preferences,
    setPreference,
  } = useNotificationCenterContext();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="flex h-[min(80vh,720px)] w-[min(42rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>Notification center</DialogTitle>
            {unreadCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === tab.id
                    ? 'bg-brand-primary text-white'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredForDialog.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                {getFilterEmptyMessage(filter)}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filteredForDialog.map((n) => (
                  <NotificationListItem
                    key={n.id}
                    notification={n}
                    isRead={isRead(n.id)}
                    showActions
                    onToggleRead={toggleRead}
                    onDismiss={dismiss}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="shrink-0 border-t border-border bg-muted/20 p-4 md:w-56 md:border-l md:border-t-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Preferences
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Mock settings — saved locally until a backend exists.
            </p>
            <div className="space-y-4">
              {PREFERENCE_ROWS.map((row) => (
                <div key={row.key} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Label htmlFor={`pref-${row.key}`} className="text-sm font-medium">
                      {row.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </div>
                  <Switch
                    id={`pref-${row.key}`}
                    checked={preferences[row.key]}
                    onCheckedChange={(checked) => setPreference(row.key, checked)}
                  />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenterDialog;
