import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderSummaryStats } from '@/pages/newpages/orders/transferOrdersOverviewData';
import { transferRouteTypeLabel } from '@/pages/newpages/orders/transferOrderLocationLabels';
import OrdersOverviewTable, {
  type OrdersOverviewTableColumn,
} from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import { ArrowLeftRight, Loader2 } from 'lucide-react';

interface TransferOrdersOverviewPanelProps {
  orders: TransferOrder[];
  stats: TransferOrderSummaryStats;
  isLoading?: boolean;
  mayTruncate?: boolean;
  routeLabel: (order: TransferOrder) => string;
  statusLabel: (id: number) => string;
  formatDate: (d: string | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}

const TransferOrdersOverviewPanel: React.FC<TransferOrdersOverviewPanelProps> = ({
  orders,
  stats,
  isLoading,
  mayTruncate,
  routeLabel,
  statusLabel,
  formatDate,
  onSelectOrder,
}) => {
  const transferOrderColumns = useMemo(
    (): OrdersOverviewTableColumn<TransferOrder>[] => [
      {
        id: 'transfer_number',
        header: 'TR#',
        cellClassName: 'font-medium',
        cell: (o) => o.transfer_number,
      },
      {
        id: 'route',
        header: 'Route',
        cellClassName: 'max-w-[220px] truncate text-muted-foreground',
        cell: (o) => routeLabel(o),
      },
      {
        id: 'route_types',
        header: 'Types',
        cellClassName: 'max-w-[140px] truncate text-muted-foreground text-xs',
        cell: (o) => transferRouteTypeLabel(o),
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
        id: 'order_date',
        header: 'Order date',
        cellClassName: 'text-muted-foreground',
        cell: (o) => formatDate(o.order_date),
      },
      {
        id: 'created',
        header: 'Created',
        cellClassName: 'text-muted-foreground',
        cell: (o) => formatDate(o.created_at),
      },
    ],
    [routeLabel, statusLabel, formatDate]
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
          Showing the first 1,000 transfer orders. Narrow filters or ask for server-side pagination if
          you need more.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.totalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">In current filter scope</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.openCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Not completed yet</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Finished transfers</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Machine legs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.machineInvolvedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Source or destination is a machine</p>
          </CardContent>
        </Card>
      </div>

      <OrdersOverviewTable
        title="Transfer orders"
        subtitle="Click a row to open details"
        columns={transferOrderColumns}
        rows={orders}
        onRowClick={(o) => onSelectOrder(o.id)}
        emptyIcon={<ArrowLeftRight className="h-12 w-12 mb-3 opacity-40" />}
        emptyMessage="No transfer orders match these filters."
        className="flex-1 min-h-0"
      />
    </div>
  );
};

export default TransferOrdersOverviewPanel;
