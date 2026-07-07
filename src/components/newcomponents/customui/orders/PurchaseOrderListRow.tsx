import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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

  const itemBubbleClass =
    'inline-flex max-w-full items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground';

  const itemCountLabel = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

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
          {itemCount > 0 ? (
            <HoverCard openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>
                <span
                  className={cn(chipClass, 'cursor-default hover:bg-muted/80 hover:text-foreground')}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {itemCountLabel}
                </span>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent
                  side="top"
                  align="start"
                  sideOffset={6}
                  collisionPadding={12}
                  className="z-[200] w-auto max-w-[min(16rem,calc(100vw-2rem))] border-0 bg-transparent p-0 shadow-none dark:bg-transparent"
                >
                  <div className="flex flex-wrap gap-1">
                    {items.map((item) => {
                      const name = item.item_name ?? `Item #${item.item_id}`;
                      const qty = Number(item.quantity_ordered);
                      const unit = item.item_unit?.trim();
                      const qtyLabel =
                        unit && unit.length > 0 ? `${qty} ${unit}` : String(qty);
                      return (
                        <span key={item.id} className={itemBubbleClass} title={`${name} · ${qtyLabel}`}>
                          <span className="truncate">{name}</span>
                          <span className="ml-1 shrink-0 text-muted-foreground">· {qtyLabel}</span>
                        </span>
                      );
                    })}
                  </div>
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          ) : (
            <span className={chipClass}>{itemCountLabel}</span>
          )}
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
