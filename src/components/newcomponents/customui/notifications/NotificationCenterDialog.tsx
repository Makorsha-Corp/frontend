import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Inbox, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
import {
  EmphasisTabPanel,
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { useNotificationCenterContext } from './notificationCenterContext';
import NotificationListItem from './NotificationListItem';
import { groupNotificationsByDate } from './notificationVisuals';
import type { NotificationFilter } from './notificationTypes';

const FILTER_TAB_IDS: NotificationFilter[] = ['all', 'unread', 'approvals', 'alerts', 'discussions'];

const FILTER_LABEL_KEYS: Record<NotificationFilter, string> = {
  all: 'filterAll',
  unread: 'filterUnread',
  approvals: 'filterApprovals',
  alerts: 'filterAlerts',
  discussions: 'filterDiscussions',
};

const EMPTY_FILTER_KEYS: Record<NotificationFilter, string> = {
  all: 'emptyAll',
  unread: 'emptyUnread',
  approvals: 'emptyApprovals',
  alerts: 'emptyAlerts',
  discussions: 'emptyDiscussions',
};

const DATE_GROUP_KEYS = {
  today: 'dateToday',
  yesterday: 'dateYesterday',
  earlier: 'dateEarlier',
} as const;

const NotificationCenterDialog: React.FC = () => {
  const { t } = useTranslation('notifications');
  const {
    dialogOpen,
    setDialogOpen,
    filter,
    setFilter,
    filteredForDialog,
    filterUnreadCounts,
    isRead,
    toggleRead,
    dismiss,
    markManyRead,
  } = useNotificationCenterContext();

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredForDialog),
    [filteredForDialog]
  );

  const handleClose = () => setDialogOpen(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="flex h-[min(80vh,720px)] w-[min(40rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <EmphasisTabsProvider value={filter}>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as NotificationFilter)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-center gap-2">
                <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                <DialogTitle className="text-base">{t('dialogTitle')}</DialogTitle>
              </div>
              <EmphasisTabsList className="mt-3">
                {FILTER_TAB_IDS.map((tabId) => {
                  const tabUnread = filterUnreadCounts[tabId];
                  return (
                    <EmphasisTabsTrigger key={tabId} value={tabId} className="px-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="truncate">{t(FILTER_LABEL_KEYS[tabId])}</span>
                        {tabUnread > 0 && (
                          <span className="shrink-0 rounded-full bg-brand-primary/10 px-1.5 py-px text-[10px] font-semibold tabular-nums text-brand-primary">
                            {tabUnread > 9 ? '9+' : tabUnread}
                          </span>
                        )}
                      </span>
                    </EmphasisTabsTrigger>
                  );
                })}
              </EmphasisTabsList>
            </DialogHeader>

            <EmphasisTabPanel
              panelKey={filter}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
            >
              {filteredForDialog.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                    {filter === 'unread' ? (
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    ) : filter === 'discussions' ? (
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{t(EMPTY_FILTER_KEYS[filter])}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {filter === 'discussions' ? t('emptyDiscussionsHint') : t('emptyDefaultHint')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedNotifications.map(({ group, items }) => {
                    const unreadInGroup = items.filter((n) => !isRead(n.id));
                    return (
                      <section key={group}>
                        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t(DATE_GROUP_KEYS[group])}
                        </p>
                        <div className="space-y-2">
                          {items.map((n) => (
                            <NotificationListItem
                              key={n.id}
                              notification={n}
                              isRead={isRead(n.id)}
                              showActions
                              onNavigate={handleClose}
                              onToggleRead={toggleRead}
                              onDismiss={dismiss}
                            />
                          ))}
                        </div>
                        {unreadInGroup.length > 0 && (
                          <button
                            type="button"
                            onClick={() => markManyRead(unreadInGroup.map((n) => n.id))}
                            className="mt-2 w-full rounded-md border border-border py-2 text-xs font-medium text-brand-primary transition-colors hover:bg-muted/40"
                          >
                            {t('markAllRead')}
                          </button>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}
            </EmphasisTabPanel>
          </Tabs>
        </EmphasisTabsProvider>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationCenterDialog;
