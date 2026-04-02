import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateItemMutation } from '@/features/items/itemsApi';
import { Item } from '@/types/item';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import ItemTagPickerSection from '@/components/newcomponents/customui/ItemTagPickerSection';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}

const EditItemDialog: React.FC<EditItemDialogProps> = ({ open, onOpenChange, item }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [updateItem, { isLoading }] = useUpdateItemMutation();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setUnit(item.unit);
      setSelectedTagIds(item.tags?.map((t) => t.id) || []);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!unit.trim()) {
      toast.error('Unit is required');
      return;
    }

    try {
      await updateItem({
        id: item.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          unit: unit.trim(),
          tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        },
      }).unwrap();

      toast.success('Item updated successfully!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update item:', error);
      toast.error(error?.data?.detail || 'Failed to update item');
    }
  };

  const handleCancel = () => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setUnit(item.unit);
      setSelectedTagIds(item.tags?.map((t) => t.id) || []);
    }
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-brand-secondary">Edit Item</DialogTitle>
            <DialogDescription>Update the item details below.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="Enter item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-unit">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-unit"
                placeholder="e.g. kg, pcs, meter, box"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter item description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <ItemTagPickerSection
              dialogOpen={open}
              selectedTagIds={selectedTagIds}
              onSelectedTagIdsChange={setSelectedTagIds}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
