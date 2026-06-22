import React, { useState } from 'react';
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
import { useCreateItemMutation } from '@/features/items/itemsApi';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import type { Item } from '@/types/item';
import ItemTagPickerSection from '@/components/newcomponents/customui/ItemTagPickerSection';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (item: Item) => void;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [sku, setSku] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [createItem, { isLoading }] = useCreateItemMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!unit.trim()) {
      toast.error('Unit is required');
      return;
    }

    try {
      const created = await createItem({
        name: name.trim(),
        description: description.trim() || null,
        unit: unit.trim(),
        sku: sku.trim() || null,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }).unwrap();

      toast.success('Item created successfully!');

      setName('');
      setDescription('');
      setUnit('');
      setSku('');
      setSelectedTagIds([]);
      onOpenChange(false);
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Failed to create item:', error);
      toast.error(error?.data?.detail || 'Failed to create item');
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setUnit('');
    setSku('');
    setSelectedTagIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(56rem,94vw)] max-w-none max-h-[min(90dvh,720px)] overflow-y-auto sm:max-w-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-brand-heading">Add New Item</DialogTitle>
            <DialogDescription>
              Create a new item in your catalog. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:items-center pt-1">
            <div className="grid gap-4 min-w-0">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Item Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter item name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">
                  Unit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit"
                  placeholder="e.g. kg, pcs, meter, box"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="Optional stock-keeping ID"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter item description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="min-h-[4.5rem] resize-y"
                />
              </div>
            </div>

            <div className="min-w-0 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8 md:border-border">
              <ItemTagPickerSection
                dialogOpen={open}
                selectedTagIds={selectedTagIds}
                onSelectedTagIdsChange={setSelectedTagIds}
                tagListClassName="max-h-[10.5rem] md:max-h-[12rem]"
              />
            </div>
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
                  Creating...
                </>
              ) : (
                'Create Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
