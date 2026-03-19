import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetSalesOrderItemsQuery,
  useGetSalesOrderDeliveriesQuery,
  useUpdateSalesOrderMutation,
} from '@/features/salesOrders/salesOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { SalesOrder } from '@/types/salesOrder';
import type { Account } from '@/types/account';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderStatusActions from './OrderStatusActions';

interface SalesOrderDetailPanelProps {
  order: SalesOrder;
  accounts: Account[];
  onClose: () => void;
  onUpdated?: () => void;
}

const SalesOrderDetailPanel: React.FC<SalesOrderDetailPanelProps> = ({
  order,
  accounts,
  onClose,
  onUpdated,
}) => {
  const { data: items = [], isLoading: itemsLoading } = useGetSalesOrderItemsQuery(order.id);
  const { data: deliveries = [] } = useGetSalesOrderDeliveriesQuery(order.id);
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: 100 });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateSalesOrderMutation();

  const accountName = accounts.find((a) => a.id === order.account_id)?.name ?? `#${order.account_id}`;

  const formatCurrency = (v: number | null | undefined) =>
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v) : '—';
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) =>
    unit ? `${qty} ${unit}` : String(qty);

  const statusLabel = statuses.find((s) => s.id === order.current_status_id)?.name ?? `#${order.current_status_id}`;

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
    <div className="flex flex-col gap-6">
      <div className="shrink-0 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">{order.sales_order_number}</h2>
            <p className="text-sm text-muted-foreground mt-1">Customer: {accountName}</p>
            <p className="text-sm text-muted-foreground">Factory ID: {order.factory_id}</p>
          </div>
          <Badge variant="secondary">{statusLabel}</Badge>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><span className="text-muted-foreground">Total:</span> {formatCurrency(order.total_amount)}</span>
          <span><span className="text-muted-foreground">Order date:</span> {formatDate(order.order_date)}</span>
          <span><span className="text-muted-foreground">Expected delivery:</span> {formatDate(order.expected_delivery_date)}</span>
          <span><span className="text-muted-foreground">Fully delivered:</span> {order.is_fully_delivered ? 'Yes' : 'No'}</span>
          <span><span className="text-muted-foreground">Invoiced:</span> {order.is_invoiced ? 'Yes' : 'No'}</span>
        </div>

        {order.notes && <p className="text-sm text-muted-foreground">{order.notes}</p>}

        {deliveries.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-card-foreground mb-2">Deliveries ({deliveries.length})</h3>
            <div className="border border-border rounded-lg divide-y">
              {deliveries.map((d: { id: number; delivery_number?: string; scheduled_date?: string; actual_delivery_date?: string; delivery_status?: string }) => (
                <div key={d.id} className="px-4 py-2 flex justify-between text-sm">
                  <span>{d.delivery_number ?? `#${d.id}`}</span>
                  <span className="text-muted-foreground">
                    {d.delivery_status ?? '—'} • {formatDate(d.actual_delivery_date ?? d.scheduled_date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-card-foreground">Items ({items.length})</h3>
        </div>
        {itemsLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No items</p>
        ) : (
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="py-2 w-10">#</TableHead>
                  <TableHead className="py-2">Item name</TableHead>
                  <TableHead className="py-2">Qty ordered</TableHead>
                  <TableHead className="py-2">Qty delivered</TableHead>
                  <TableHead className="py-2">Unit price</TableHead>
                  <TableHead className="py-2">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, idx) => (
                  <TableRow key={it.id} className="border-b border-border">
                    <TableCell className="py-2 text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="py-2">
                      <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                    </TableCell>
                    <TableCell className="py-2">{qtyWithUnit(it.quantity_ordered, it.item_unit)}</TableCell>
                    <TableCell className="py-2">{qtyWithUnit(it.quantity_delivered, it.item_unit)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(it.unit_price)}</TableCell>
                    <TableCell className="py-2">{formatCurrency(it.line_total)}</TableCell>
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
        />
      </div>
    </div>
  );
};

export default SalesOrderDetailPanel;
