import React, { useState } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { useGetPurchaseOrderItemsQuery } from '@/features/purchaseOrders/purchaseOrdersApi';

interface PurchaseOrderItemsHoverPreviewProps {
  purchaseOrderId: number;
  itemCount: number;
  /** Inline label for list rows (item names only; pair with overflowSuffix). */
  previewLabel?: string;
  /** Shown after previewLabel without truncating (e.g. " +2 more"). */
  overflowSuffix?: string;
  /** Hover card horizontal alignment (list rows use end). */
  contentAlign?: 'start' | 'end';
  /** @deprecated Use className for compact list rows */
  chipClass?: string;
  className?: string;
}

const itemBubbleClass =
  'inline-flex max-w-full items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground';

const PurchaseOrderItemsHoverPreview: React.FC<PurchaseOrderItemsHoverPreviewProps> = ({
  purchaseOrderId,
  itemCount,
  previewLabel,
  overflowSuffix,
  contentAlign = 'start',
  chipClass,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useGetPurchaseOrderItemsQuery(purchaseOrderId, { skip: !open });

  const itemCountLabel = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
  const triggerLabel = previewLabel ?? itemCountLabel;
  const triggerClassName =
    className ??
    chipClass ??
    'inline cursor-default text-inherit underline-offset-2 hover:underline';

  if (itemCount <= 0) {
    return <span className={triggerClassName}>{previewLabel ?? itemCountLabel}</span>;
  }

  return (
    <HoverCard openDelay={120} closeDelay={80} open={open} onOpenChange={setOpen}>
      <HoverCardTrigger asChild>
        <span
          className={cn('flex min-w-0 max-w-full items-center justify-end text-right', triggerClassName)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span className="min-w-0 truncate">{triggerLabel}</span>
          {overflowSuffix ? (
            <span className="shrink-0">{overflowSuffix}</span>
          ) : null}
        </span>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent
          side="top"
          align={contentAlign}
          sideOffset={6}
          collisionPadding={12}
          className="z-[200] w-auto max-w-[min(16rem,calc(100vw-2rem))] border-0 bg-transparent p-0 shadow-none dark:bg-transparent"
        >
          <div className="flex flex-wrap gap-1">
            {items.map((item) => {
              const name = item.item_name ?? `Item #${item.item_id}`;
              const qty = Number(item.quantity_ordered);
              const unit = item.item_unit?.trim();
              const qtyLabel = unit && unit.length > 0 ? `${qty} ${unit}` : String(qty);
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
  );
};

export default PurchaseOrderItemsHoverPreview;
