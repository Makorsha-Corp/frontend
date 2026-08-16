import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Item } from '@/types/item';
import { Package2 } from 'lucide-react';

const DEFAULT_TAG_COLOR = '#9067c6';

export interface ItemCatalogCardProps {
  item: Item;
  onView: (item: Item) => void;
}

const ItemCatalogCard: React.FC<ItemCatalogCardProps> = ({ item, onView }) => {
  return (
    <Card
      className="cursor-pointer border-border p-3 transition-colors hover:border-brand-primary/25 hover:bg-muted/30"
      onClick={() => onView(item)}
    >
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 ring-1 ring-brand-primary/25"
          aria-hidden
        >
          <Package2 className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {item.unit}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs tabular-nums text-muted-foreground">#{item.id}</span>
            {item.tags && item.tags.length > 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color || DEFAULT_TAG_COLOR }}
                      />
                    ))}
                    {item.tags.length > 6 ? (
                      <span className="text-xs text-muted-foreground">+{item.tags.length - 6}</span>
                    ) : null}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    {item.tags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2 text-sm">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color || DEFAULT_TAG_COLOR }}
                        />
                        {tag.name}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {item.description ? (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default ItemCatalogCard;
