import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { PurchaseOrderSummaryStats } from '@/pages/newpages/orders/purchaseOrdersOverviewData';
import OrdersOverviewTable, {
  type OrdersOverviewTableColumn,
} from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface PurchaseOrdersOverviewPanelProps {
  orders: PurchaseOrder[];
  stats: PurchaseOrderSummaryStats;
  isLoading?: boolean;
  mayTruncate?: boolean;
  accountName: (id: number) => string;
  statusLabel: (id: number) => string;
  destinationLabel: (order: PurchaseOrder) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}

const PurchaseOrdersOverviewPanel: React.FC<PurchaseOrdersOverviewPanelProps> = ({
  orders,
  stats,
  isLoading,
  mayTruncate,
  accountName,
  statusLabel,
  destinationLabel,
  formatCurrency,
  formatDate,
  onSelectOrder,
}) => {
  const formatCompactCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  const purchaseOrderColumns = useMemo(
    (): OrdersOverviewTableColumn<PurchaseOrder>[] => [
      {
        id: 'po_number',
        header: 'PO#',
        cellClassName: 'font-medium',
        cell: (o) => o.po_number,
      },
      {
        id: 'supplier',
        header: 'Supplier',
        cellClassName: 'max-w-[140px] truncate',
        cell: (o) => accountName(o.account_id),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (o) => (
          <Badge variant="secondary" className="text-xs">
            {statusLabel(o.current_status_id)}
          </Badge>
        ),
      },
      {
        id: 'destination',
        header: 'Destination',
        cellClassName: 'max-w-[160px] truncate text-muted-foreground',
        cell: (o) => destinationLabel(o),
      },
      {
        id: 'total',
        header: 'Total',
        align: 'right',
        cellClassName: 'font-medium',
        cell: (o) => formatCurrency(Number(o.total_amount)),
      },
      {
        id: 'created',
        header: 'Created',
        cellClassName: 'text-muted-foreground',
        cell: (o) => formatDate(o.created_at),
      },
      {
        id: 'invoice',
        header: 'Invoice',
        cell: (o) => (
          <Badge variant={o.invoice_id != null ? 'default' : 'outline'} className="text-xs">
            {o.invoice_id != null ? 'Yes' : 'No'}
          </Badge>
        ),
      },
    ],
    [accountName, statusLabel, destinationLabel, formatCurrency, formatDate]
  );

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

      <OrdersOverviewTable
        title="Purchase orders"
        subtitle="Click a row to open details"
        columns={purchaseOrderColumns}
        rows={orders}
        onRowClick={(o) => onSelectOrder(o.id)}
        emptyIcon={<ShoppingCart className="h-12 w-12 mb-3 opacity-40" />}
        emptyMessage="No purchase orders match these filters."
        className="flex-1 min-h-0"
      />
    </div>
  );
};

export default PurchaseOrdersOverviewPanel;
