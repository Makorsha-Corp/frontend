import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGetSalesOrderItemsQuery } from '@/features/salesOrders/salesOrdersApi';
import type { SalesOrder } from '@/types/salesOrder';

interface SalesOrderListRowProps {
  order: SalesOrder;
  isSelected: boolean;
  onClick: () => void;
  accountName: string;
  statusLabel: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const SalesOrderListRow: React.FC<SalesOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  accountName,
  statusLabel,
  formatCurrency,
  formatDate,
}) => {
  const { data: items = [] } = useGetSalesOrderItemsQuery(order.id);
  const itemCount = items.length;
  const totalOrdered = items.reduce((sum, i) => sum + (i.quantity_ordered ?? 0), 0);
  const totalDelivered = items.reduce((sum, i) => sum + (i.quantity_delivered ?? 0), 0);
  const deliveredStatus =
    totalDelivered === 0 ? 'Pending' : totalDelivered >= totalOrdered ? 'Delivered' : 'Partial';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-card-foreground truncate">{order.sales_order_number}</span>
        <Badge variant="secondary" className="text-xs shrink-0">{statusLabel}</Badge>
      </div>
      <div className="text-sm text-muted-foreground truncate mt-0.5">{accountName}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
        <span>{formatDate(order.order_date)}</span>
        <span>•</span>
        <span>Factory #{order.factory_id}</span>
        <span>•</span>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span
          className={
            deliveredStatus === 'Delivered'
              ? 'text-green-600 dark:text-green-400'
              : deliveredStatus === 'Partial'
                ? 'text-amber-600 dark:text-amber-400'
                : ''
          }
        >
          {deliveredStatus}
        </span>
      </div>
      <div className="text-xs font-medium text-card-foreground mt-0.5">{formatCurrency(order.total_amount)}</div>
    </button>
  );
};

export default SalesOrderListRow;
