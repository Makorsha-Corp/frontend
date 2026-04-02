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
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [createItem, { isLoading }] = useCreateItemMutation();
  const { data: tags } = useGetTagsQuery();

  useEffect(() => {
    if (!open) setTagSearch('');
  }, [open]);

  const tagById = useMemo(() => {
    const m = new Map<number, ItemTag>();
    tags?.forEach((t) => m.set(t.id, t));
    return m;
  }, [tags]);

  const selectedTags = useMemo(
    () =>
      selectedTagIds
        .map((id) => tagById.get(id))
        .filter((t): t is ItemTag => t != null),
    [selectedTagIds, tagById]
  );

  const unselectedFilteredTags = useMemo(() => {
    if (!tags?.length) return [];
    const q = tagSearch.trim().toLowerCase();
    return tags.filter((tag) => {
      if (selectedTagIds.includes(tag.id)) return false;
      if (!q) return true;
      const name = tag.name.toLowerCase();
      const code = (tag.tag_code || '').toLowerCase();
      const desc = (tag.description || '').toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [tags, tagSearch, selectedTagIds]);

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

  const handleCancel = () => {
    setName('');
    setDescription('');
    setUnit('');
    setSelectedTagIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(56rem,94vw)] max-w-none max-h-[min(90dvh,720px)] overflow-y-auto sm:max-w-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-brand-secondary">Add New Item</DialogTitle>
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

                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                  <div className="text-xs text-muted-foreground">
                    {selectedTagIds.length > 0
                      ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''} selected — remove with ✕`
                      : 'Search below and click a tag to add it'}
                  </div>

                  <div
                    className={`min-h-[2.5rem] rounded-md border border-dashed border-border bg-background px-2 py-2 ${
                      selectedTags.length ? 'flex flex-wrap gap-2' : 'flex items-center'
                    }`}
                  >
                    {selectedTags.length === 0 ? (
                      <span className="text-xs text-muted-foreground px-1">No tags selected</span>
                    ) : (
                      selectedTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/40 pl-2.5 pr-1 py-1 text-sm"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color || '#9067c6' }}
                          />
                          <span className="truncate">{tag.name}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag.id)}
                            className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            aria-label={`Remove ${tag.name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder="Search tags by name, code, or description…"
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="pl-9 h-9 bg-background"
                      autoComplete="off"
                    />
                  </div>

                  <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-background">
                    {unselectedFilteredTags.length === 0 ? (
                      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                        {tags.length > 0 && selectedTagIds.length === tags.length
                          ? 'All tags are selected'
                          : tagSearch.trim()
                            ? 'No tags match your search'
                            : 'No tags to show'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                        {unselectedFilteredTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag.id)}
                            className="flex w-full min-w-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60"
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: tag.color || '#9067c6' }}
                            />
                            <span className="min-w-0 truncate font-medium">{tag.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
