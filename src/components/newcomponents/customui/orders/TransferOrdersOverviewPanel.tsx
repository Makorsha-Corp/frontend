import React from 'react';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderSummaryStats } from '@/pages/newpages/orders/transferOrdersOverviewData';
import TransferOrderActivityFeed from '@/components/newcomponents/customui/orders/TransferOrderActivityFeed';
import TransferOrderPendingActions from '@/components/newcomponents/customui/orders/TransferOrderPendingActions';
import { OrderOverviewKpiCard } from '@/components/newcomponents/customui/orders/OrderOverviewKpiCard';
import { Loader2 } from 'lucide-react';

interface TransferOrdersOverviewPanelProps {
  orders: TransferOrder[];
  stats: TransferOrderSummaryStats;
  isLoading?: boolean;
  mayTruncate?: boolean;
  routeSubtext: (order: TransferOrder) => string;
  onSelectOrder: (id: number) => void;
}

const TransferOrdersOverviewPanel: React.FC<TransferOrdersOverviewPanelProps> = ({
  orders,
  stats,
  isLoading,
  mayTruncate,
  routeSubtext,
  onSelectOrder,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto p-6 space-y-6">
      {mayTruncate && (
        <p className="text-xs text-muted-foreground">
          Showing the first 1,000 transfer orders. Narrow filters or ask for server-side pagination if
          you need more.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OrderOverviewKpiCard
          title="Total transfers"
          value={stats.totalCount}
          footer="In current filter scope"
        />
        <OrderOverviewKpiCard
          title="Open pipeline"
          value={stats.openCount}
          footer="Not completed yet"
        />
        <OrderOverviewKpiCard
          title="Completed"
          value={stats.completedCount}
          footer="Finished transfers"
        />
        <OrderOverviewKpiCard
          title="Machine legs"
          value={stats.machineInvolvedCount}
          footer="Machine in route"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <TransferOrderActivityFeed orders={orders} routeSubtext={routeSubtext} />
        <TransferOrderPendingActions orders={orders} onSelectOrder={onSelectOrder} />
      </div>
    </div>
  );
};

export default TransferOrdersOverviewPanel;
