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
import { useGetTagsQuery } from '@/features/items/itemTagsApi';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import { Loader2, Tags } from 'lucide-react';
import type { Item } from '@/types/item';
import ItemTagsManagerDialog from '@/components/newcomponents/customui/ItemTagsManagerDialog';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (item: Item) => void;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false);
  
  const [createItem, { isLoading }] = useCreateItemMutation();
  const { data: tags } = useGetTagsQuery();

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
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      }).unwrap();

      toast.success('Item created successfully!');
      
      // Reset form
      setName('');
      setDescription('');
      setUnit('');
      setSelectedTagIds([]);
      onOpenChange(false);
      onSuccess?.(created);
    } catch (error: any) {
      console.error('Failed to create item:', error);
      toast.error(error?.data?.detail || 'Failed to create item');
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setUnit('');
    setSelectedTagIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-brand-secondary">Add New Item</DialogTitle>
            <DialogDescription>
              Create a new item in your catalog. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter item description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Tags Selection */}
            {tags && tags.length > 0 && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Tags (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setIsTagsManagerOpen(true)}
                  >
                    <Tags className="h-3.5 w-3.5 mr-1.5" />
                    Manage Tags
                  </Button>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 text-xs text-muted-foreground">
                    {selectedTagIds.length > 0
                      ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''} selected`
                      : 'Select one or more tags'}
                  </div>
                  <div className="max-h-44 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tags.map((tag) => (
                        <label
                          key={tag.id}
                          htmlFor={`tag-${tag.id}`}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={selectedTagIds.includes(tag.id)}
                            onCheckedChange={() => toggleTag(tag.id)}
                          />
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color || '#9067c6' }}
                          />
                          <span className="text-sm truncate">{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
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
      <ItemTagsManagerDialog open={isTagsManagerOpen} onOpenChange={setIsTagsManagerOpen} />
    </Dialog>
  );
};

export default AddItemDialog;
