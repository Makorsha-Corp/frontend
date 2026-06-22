import type { Item } from '@/types/item';

export interface ItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
}

export type ItemDetailsSectionId = 'overview' | 'placement' | 'purchasing' | 'activity';
