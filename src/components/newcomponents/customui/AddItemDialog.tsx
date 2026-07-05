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
import {
  itemsApi,
  useCreateItemMutation,
  useLazyGetSimilarItemsQuery,
} from '@/features/items/itemsApi';
import { useAppDispatch } from '@/app/hooks';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import type { Item, SimilarItemMatch } from '@/types/item';
import { ITEM_SIMILAR_NAME_MIN_LENGTH, ITEM_SIMILARITY_THRESHOLD } from '@/types/item';
import ItemTagPickerSection from '@/components/newcomponents/customui/ItemTagPickerSection';
import ItemSimilarMatchDialog from '@/components/newcomponents/customui/ItemSimilarMatchDialog';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (item: Item) => void;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [sku, setSku] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [similarMatches, setSimilarMatches] = useState<SimilarItemMatch[]>([]);
  const [similarDialogOpen, setSimilarDialogOpen] = useState(false);
  const [isResolvingSimilar, setIsResolvingSimilar] = useState(false);

  const [createItem, { isLoading }] = useCreateItemMutation();
  const [fetchSimilarItems, { isFetching: isCheckingSimilar }] = useLazyGetSimilarItemsQuery();

  const resetForm = () => {
    setName('');
    setDescription('');
    setUnit('');
    setSku('');
    setSelectedTagIds([]);
    setSimilarMatches([]);
    setSimilarDialogOpen(false);
  };

  const performCreate = async () => {
    const created = await createItem({
      name: name.trim(),
      description: description.trim() || null,
      unit: unit.trim(),
      sku: sku.trim() || null,
      tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    }).unwrap();

    toast.success('Item created successfully!');
    resetForm();
    onOpenChange(false);
    onSuccess?.(created);
  };

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

    const trimmedName = name.trim();
    if (trimmedName.length >= ITEM_SIMILAR_NAME_MIN_LENGTH) {
      try {
        const similar = await fetchSimilarItems({ name: trimmedName, limit: 5 }).unwrap();
        const strongMatches = similar.matches.filter(
          (match) =>
            match.match_type === 'exact_normalized' ||
            match.similarity_score >= ITEM_SIMILARITY_THRESHOLD
        );
        if (strongMatches.length > 0) {
          setSimilarMatches(strongMatches);
          setSimilarDialogOpen(true);
          return;
        }
      } catch (error) {
        console.error('Similar item lookup failed:', error);
      }
    }

    try {
      await performCreate();
    } catch (error: unknown) {
      console.error('Failed to create item:', error);
      const detail =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { detail?: string } }).data?.detail
          : undefined;
      toast.error(detail || 'Failed to create item');
    }
  };

  const handleUseExistingItem = async (match: SimilarItemMatch) => {
    setIsResolvingSimilar(true);
    try {
      const existingItem = await dispatch(
        itemsApi.endpoints.getItemById.initiate(match.id, { forceRefetch: true })
      ).unwrap();
      toast.success(`Using existing item: ${existingItem.name}`);
      resetForm();
      onOpenChange(false);
      onSuccess?.(existingItem);
    } catch (error) {
      console.error('Failed to load existing item:', error);
      toast.error('Could not load the selected item');
    } finally {
      setIsResolvingSimilar(false);
    }
  };

  const handleCreateAnyway = async () => {
    setSimilarDialogOpen(false);
    try {
      await performCreate();
    } catch (error: unknown) {
      console.error('Failed to create item:', error);
      const detail =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { detail?: string } }).data?.detail
          : undefined;
      toast.error(detail || 'Failed to create item');
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const isBusy = isLoading || isCheckingSimilar || isResolvingSimilar;

  return (
    <>
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
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isBusy}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isBusy}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCheckingSimilar ? 'Checking name…' : 'Creating...'}
                  </>
                ) : (
                  'Create Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ItemSimilarMatchDialog
        open={similarDialogOpen}
        onOpenChange={setSimilarDialogOpen}
        proposedName={name.trim()}
        matches={similarMatches}
        onUseExisting={handleUseExistingItem}
        onCreateAnyway={handleCreateAnyway}
        isResolving={isResolvingSimilar || isLoading}
      />
    </>
  );
};

export default AddItemDialog;
