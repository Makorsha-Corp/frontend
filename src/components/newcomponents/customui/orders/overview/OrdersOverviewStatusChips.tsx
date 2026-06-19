import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatusSlice } from '@/pages/newpages/orders/ordersOverviewData';

interface OrdersOverviewStatusChipsProps {
  statusBreakdown: StatusSlice[];
  activeStatus: string;
  onStatusChange: (status: string) => void;
  isLoading?: boolean;
}

const OrdersOverviewStatusChips: React.FC<OrdersOverviewStatusChipsProps> = ({
  statusBreakdown,
  activeStatus,
  onStatusChange,
  isLoading,
}) => {
  const totalCount = statusBreakdown.reduce((sum, slice) => sum + slice.count, 0);

  const handleChipClick = (status: string) => {
    if (activeStatus === status) {
      onStatusChange('all');
    } else {
      onStatusChange(status);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
        <span className="text-xs text-muted-foreground">Loading statuses…</span>
      </div>
    );
  }

  if (statusBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-border">
      {statusBreakdown.length > 1 ? (
        <button
          type="button"
          onClick={() => onStatusChange('all')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
            activeStatus === 'all'
              ? 'border-brand-primary/40 bg-brand-primary/10 ring-1 ring-brand-primary/30 font-medium'
              : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
          )}
        >
          All
          <span className="tabular-nums font-semibold text-foreground">{totalCount}</span>
        </button>
      ) : null}
      {statusBreakdown.map((slice) => {
        const isActive = activeStatus === slice.status;
        return (
          <button
            key={slice.status}
            type="button"
            onClick={() => handleChipClick(slice.status)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
              isActive
                ? 'border-brand-primary/40 bg-brand-primary/10 ring-1 ring-brand-primary/30 font-medium'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
            )}
          >
            <span>{slice.status}</span>
            <span className="tabular-nums font-semibold text-foreground">{slice.count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default OrdersOverviewStatusChips;
