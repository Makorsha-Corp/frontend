import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Item } from '@/types/item';
import ItemCatalogCard from '@/components/newcomponents/customui/items/ItemCatalogCard';
import OrdersOverviewTable, {
  type OrdersOverviewTableColumn,
} from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import { Package2, Loader2, Eye, Pencil, Trash2 } from 'lucide-react';

interface ItemsOverviewPanelProps {
  items: Item[];
  isLoading?: boolean;
  isFetching?: boolean;
  error?: unknown;
  onView: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  emptyAction?: React.ReactNode;
  paginationFooter?: React.ReactNode;
}

const ItemsOverviewPanel: React.FC<ItemsOverviewPanelProps> = ({
  items,
  isLoading,
  isFetching,
  error,
  onView,
  onEdit,
  onDelete,
  emptyAction,
  paginationFooter,
}) => {
  const itemColumns = useMemo(
    (): OrdersOverviewTableColumn<Item>[] => [
      {
        id: 'id',
        header: 'ID',
        cellClassName: 'font-mono text-sm text-muted-foreground w-[72px]',
        cell: (i) => i.id,
      },
      {
        id: 'name',
        header: 'Name',
        cellClassName: 'font-medium max-w-[200px] truncate',
        cell: (i) => i.name,
      },
      {
        id: 'unit',
        header: 'Unit',
        cell: (i) => (
          <Badge variant="secondary" className="text-xs">
            {i.unit}
          </Badge>
        ),
      },
      {
        id: 'description',
        header: 'Description',
        cellClassName: 'max-w-[240px] truncate text-muted-foreground',
        cell: (i) => i.description || '—',
      },
      {
        id: 'tags',
        header: 'Tags',
        cell: (i) =>
          i.tags && i.tags.length > 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
                  {i.tags.slice(0, 6).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color || '#9067c6' }}
                    />
                  ))}
                  {i.tags.length > 6 && (
                    <span className="text-xs text-muted-foreground">+{i.tags.length - 6}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  {i.tags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color || '#9067c6' }}
                      />
                      {tag.name}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        headerClassName: 'w-[120px]',
        cell: (i) => (
          <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="View"
              onClick={() => onView(i)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit"
              onClick={() => onEdit(i)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete"
              onClick={() => onDelete(i)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading overview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="text-destructive text-sm">Failed to load items. Please try again.</p>
      </div>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-muted-foreground">
      <Package2 className="mb-3 h-12 w-12 opacity-40" />
      <p className="text-sm text-center">No items match these filters.</p>
      {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="hidden shrink-0 border-b border-border px-4 py-3 lg:block">
          <h2 className="text-base font-semibold leading-none text-card-foreground">Items catalog</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            emptyState
          ) : (
            <>
              <div className="space-y-2 p-3 lg:hidden">
                {items.map((item) => (
                  <ItemCatalogCard key={item.id} item={item} onView={onView} />
                ))}
              </div>
              <div className="hidden lg:block">
                <OrdersOverviewTable
                  title="Items catalog"
                  hideHeader
                  disableInnerScroll
                  columns={itemColumns}
                  rows={items}
                  onRowClick={onView}
                  className="border-0 shadow-none"
                  cardClassName="border-0 shadow-none"
                />
              </div>
            </>
          )}
          {isFetching && items.length > 0 ? (
            <p className="px-4 pb-2 text-xs text-muted-foreground">Refreshing…</p>
          ) : null}
        </div>

        {paginationFooter ? <div className="shrink-0">{paginationFooter}</div> : null}
      </div>
    </TooltipProvider>
  );
};

export default ItemsOverviewPanel;
