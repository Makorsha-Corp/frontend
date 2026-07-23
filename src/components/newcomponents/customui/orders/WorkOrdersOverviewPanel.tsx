import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkOrder } from '@/types/workOrder';
import type { WorkOrderSummaryStats } from '@/pages/newpages/orders/workOrdersOverviewData';
import { getWorkOrderCalendarDateString } from '@/pages/newpages/orders/workOrderDateUtils';
import { workOrderDisplayLabel } from '@/pages/newpages/orders/workOrderConstants';
import OrdersOverviewTable, {
  type OrdersOverviewTableColumn,
} from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import { Wrench, Loader2 } from 'lucide-react';

interface WorkOrdersOverviewPanelProps {
  orders: WorkOrder[];
  stats: WorkOrderSummaryStats;
  isLoading?: boolean;
  mayTruncate?: boolean;
  statusLabel: (status: WorkOrder['status']) => string;
  priorityLabel: (priority: WorkOrder['priority']) => string;
  factoryName: (id: number) => string;
  machineName: (id: number | null) => string;
  formatDate: (d: string | null | undefined) => string;
  formatCurrency: (v: number | null | undefined) => string;
  onSelectOrder: (id: number) => void;
}

const WorkOrdersOverviewPanel: React.FC<WorkOrdersOverviewPanelProps> = ({
  orders,
  stats,
  isLoading,
  mayTruncate,
  statusLabel,
  priorityLabel,
  factoryName,
  machineName,
  formatDate,
  formatCurrency,
  onSelectOrder,
}) => {
  const formatCompactCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  const workOrderColumns = useMemo(
    (): OrdersOverviewTableColumn<WorkOrder>[] => [
      {
        id: 'work_order_number',
        header: 'WO#',
        cellClassName: 'font-medium',
        cell: (o) => o.work_order_number,
      },
      {
        id: 'description',
        header: 'Description',
        cellClassName: 'max-w-[160px] truncate',
        cell: (o) => workOrderDisplayLabel(o),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (o) => (
          <Badge
            variant={o.status === 'COMPLETED' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {statusLabel(o.status)}
          </Badge>
        ),
      },
      {
        id: 'work_order_type',
        header: 'Type',
        cellClassName: 'max-w-[100px] truncate text-muted-foreground',
        cell: (o) => o.work_order_type_name ?? '—',
      },
      {
        id: 'priority',
        header: 'Priority',
        cellClassName: 'text-muted-foreground',
        cell: (o) => priorityLabel(o.priority),
      },
      {
        id: 'factory',
        header: 'Factory',
        cellClassName: 'max-w-[120px] truncate',
        cell: (o) => factoryName(o.factory_id),
      },
      {
        id: 'machine',
        header: 'Machine',
        cellClassName: 'max-w-[120px] truncate text-muted-foreground',
        cell: (o) => machineName(o.machine_id),
      },
      {
        id: 'planned_date',
        header: 'Date',
        cellClassName: 'text-muted-foreground',
        cell: (o) => formatDate(getWorkOrderCalendarDateString(o)),
      },
      {
        id: 'cost',
        header: 'Cost',
        align: 'right',
        cellClassName: 'font-medium',
        cell: (o) => formatCurrency(o.cost),
      },
    ],
    [statusLabel, priorityLabel, factoryName, machineName, formatDate, formatCurrency]
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
          Showing the first 1,000 work orders. Narrow filters or ask for server-side pagination if you
          need more.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total work orders</CardTitle>
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
            <p className="text-xs text-muted-foreground mt-1">Not completed or cancelled</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{stats.pendingApprovalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting sign-off</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCompactCurrency(stats.totalCost)}</p>
            <p className="text-xs text-muted-foreground mt-1">Sum of order costs</p>
          </CardContent>
        </Card>
      </div>

      <OrdersOverviewTable
        title="Work orders"
        subtitle="Click a row to open details"
        columns={workOrderColumns}
        rows={orders}
        onRowClick={(o) => onSelectOrder(o.id)}
        emptyIcon={<Wrench className="h-12 w-12 mb-3 opacity-40" />}
        emptyMessage="No work orders match these filters."
        className="flex-1 min-h-0"
      />
    </div>
  );
};

export default WorkOrdersOverviewPanel;
