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

  const chipClass = 'inline-flex items-center bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[11px]';
  const receivedChipClass =
    receivedStatus === 'Received'
      ? 'inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[11px] font-medium'
      : receivedStatus === 'Partial'
        ? 'inline-flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[11px] font-medium'
        : chipClass;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
        isSelected ? 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary' : ''
      }`}
    >
      {/* Row 1: PO# + Status badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-card-foreground truncate">{order.po_number}</span>
        <Badge variant="secondary" className="text-[11px] shrink-0">
          {statusLabel}
        </Badge>
      </div>

      {/* Row 2: Supplier name */}
      <div className="text-sm text-muted-foreground truncate mt-1">{accountName}</div>

      {/* Row 3: Metadata chips */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className={chipClass}>{formatDate(order.created_at)}</span>
        <span className={chipClass}>{destinationLabel}</span>
        <span className={chipClass}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Row 4: Received status + Total */}
      <div className="flex items-center justify-between mt-2">
        <span className={receivedChipClass}>{receivedStatus}</span>
        <span className="text-sm font-semibold text-card-foreground">
          {formatCurrency(Number(order.total_amount))}
        </span>
      </div>
    </button>
  );
};

export default PurchaseOrderListRow;
