import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetWorkOrderItemsQuery,
  useUpdateWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import type { WorkOrder } from '@/types/workOrder';
import type { WorkOrderStatus } from '@/types/workOrder';
import {
  ArrowLeft,
  Loader2,
  Package,
  Wrench,
  StickyNote,
  Trash2,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  WORK_ORDER_STATUSES,
  priorityLabel,
  workOrderStatusLabel,
  workTypeLabel,
} from '@/pages/newpages/orders/workOrderConstants';

interface WorkOrderDetailPanelProps {
  order: WorkOrder;
  onClose: () => void;
  onDelete: () => void;
  onStatusUpdated?: () => void;
}

const WorkOrderDetailPanel: React.FC<WorkOrderDetailPanelProps> = ({
  order,
  onClose,
  onDelete,
  onStatusUpdated,
}) => {
  const { data: items = [], isLoading: itemsLoading } = useGetWorkOrderItemsQuery(order.id);
  const { data: factories = [] } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: machines = [] } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateWorkOrderMutation();

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));
  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
      : '—';

  const factoryName =
    factories.find((f) => f.id === order.factory_id)?.name ?? `Factory #${order.factory_id}`;
  const machineName = order.machine_id
    ? machines.find((m) => m.id === order.machine_id)?.name ?? `Machine #${order.machine_id}`
    : '—';

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    try {
      await updateOrder({ id: order.id, data: { status: newStatus } }).unwrap();
      toast.success(`Status updated to ${workOrderStatusLabel(newStatus)}`);
      onStatusUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update status');
    }
  };

  const hasNotes = order.description || order.notes || order.completion_notes;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="mt-0.5 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">{order.work_order_number}</h1>
              <p className="text-sm text-muted-foreground">{order.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={order.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {workOrderStatusLabel(order.status)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Order
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                Work order details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Work type</dt>
                  <dd className="font-medium mt-0.5">{workTypeLabel(order.work_type)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Priority</dt>
                  <dd className="font-medium mt-0.5">{priorityLabel(order.priority)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Factory</dt>
                  <dd className="font-medium mt-0.5">{factoryName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Machine</dt>
                  <dd className="font-medium mt-0.5">{machineName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Cost</dt>
                  <dd className="font-semibold mt-0.5">{formatCurrency(order.cost)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Assigned to</dt>
                  <dd className="font-medium mt-0.5">{order.assigned_to ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Start</dt>
                  <dd className="font-medium mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDate(order.start_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">End</dt>
                  <dd className="font-medium mt-0.5">{formatDate(order.end_date)}</dd>
                </div>
              </div>
              <div className="pt-2 border-t border-border flex flex-wrap gap-2 text-xs">
                {order.order_approved && (
                  <Badge variant="outline" className="text-green-600 border-green-600/30">
                    Order approved
                  </Badge>
                )}
                {order.cost_approved && (
                  <Badge variant="outline" className="text-green-600 border-green-600/30">
                    Cost approved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasNotes ? (
                <div className="text-sm space-y-2">
                  {order.description && (
                    <p>
                      <span className="text-muted-foreground">Description: </span>
                      {order.description}
                    </p>
                  )}
                  {order.notes && (
                    <p>
                      <span className="text-muted-foreground">Notes: </span>
                      {order.notes}
                    </p>
                  )}
                  {order.completion_notes && (
                    <p>
                      <span className="text-muted-foreground">Completion: </span>
                      {order.completion_notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes for this order.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Update status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {WORK_ORDER_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={order.status === s ? 'default' : 'outline'}
                  size="sm"
                  disabled={isUpdating || order.status === s}
                  onClick={() => handleStatusChange(s)}
                  className={order.status === s ? 'bg-brand-primary hover:bg-brand-primary-hover' : ''}
                >
                  {workOrderStatusLabel(s)}
                </Button>
              ))}
            </div>
            {order.status === 'COMPLETED' && order.machine_id && (
              <p className="text-xs text-muted-foreground mt-3">
                A maintenance log was created for this machine when the order was completed.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Items ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {itemsLoading ? (
              <div className="flex items-center gap-2 py-8 px-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading items…</span>
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 px-6">No items</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="py-2 w-10">#</TableHead>
                      <TableHead className="py-2">Item name</TableHead>
                      <TableHead className="py-2">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, idx) => (
                      <TableRow key={it.id} className="border-b border-border">
                        <TableCell className="py-2 text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="py-2">
                          <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                        </TableCell>
                        <TableCell className="py-2">{qtyWithUnit(it.quantity, it.item_unit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkOrderDetailPanel;
