import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityFeedItem {
  id: string;
  icon: React.ReactNode;
  description: string;
  subtext: string;
  timestamp: Date;
  /** Order id — row opens detail when `onSelectItem` is provided */
  targetId?: number;
}

export interface OrderActivityFeedProps {
  title?: string;
  titleIcon?: React.ReactNode;
  activities: ActivityFeedItem[];
  emptyMessage?: string;
  className?: string;
  onSelectItem?: (id: number) => void;
}

const feedRowClass =
  'flex w-full items-start gap-3 rounded-lg border border-border/60 bg-background px-2.5 py-2.5 text-left transition-colors';

const OrderActivityFeed: React.FC<OrderActivityFeedProps> = ({
  title = 'Recent Activity',
  titleIcon,
  activities,
  emptyMessage = 'No recent activity',
  className,
  onSelectItem,
}) => {
  return (
    <Card className={`border-border flex flex-col min-h-0 ${className ?? ''}`}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {titleIcon ?? <Activity className="h-4 w-4 text-muted-foreground" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-2">
            {activities.map((item) => {
              const clickable =
                item.targetId != null && onSelectItem != null;
              const content = (
                <>
                  <div className="mt-0.5 shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted/50">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.subtext}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </span>
                  {clickable ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-1 text-muted-foreground" />
                  ) : null}
                </>
              );

              if (clickable) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item.targetId!)}
                    className={cn(
                      feedRowClass,
                      'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div key={item.id} className={feedRowClass}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderActivityFeed;
