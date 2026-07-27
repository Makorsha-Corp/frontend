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
  headerActions?: React.ReactNode;
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
  headerActions,
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

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <OrdersOverviewTable
            title="Items catalog"
            headerActions={headerActions}
            columns={itemColumns}
            rows={items}
            onRowClick={onView}
            emptyIcon={<Package2 className="h-12 w-12 mb-3 opacity-40" />}
            emptyMessage="No items match these filters."
            className="border-0 shadow-none"
            cardClassName="border-0 shadow-none"
          />
          {items.length === 0 && emptyAction ? (
            <div className="flex justify-center pb-6">{emptyAction}</div>
          ) : null}
          {isFetching && items.length > 0 ? (
            <p className="px-4 pb-2 text-xs text-muted-foreground">Refreshing…</p>
          ) : null}
        </div>
        {paginationFooter}
      </div>
    </TooltipProvider>
  );
};

export default ItemsOverviewPanel;
