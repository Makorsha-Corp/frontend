import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useGetSalesOrderItemsQuery } from '@/features/salesOrders/salesOrdersApi';
import type { SalesOrder } from '@/types/salesOrder';

interface SalesOrderCardProps {
  order: SalesOrder;
  accountName: string;
  statusLabel: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  onClick: () => void;
}

const SalesOrderCard: React.FC<SalesOrderCardProps> = ({
  order,
  accountName,
  statusLabel,
  formatCurrency,
  formatDate,
  onClick,
}) => {
  const { data: items = [] } = useGetSalesOrderItemsQuery(order.id);
  const itemCount = items.length;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sales-order-${order.id}`,
    data: { order },
  });

  const style = transform && !isDragging
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        rounded-lg border border-border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing
        hover:border-brand-primary/50 hover:shadow-md transition-all
        ${isDragging ? 'opacity-0 pointer-events-none' : ''}
      `}
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

export default SalesOrderCard;
