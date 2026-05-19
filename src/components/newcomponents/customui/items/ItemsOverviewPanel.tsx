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
  error?: unknown;
  mayTruncate?: boolean;
  onView: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  emptyAction?: React.ReactNode;
}

const ItemsOverviewPanel: React.FC<ItemsOverviewPanelProps> = ({
  items,
  isLoading,
  error,
  mayTruncate,
  onView,
  onEdit,
  onDelete,
  emptyAction,
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
            <TooltipProvider>
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
            </TooltipProvider>
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
    [onView, onEdit, onDelete]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
        <p className="text-sm">Loading overview…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-destructive text-sm">Failed to load items. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 h-full overflow-y-auto p-6 space-y-4">
      {mayTruncate && (
        <p className="text-xs text-muted-foreground">
          Showing the first 100 items (API limit). Narrow filters or ask for a higher server cap if you
          need more.
        </p>
      )}

      <OrdersOverviewTable
        title="Items catalog"
        subtitle="Click a row to view details"
        columns={itemColumns}
        rows={items}
        onRowClick={onView}
        emptyIcon={<Package2 className="h-12 w-12 mb-3 opacity-40" />}
        emptyMessage="No items match these filters."
        className="flex-1 min-h-0"
      />
      {items.length === 0 && emptyAction ? (
        <div className="flex justify-center -mt-8">{emptyAction}</div>
      ) : null}
    </div>
  );
};

export default ItemsOverviewPanel;
