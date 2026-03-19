import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetPurchaseOrderItemsQuery,
  useUpdatePurchaseOrderMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderStatusActions from './OrderStatusActions';

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
  const { data: items = [], isLoading: itemsLoading } = useGetPurchaseOrderItemsQuery(order.id);
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: 100 });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: 100 });

  const accountName = accounts.find((a) => a.id === order.account_id)?.name ?? `#${order.account_id}`;
  const statusLabel = statuses.find((s) => s.id === order.current_status_id)?.name ?? `#${order.current_status_id}`;
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) =>
    unit ? `${qty} ${unit}` : String(qty);

  const formatCurrency = (v: number | null | undefined) =>
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v) : '—';

  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  const destinationLabel = () => {
    if (order.destination_type === 'storage') {
      const factory = factories.find((f) => f.id === order.destination_id);
      return factory ? `Storage (${factory.name})` : 'Storage';
    }
    if (order.destination_type === 'machine') {
      return `Machine #${order.destination_id}`;
    }
    return `${order.destination_type} #${order.destination_id}`;
  };

  const totalOrdered = items.reduce((sum, i) => sum + i.quantity_ordered, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.quantity_received, 0);
  const receivedPct = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

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

  return (
    <div className="p-6 flex flex-col gap-6 min-h-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Order details */}
      <div className="shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-card-foreground">{order.po_number}</h2>
          <Badge variant="secondary" className="shrink-0">{statusLabel}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Supplier</dt>
            <dd className="font-medium">{accountName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Destination</dt>
            <dd className="font-medium">{destinationLabel()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatCurrency(Number(order.subtotal))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd>{formatCurrency(Number(order.total_amount))}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Received</dt>
            <dd>
              <span className={receivedPct >= 100 ? 'text-green-600 dark:text-green-400 font-medium' : receivedPct > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                {totalReceived} / {totalOrdered}
                {totalOrdered > 0 && ` (${receivedPct}%)`}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(order.created_at)}</dd>
          </div>
          {order.invoice_id && (
            <div>
              <dt className="text-muted-foreground">Invoice</dt>
              <dd className="text-green-600 dark:text-green-400">Linked #{order.invoice_id}</dd>
            </div>
          )}
        </dl>

        {(order.description || order.order_note) && (
          <div className="text-sm text-muted-foreground space-y-1">
            {order.description && <p>{order.description}</p>}
            {order.order_note && <p>Note: {order.order_note}</p>}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 min-h-0 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-card-foreground">Items ({items.length})</h3>
        </div>
        {itemsLoading ? (
          <div className="flex items-center gap-2 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No items</p>
        ) : (
          <div className="border border-border rounded-lg overflow-auto flex-1 min-h-0">
            <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2 w-10">#</TableHead>
                    <TableHead className="py-2">Item name</TableHead>
                    <TableHead className="py-2">Qty ordered</TableHead>
                    <TableHead className="py-2">Qty received</TableHead>
                    <TableHead className="py-2">Unit price</TableHead>
                    <TableHead className="py-2">Line subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id} className="border-b border-border">
                      <TableCell className="py-2 text-muted-foreground">{it.line_number}</TableCell>
                      <TableCell className="py-2">
                        <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                      </TableCell>
                      <TableCell className="py-2">{qtyWithUnit(it.quantity_ordered, it.item_unit)}</TableCell>
                      <TableCell className="py-2">
                        <span className={it.quantity_received >= it.quantity_ordered ? 'text-green-600 dark:text-green-400' : ''}>
                          {qtyWithUnit(it.quantity_received, it.item_unit)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">{formatCurrency(Number(it.unit_price))}</TableCell>
                      <TableCell className="py-2">{formatCurrency(Number(it.line_subtotal))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>

      {/* Actions - after items */}
      <div className="shrink-0 pt-2">
        <OrderStatusActions
          currentStatusId={order.current_status_id}
          onStatusChange={handleStatusChange}
          isLoading={isUpdating}
          statuses={statuses}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPanel;
