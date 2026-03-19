import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useGetTransferOrderItemsQuery } from '@/features/transferOrders/transferOrdersApi';
import type { TransferOrder } from '@/types/transferOrder';

interface TransferOrderListRowProps {
  order: TransferOrder;
  isSelected: boolean;
  onClick: () => void;
  statusLabel: string;
  formatDate: (d: string | null | undefined) => string;
}

const TransferOrderListRow: React.FC<TransferOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  statusLabel,
  formatDate,
}) => {
  const { data: items = [] } = useGetTransferOrderItemsQuery(order.id);
  const itemCount = items.length;
  const approvedCount = items.filter((i) => i.approved).length;
  const approvedStatus = approvedCount === 0 ? 'Pending' : approvedCount >= itemCount ? 'Approved' : 'Partial';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-card-foreground truncate">{order.transfer_number}</span>
        <Badge variant="secondary" className="text-xs shrink-0">{statusLabel}</Badge>
      </div>
      <div className="text-sm text-muted-foreground truncate mt-0.5">
        {order.source_location_type} → {order.destination_location_type}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
        <span>{formatDate(order.order_date)}</span>
        <span>•</span>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
        <span>•</span>
        <span
          className={
            approvedStatus === 'Approved'
              ? 'text-green-600 dark:text-green-400'
              : approvedStatus === 'Partial'
                ? 'text-amber-600 dark:text-amber-400'
                : ''
          }
        >
          {approvedStatus}
        </span>
      </div>
    </button>
  );
};

export default TransferOrderListRow;
