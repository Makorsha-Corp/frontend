import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { PurchaseOrderSummaryStats } from '@/pages/newpages/orders/purchaseOrdersOverviewData';
import PurchaseOrderActivityFeed from '@/components/newcomponents/customui/orders/PurchaseOrderActivityFeed';
import PurchaseOrderPendingActions from '@/components/newcomponents/customui/orders/PurchaseOrderPendingActions';
import { Loader2 } from 'lucide-react';

interface PurchaseOrdersOverviewPanelProps {
  orders: PurchaseOrder[];
  stats: PurchaseOrderSummaryStats;
  isLoading?: boolean;
  mayTruncate?: boolean;
  accountName: (id: number) => string;
  statusLabel: (id: number) => string;
  onSelectOrder: (id: number) => void;
}

const PurchaseOrdersOverviewPanel: React.FC<PurchaseOrdersOverviewPanelProps> = ({
  orders,
  stats,
  isLoading,
  mayTruncate,
  accountName,
  statusLabel,
  onSelectOrder,
}) => {
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
        <p className="text-sm">Loading overview…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto p-6 space-y-6">
      {mayTruncate && (
        <p className="text-xs text-muted-foreground">
          Showing the first 1,000 purchase orders. Narrow filters or ask for server-side pagination if you need more.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">In current filter scope</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCompactCurrency(stats.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Sum of order totals</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.openCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCompactCurrency(stats.openValue)} not completed
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Not invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.notInvoicedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">No linked invoice yet</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <PurchaseOrderActivityFeed
          orders={orders}
          accountName={accountName}
          statusLabel={statusLabel}
        />
        <PurchaseOrderPendingActions
          orders={orders}
          onSelectOrder={onSelectOrder}
        />
      </div>
    </div>
  );
};

export default PurchaseOrdersOverviewPanel;
