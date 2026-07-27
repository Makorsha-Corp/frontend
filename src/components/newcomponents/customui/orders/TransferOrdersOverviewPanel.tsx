import React, { useMemo } from 'react';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderHubStatsResponse } from '@/types/transferOrder';
import type { TransferOrderSummaryStats } from '@/pages/newpages/orders/transferOrdersOverviewData';
import { recentSummaryToTransferOrder } from '@/pages/newpages/orders/orderHubStatsMappers';
import TransferOrderActivityFeed from '@/components/newcomponents/customui/orders/TransferOrderActivityFeed';
import TransferOrderPendingActions from '@/components/newcomponents/customui/orders/TransferOrderPendingActions';
import { OrderOverviewKpiCard } from '@/components/newcomponents/customui/orders/OrderOverviewKpiCard';
import { Loader2 } from 'lucide-react';

interface TransferOrdersOverviewPanelProps {
  orders: TransferOrder[];
  stats: TransferOrderSummaryStats;
  hubStats?: TransferOrderHubStatsResponse | null;
  isLoading?: boolean;
  routeSubtext: (order: TransferOrder) => string;
  onSelectOrder: (id: number) => void;
}

const TransferOrdersOverviewPanel: React.FC<TransferOrdersOverviewPanelProps> = ({
  orders,
  stats,
  hubStats,
  isLoading,
  routeSubtext,
  onSelectOrder,
}) => {
  const activityOrders = useMemo(() => {
    if (hubStats?.recent_orders?.length) {
      return hubStats.recent_orders.map(recentSummaryToTransferOrder);
    }
    return orders;
  }, [hubStats?.recent_orders, orders]);
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
          footer="In current filter scope"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <TransferOrderActivityFeed
          orders={activityOrders}
          routeSubtext={routeSubtext}
          onSelectOrder={onSelectOrder}
        />
        <TransferOrderPendingActions
          pendingHighlights={hubStats ?? undefined}
          onSelectOrder={onSelectOrder}
        />
      </div>
    </div>
  );
};

export default TransferOrdersOverviewPanel;
