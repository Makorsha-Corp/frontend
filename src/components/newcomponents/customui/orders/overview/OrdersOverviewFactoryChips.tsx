import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TopFactoryRow } from '@/types/ordersOverview';

interface OrdersOverviewFactoryChipsProps {
  factories: TopFactoryRow[];
  factoryFilter: string;
  onFactoryFilterChange: (factoryId: string) => void;
  isLoading?: boolean;
}

const OrdersOverviewFactoryChips: React.FC<OrdersOverviewFactoryChipsProps> = ({
  factories,
  factoryFilter,
  onFactoryFilterChange,
  isLoading,
}) => {
  const topThree = factories.slice(0, 3);

  const handleChipClick = (factoryId: number) => {
    const id = String(factoryId);
    if (factoryFilter === id) {
      onFactoryFilterChange('all');
    } else {
      onFactoryFilterChange(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
        <span className="text-xs text-muted-foreground">Loading factories…</span>
      </div>
    );
  }

  if (topThree.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-t border-border">
      <span className="text-xs text-muted-foreground shrink-0">Most orders:</span>
      {topThree.map((factory, index) => {
        const id = String(factory.factory_id);
        const isActive = factoryFilter === id;
        return (
          <button
            key={factory.factory_id}
            type="button"
            onClick={() => handleChipClick(factory.factory_id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
              isActive
                ? 'border-brand-primary/40 bg-brand-primary/10 ring-1 ring-brand-primary/30 font-medium'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
            )}
          >
            <span className={index === 0 ? 'font-medium text-foreground' : ''}>
              {factory.factory_name}
            </span>
            <span className="tabular-nums font-semibold text-foreground">{factory.order_count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default OrdersOverviewFactoryChips;
