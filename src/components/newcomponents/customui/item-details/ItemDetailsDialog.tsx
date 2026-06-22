import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetItemSummaryQuery } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import ItemTagBadge from '@/components/newcomponents/customui/ItemTagBadge';
import { cn } from '@/lib/utils';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import ItemDetailsTabs from './ItemDetailsTabs';
import { formatDate } from './itemDetailsFormatters';
import type { PurchasingPeriod } from './itemDetailsPurchasing';
import type { ItemDetailsDialogProps } from './itemDetailsTypes';

const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({
  open,
  onOpenChange,
  item,
  onEdit,
  onDelete,
}) => {
  const itemId = item?.id ?? 0;
  const [purchasingPeriod, setPurchasingPeriod] = useState<PurchasingPeriod>('days_90');

  const { data: summary, isLoading, isFetching, error } = useGetItemSummaryQuery(itemId, {
    skip: !open || !itemId,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!open) setPurchasingPeriod('days_90');
  }, [open]);

  const displayItem = summary?.item ?? item;
  const loading = isLoading || (isFetching && !summary);
  const tags = summary?.item.tags ?? [];
  const description = displayItem?.description?.trim();

  if (!displayItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[66vh] max-h-[66vh] w-[min(760px,94vw)] max-w-none flex-col gap-0 overflow-hidden',
          'border-border bg-card p-0 text-card-foreground shadow-lg sm:rounded-lg'
        )}
      >
        <div className="h-1 shrink-0 bg-brand-primary/45" aria-hidden />

        <div className="absolute right-14 top-3 z-[90] flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => onEdit(displayItem as Item)}
            aria-label="Edit item"
            title="Edit item"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(displayItem as Item)}
            aria-label="Delete item"
            title="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative shrink-0 border-b border-border">
          <DialogHeader className="space-y-0 px-5 py-4 pr-[9.25rem] text-left">
            <DialogTitle className="flex min-w-0 items-baseline gap-1.5 text-lg font-semibold tracking-tight">
              <span className="truncate">{displayItem.name}</span>
              <span className="shrink-0 text-sm font-normal text-muted-foreground">
                · {displayItem.unit}
              </span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="mt-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={displayItem.is_active ? 'secondary' : 'outline'} className="text-xs">
                    {displayItem.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {displayItem.sku ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      SKU {displayItem.sku}
                    </span>
                  ) : null}
                  {tags.map((tag) => (
                    <ItemTagBadge
                      key={tag.id}
                      tag={{
                        id: tag.id,
                        name: tag.name,
                        tag_code: tag.tag_code,
                        color: tag.color,
                        icon: tag.icon,
                        is_system_tag: tag.is_system_tag,
                      }}
                    />
                  ))}
                </div>
                {description ? (
                  <p className="text-sm leading-relaxed text-card-foreground">{description}</p>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand-primary" />
              <p className="text-sm">Loading item details…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
              Failed to load item summary. Basic catalog info is still shown above.
            </div>
          ) : summary ? (
            <ItemDetailsTabs
              summary={summary}
              unit={displayItem.unit}
              itemId={itemId}
              dialogOpen={open}
              purchasingPeriod={purchasingPeriod}
              onPurchasingPeriodChange={setPurchasingPeriod}
              onNavigate={() => onOpenChange(false)}
            />
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-5 py-3 sm:justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Item #{displayItem.id}
            {displayItem.updated_at ? ` · Updated ${formatDate(displayItem.updated_at)}` : null}
            {' · '}
            Delete marks this item inactive — it stays in history.
          </p>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsDialog;
