import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ChevronRight, Cog, Loader2, Package, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FactoryActivityItem } from '@/pages/newpages/factories/factoriesOverviewData';
import { cn } from '@/lib/utils';

interface FactoriesFactoryActivityFeedProps {
  activities: FactoryActivityItem[];
  loading?: boolean;
  className?: string;
}

function activityIcon(item: FactoryActivityItem): React.ReactNode {
  if (item.id.startsWith('ledger-')) {
    return <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  if (item.id.startsWith('batch-')) {
    return <Package className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  return <Cog className="h-3.5 w-3.5 text-muted-foreground" />;
}

const feedRowClass =
  'flex w-full items-start gap-3 rounded-lg border border-border/60 bg-background px-2.5 py-2.5 text-left transition-colors';

const FactoriesFactoryActivityFeed: React.FC<FactoriesFactoryActivityFeedProps> = ({
  activities,
  loading,
  className,
}) => (
  <Card className={cn('flex h-full min-h-0 flex-col border-border bg-card shadow-sm', className)}>
    <CardHeader className="shrink-0 pb-3">
      <CardTitle className="flex items-center gap-2 text-base font-semibold">
        <Activity className="h-4 w-4 text-muted-foreground" />
        Recent activity (7d)
      </CardTitle>
    </CardHeader>
    <CardContent className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-0">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading activity…
        </div>
      ) : activities.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <div className="space-y-2">
          {activities.map((item) => {
            const content = (
              <>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/50">
                  {activityIcon(item)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">{item.description}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.subtext}</p>
                </div>
                <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
                {item.href ? (
                  <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : null}
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={cn(feedRowClass, 'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
                >
                  {content}
                </Link>
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

export default FactoriesFactoryActivityFeed;
