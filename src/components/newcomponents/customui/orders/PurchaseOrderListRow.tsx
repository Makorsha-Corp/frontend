import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGetPurchaseOrderItemsQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';

interface PurchaseOrderListRowProps {
  order: PurchaseOrder;
  isSelected: boolean;
  onClick: () => void;
  accountName: string;
  statusLabel: string;
  destinationLabel: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const PurchaseOrderListRow: React.FC<PurchaseOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  accountName,
  statusLabel,
  destinationLabel,
  formatCurrency,
  formatDate,
}) => {
  const { data: items = [] } = useGetPurchaseOrderItemsQuery(order.id);

  const itemCount = items.length;
  const totalOrdered = items.reduce((sum, i) => sum + i.quantity_ordered, 0);
  const totalReceived = items.reduce((sum, i) => sum + i.quantity_received, 0);
  const receivedStatus =
    totalReceived === 0
      ? 'Pending'
      : totalReceived >= totalOrdered
        ? 'Received'
        : 'Partial';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-card-foreground truncate">{order.po_number}</span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {statusLabel}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground truncate mt-0.5">{accountName}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
        <span>{formatDate(order.created_at)}</span>
        <span>•</span>
        <span>{destinationLabel}</span>
        <span>•</span>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span
          className={
            receivedStatus === 'Received'
              ? 'text-green-600 dark:text-green-400'
              : receivedStatus === 'Partial'
                ? 'text-amber-600 dark:text-amber-400'
                : ''
          }
        >
          {receivedStatus}
        </span>
      </div>
      <div className="text-xs font-medium text-card-foreground mt-0.5">
        {formatCurrency(Number(order.total_amount))}
      </div>
    </button>
  );
};

export default PurchaseOrderListRow;
