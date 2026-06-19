import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatusSlice } from '@/pages/newpages/orders/ordersOverviewData';

interface OrdersOverviewStatusPipelineProps {
  statusBreakdown: StatusSlice[];
  isLoading?: boolean;
  className?: string;
  subtitle?: string;
}

const OrdersOverviewStatusPipeline: React.FC<OrdersOverviewStatusPipelineProps> = ({
  statusBreakdown,
  isLoading,
  className,
  subtitle,
}) => {
  const maxStatus = statusBreakdown.length > 0 ? Math.max(...statusBreakdown.map((s) => s.count)) : 1;

  return (
    <Card className={cn('border-border h-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-card-foreground">Status pipeline</CardTitle>
        {subtitle ? <p className="text-xs text-muted-foreground mt-1">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : statusBreakdown.length === 0 ? (
          <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No orders in scope
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {statusBreakdown.map((slice) => {
              const pct = Math.max(6, (slice.count / maxStatus) * 100);
              return (
                <div key={slice.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="truncate font-medium">{slice.status}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{slice.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-brand-primary/60')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersOverviewStatusPipeline;
