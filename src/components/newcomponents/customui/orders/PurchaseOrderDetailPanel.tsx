import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetPurchaseOrderItemsQuery,
  useCreateInvoiceFromPurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import {
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  FileText,
  Calendar,
  DollarSign,
  ChevronRight,
  Trash2,
  Clock,
  StickyNote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ORDER_STATUS_WORKFLOW, getNextStatusId } from './orderStatusConstants';
import { API_LIMITS } from '@/constants/apiLimits';

interface PurchaseOrderDetailPanelProps {
  order: PurchaseOrder;
  onClose: () => void;
  onDelete: () => void;
  onUpdated?: () => void;
}

const PurchaseOrderDetailPanel: React.FC<PurchaseOrderDetailPanelProps> = ({
  order,
  onClose,
  onDelete,
  onUpdated,
}) => {
  const [updateOrder, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation();
  const [createInvoiceFromOrder, { isLoading: isCreatingInvoice }] =
    useCreateInvoiceFromPurchaseOrderMutation();
  const { data: items = [], isLoading: itemsLoading } = useGetPurchaseOrderItemsQuery(order.id);
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });

  const accountName = accounts.find((a) => a.id === order.account_id)?.name ?? `Supplier #${order.account_id}`;
  const statusLabel =
    statuses.find((s) => s.id === order.current_status_id)?.name ?? `Status #${order.current_status_id}`;

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const destinationLabel = () => {
    if (order.destination_type === 'storage') {
      const factory = factories.find((f) => f.id === order.destination_id);
      return factory ? `Storage · ${factory.name}` : 'Storage';
    }
    if (order.destination_type === 'machine') {
      const machine = machines.find((m) => m.id === order.destination_id);
      return machine ? `Machine · ${machine.name}` : `Machine #${order.destination_id}`;
    }
    if (order.destination_type === 'project') {
      const project = projects.find((p) => p.id === order.destination_id);
      return project ? `Project · ${project.name}` : `Project #${order.destination_id}`;
    }
    return `${order.destination_type} #${order.destination_id}`;
  };

  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;

  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));

  const totalOrdered = items.reduce((sum, i) => sum + i.quantity_ordered, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.quantity_received, 0);
  const receivedPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  const nextStatusId = getNextStatusId(order.current_status_id);
  const nextStatusLabel = nextStatusId
    ? (statuses.length > 0 ? statuses : ORDER_STATUS_WORKFLOW).find((s) => s.id === nextStatusId)?.name ??
      `#${nextStatusId}`
    : null;

  const handleStatusChange = async (statusId: number) => {
    try {
      await updateOrder({ id: order.id, data: { current_status_id: statusId } }).unwrap();
      toast.success('Status updated');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update status');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await createInvoiceFromOrder(order.id).unwrap();
      toast.success('Invoice created from purchase order');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create invoice');
    }
  };

  const hasNotes = order.description || order.order_note;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="mt-0.5 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">{order.po_number}</h1>
              <p className="text-sm text-muted-foreground">{accountName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={receivedPct >= 100 ? 'default' : 'secondary'}
              className={receivedPct >= 100 ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {statusLabel}
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

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        {/* Summary + Progress row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Destination</dt>
                  <dd className="font-medium mt-0.5">{destinationLabel()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Order Date</dt>
                  <dd className="font-medium mt-0.5">{formatDate(order.order_date ?? order.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Subtotal</dt>
                  <dd className="font-medium mt-0.5">{formatCurrency(Number(order.subtotal))}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Total</dt>
                  <dd className="font-semibold mt-0.5 text-card-foreground">
                    {formatCurrency(Number(order.total_amount))}
                  </dd>
                </div>
              </div>

              {/* Invoice section */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Invoice</span>
                  </div>
                  {order.invoice_id ? (
                    <Badge variant="outline" className="text-green-600 border-green-600/30">
                      Linked #{order.invoice_id}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateInvoice}
                      disabled={isCreatingInvoice}
                      className="h-7 text-xs"
                    >
                      {isCreatingInvoice ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Create Invoice'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Receiving Progress
              </CardTitle>
              <CardDescription>
                {totalReceived} of {totalOrdered} items received
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span
                    className={`font-semibold ${
                      receivedPct >= 100
                        ? 'text-green-600 dark:text-green-400'
                        : receivedPct > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {receivedPct}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      receivedPct >= 100
                        ? 'bg-green-500'
                        : receivedPct > 0
                          ? 'bg-amber-500'
                          : 'bg-muted-foreground/30'
                    }`}
                    style={{ width: `${Math.min(receivedPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Status action */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="secondary" className="ml-1">
                      {statusLabel}
                    </Badge>
                  </div>
                  {nextStatusId && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(nextStatusId)}
                      disabled={isUpdating}
                      className="h-7 text-xs bg-brand-primary hover:bg-brand-primary-hover"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          {nextStatusLabel}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Items
                <Badge variant="outline" className="ml-1 font-normal">
                  {items.length}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items in this order</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="py-2 w-12 text-center">#</TableHead>
                      <TableHead className="py-2">Item</TableHead>
                      <TableHead className="py-2 text-right">Ordered</TableHead>
                      <TableHead className="py-2 text-right">Received</TableHead>
                      <TableHead className="py-2 text-right">Unit Price</TableHead>
                      <TableHead className="py-2 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => {
                      const isComplete = it.quantity_received >= it.quantity_ordered;
                      return (
                        <TableRow
                          key={it.id}
                          className={isComplete ? 'bg-green-50/50 dark:bg-green-950/20' : ''}
                        >
                          <TableCell className="py-2 text-center text-muted-foreground text-sm">
                            {it.line_number}
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            {qtyWithUnit(it.quantity_ordered, it.item_unit)}
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            <span
                              className={
                                isComplete
                                  ? 'text-green-600 dark:text-green-400 font-medium'
                                  : it.quantity_received > 0
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : ''
                              }
                            >
                              {qtyWithUnit(it.quantity_received, it.item_unit)}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            {formatCurrency(Number(it.unit_price))}
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm font-medium">
                            {formatCurrency(Number(it.line_subtotal))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Card (minimal) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(order.created_at)}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Current status</span>
                <Badge variant="secondary">{statusLabel}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes Card (conditional) */}
        {hasNotes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.description && (
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                    Description
                  </dt>
                  <dd className="text-card-foreground">{order.description}</dd>
                </div>
              )}
              {order.order_note && (
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Order Note</dt>
                  <dd className="text-card-foreground">{order.order_note}</dd>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPanel;
