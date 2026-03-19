import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGetSalesOrderItemsQuery } from '@/features/salesOrders/salesOrdersApi';
import type { SalesOrder } from '@/types/salesOrder';

interface SalesOrderCardOverlayProps {
  order: SalesOrder;
  accountName: string;
  statusLabel: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

/**
 * Visual copy of SalesOrderCard for DragOverlay.
 * Follows cursor during drag - no draggable logic.
 */
const SalesOrderCardOverlay: React.FC<SalesOrderCardOverlayProps> = ({
  order,
  accountName,
  statusLabel,
  formatCurrency,
  formatDate,
}) => {
  const { data: items = [] } = useGetSalesOrderItemsQuery(order.id);
  const itemCount = items.length;

  return (
    <div
      className="rounded-lg border border-border bg-card p-3 shadow-lg cursor-grabbing w-[280px]"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-mono text-muted-foreground truncate">{order.sales_order_number}</span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {statusLabel}
        </Badge>
      </div>
      <p className="font-medium text-card-foreground truncate text-sm">{accountName}</p>
      <p className="text-sm font-semibold text-brand-primary mt-1">{formatCurrency(order.total_amount)}</p>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>{formatDate(order.order_date)}</span>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default SalesOrderCardOverlay;
