import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Item } from '@/types/item';
import { Pencil, Trash2 } from 'lucide-react';

interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({ open, onOpenChange, item, onEdit, onDelete }) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>Item details and actions</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">ID</p>
              <p className="font-medium">{item.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Unit</p>
              <p className="font-medium">{item.unit}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
            <p className="text-sm">{item.description || '—'}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tags</p>
            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border"
                    style={{
                      borderColor: tag.color || '#9067c6',
                      color: tag.color || 'inherit',
                    }}
                  >
                    <span>{tag.name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailsDialog;

