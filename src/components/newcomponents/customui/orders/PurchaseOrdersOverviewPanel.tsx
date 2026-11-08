import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { PurchaseOrderHubStatsResponse } from '@/types/purchaseOrder';
import type { PurchaseOrderSummaryStats } from '@/pages/newpages/orders/purchaseOrdersOverviewData';
import { recentSummaryToPurchaseOrder } from '@/pages/newpages/orders/orderHubStatsMappers';
import PurchaseOrderActivityFeed from '@/components/newcomponents/customui/orders/PurchaseOrderActivityFeed';
import PurchaseOrderPendingActions from '@/components/newcomponents/customui/orders/PurchaseOrderPendingActions';
import { OrderOverviewKpiCard } from '@/components/newcomponents/customui/orders/OrderOverviewKpiCard';
import { Loader2 } from 'lucide-react';

interface PurchaseOrdersOverviewPanelProps {
  orders: PurchaseOrder[];
  stats: PurchaseOrderSummaryStats;
  hubStats?: PurchaseOrderHubStatsResponse | null;
  isLoading?: boolean;
  accountName: (id: number) => string;
  statusLabel: (id: number) => string;
  onSelectOrder: (id: number) => void;
  /** Hide recent/pending order rows during a whole-page tour (KPIs stay). */
  hideOrderLists?: boolean;
}

const PurchaseOrdersOverviewPanel: React.FC<PurchaseOrdersOverviewPanelProps> = ({
  orders,
  stats,
  hubStats,
  isLoading,
  accountName,
  statusLabel,
  onSelectOrder,
  hideOrderLists = false,
}) => {
  const { t } = useTranslation('orders');
  const activityOrders = useMemo(() => {
    if (hideOrderLists) return [];
    if (hubStats?.recent_orders?.length) {
      return hubStats.recent_orders.map(recentSummaryToPurchaseOrder);
    }
    return orders;
  }, [hideOrderLists, hubStats?.recent_orders, orders]);
  const formatCompactCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">{t('loadingOverview')}</p>
      </div>
    );
  }

  return (
    <div
      data-help-tour="purchase.overview"
      className="flex flex-col min-h-0 h-full overflow-y-auto p-6 space-y-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OrderOverviewKpiCard
          title={t('kpiTotalOrders')}
          value={stats.totalCount}
          footer={t('kpiInFilterScope')}
        />
        <OrderOverviewKpiCard
          title={t('kpiTotalValue')}
          value={formatCompactCurrency(stats.totalValue)}
          footer={t('kpiSumOrderTotals')}
        />
        <OrderOverviewKpiCard
          title={t('kpiOpenPipeline')}
          value={stats.openCount}
          footer={t('kpiAmountNotCompleted', {
            amount: formatCompactCurrency(stats.openValue),
          })}
        />
        <OrderOverviewKpiCard
          title={t('kpiNotInvoiced')}
          value={stats.notInvoicedCount}
          footer={t('kpiNoLinkedInvoice')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <PurchaseOrderActivityFeed
          orders={activityOrders}
          accountName={accountName}
          statusLabel={statusLabel}
          onSelectOrder={onSelectOrder}
        />
        <PurchaseOrderPendingActions
          pendingHighlights={hideOrderLists ? undefined : (hubStats ?? undefined)}
          onSelectOrder={onSelectOrder}
        />
      </div>
    </div>
  );
};

export default PurchaseOrdersOverviewPanel;
