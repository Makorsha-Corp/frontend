import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { useGetPurchaseOrderItemsQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { getPurchaseOrderListRowBadges } from './purchaseOrderMilestones';

interface PurchaseOrderListRowProps {
  order: PurchaseOrder;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  accountName: string;
  destinationLabel: string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
}

const PurchaseOrderListRow: React.FC<PurchaseOrderListRowProps> = ({
  order,
  isSelected,
  onClick,
  onDelete,
  accountName,
  destinationLabel,
  formatCurrency,
  formatDate,
}) => {
  const { data: items = [] } = useGetPurchaseOrderItemsQuery(order.id);

  const itemCount = items.length;
  const stageBadges = getPurchaseOrderListRowBadges(order);

  const chipClass =
    'inline-flex items-center bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded text-[11px]';

  const receivingHint =
    (order.current_status_name ?? '') === 'Receiving' && itemCount > 0
      ? (() => {
          const totalOrdered = items.reduce((sum, i) => sum + Number(i.quantity_ordered), 0);
          const totalReceived = items.reduce((sum, i) => sum + Number(i.quantity_received), 0);
          return `${totalReceived}/${totalOrdered} received`;
        })()
      : null;

  return (
    <div
      className={cn(
        'flex w-full transition-colors',
        isSelected && 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-card-foreground truncate">{order.po_number}</span>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {stageBadges.map((badge) => (
              <Badge
                key={badge.label}
                variant="secondary"
                className={cn('text-[11px] font-medium', badge.className)}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground truncate mt-1">{accountName}</div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={chipClass}>{formatDate(order.created_at)}</span>
          <span className={chipClass}>{destinationLabel}</span>
          <span className={chipClass}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {receivingHint ? (
              <span className={cn(chipClass, 'font-medium')}>{receivingHint}</span>
            ) : null}
          </div>
          <span className="text-sm font-semibold text-card-foreground">
            {formatCurrency(Number(order.total_amount))}
          </span>
        </div>
      </button>

      {isSelected && onDelete && (
        <div className="flex shrink-0 items-start pt-2.5 pr-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Delete order"
            aria-label={`Delete ${order.po_number}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderListRow;
