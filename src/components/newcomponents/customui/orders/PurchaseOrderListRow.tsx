import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { getPurchaseOrderListRowBadges } from './purchaseOrderMilestones';
import PurchaseOrderItemsHoverPreview from './PurchaseOrderItemsHoverPreview';

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
  const itemCount = order.item_count ?? 0;
  const previewNames = order.item_names_preview ?? [];
  const stageBadges = getPurchaseOrderListRowBadges(order);

  const totalOrdered = Number(order.quantity_ordered_total ?? 0);
  const totalReceived = Number(order.quantity_received_total ?? 0);
  const receivingHint =
    (order.current_status_name ?? '') === 'Receiving' && itemCount > 0
      ? `${totalReceived}/${totalOrdered} received`
      : null;

  const formattedDate = formatDate(order.created_at);

  const contextTitle = useMemo(
    () => [accountName, formattedDate, destinationLabel].join(' · '),
    [accountName, destinationLabel, formattedDate]
  );

  const hiddenCount =
    previewNames.length > 0 ? Math.max(0, itemCount - previewNames.length) : 0;
  const overflowSuffix = hiddenCount > 0 ? ` +${hiddenCount} more` : '';

  const itemNamesLabel = useMemo(() => {
    if (itemCount === 0) return 'No items';
    if (previewNames.length === 0) {
      return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    }
    return previewNames.join(', ');
  }, [itemCount, previewNames]);

  const itemNamesTitle = useMemo(() => {
    if (itemCount === 0) return 'No items';
    if (previewNames.length === 0) return itemNamesLabel;
    if (hiddenCount > 0) {
      return `${previewNames.join(', ')} and ${hiddenCount} more`;
    }
    return previewNames.join(', ');
  }, [hiddenCount, itemCount, itemNamesLabel, previewNames]);

  return (
    <div
      className={cn(
        'flex w-full items-center transition-colors',
        isSelected && 'bg-brand-primary/10 dark:bg-brand-primary/20 border-l-2 border-brand-primary'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left px-3.5 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex min-w-0 items-center justify-between gap-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <span className="truncate text-sm font-medium text-card-foreground">{order.po_number}</span>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
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
          <span className="shrink-0 text-sm font-semibold tabular-nums text-card-foreground">
            {formatCurrency(Number(order.total_amount))}
          </span>
        </div>

        <div
          className="mt-0.5 min-w-0 truncate text-xs leading-snug text-muted-foreground"
          title={contextTitle}
        >
          {accountName} · {formattedDate} · {destinationLabel}
        </div>

        <div
          className="mt-0.5 flex min-w-0 justify-end text-[11px] leading-tight text-muted-foreground"
          title={receivingHint ? `${itemNamesTitle} · ${receivingHint}` : itemNamesTitle}
        >
          <div className="flex min-w-0 max-w-full items-center justify-end text-right">
            {itemCount > 0 ? (
              <PurchaseOrderItemsHoverPreview
                purchaseOrderId={order.id}
                itemCount={itemCount}
                previewLabel={itemNamesLabel}
                overflowSuffix={overflowSuffix || undefined}
                contentAlign="end"
                className="min-w-0 max-w-full cursor-default underline-offset-2 hover:underline"
              />
            ) : (
              <span className="min-w-0 truncate">No items</span>
            )}
            {receivingHint ? <span className="shrink-0"> · {receivingHint}</span> : null}
          </div>
        </div>
      </button>

      {isSelected && onDelete && (
        <div className="flex shrink-0 items-center pr-2">
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
