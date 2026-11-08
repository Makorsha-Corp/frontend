import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useGetTagsQuery } from '@/features/items/itemTagsApi';
import { useAppDispatch } from '@/app/hooks';
import { appToast } from '@/lib/appToast';
import { apiErrorDetail } from '@/utils/apiError';
import { Loader2 } from 'lucide-react';
import type { Item, SimilarItemMatch } from '@/types/item';
import { ITEM_SIMILAR_NAME_MIN_LENGTH, ITEM_SIMILARITY_THRESHOLD } from '@/types/item';
import ItemTagPickerSection from '@/components/newcomponents/customui/ItemTagPickerSection';
import ItemSimilarMatchDialog from '@/components/newcomponents/customui/ItemSimilarMatchDialog';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (item: Item) => void;
  /** Pre-select system tags when opened (e.g. waste / byproduct from production). */
  defaultTagCodes?: string[];
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  defaultTagCodes,
}) => {
  const { t } = useTranslation(['items', 'common']);
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
  const { data: tags = [] } = useGetTagsQuery(undefined, { skip: !open });

  const defaultTags = useMemo(
    () =>
      (defaultTagCodes ?? [])
        .map((code) => tags.find((t) => t.tag_code === code))
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [defaultTagCodes, tags],
  );

  useEffect(() => {
    if (!open || defaultTags.length === 0) return;
    setSelectedTagIds((prev) => {
      const merged = new Set(prev);
      for (const tag of defaultTags) {
        merged.add(tag.id);
      }
      return [...merged];
    });
  }, [open, defaultTags]);

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

    appToast.success(t('itemCreatedSuccess'));
    resetForm();
    onOpenChange(false);
    onSuccess?.(created);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      appToast.error(t('fieldNameRequired'));
      return;
    }

    if (!unit.trim()) {
      appToast.error(t('fieldUnitRequired'));
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
      appToast.error(apiErrorDetail(error, t('itemCreateFailed')));
    }
  };

  const handleUseExistingItem = async (match: SimilarItemMatch) => {
    setIsResolvingSimilar(true);
    try {
      const existingItem = await dispatch(
        itemsApi.endpoints.getItemById.initiate(match.id, { forceRefetch: true })
      ).unwrap();
      appToast.success(`Using existing item: ${existingItem.name}`);
      resetForm();
      onOpenChange(false);
      onSuccess?.(existingItem);
    } catch (error) {
      console.error('Failed to load existing item:', error);
      appToast.error('Could not load the selected item');
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
      appToast.error(apiErrorDetail(error, t('itemCreateFailed')));
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
              <DialogTitle className="text-brand-heading">{t('dialogAddTitle')}</DialogTitle>
              <DialogDescription>{t('dialogAddDescription')}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:items-center pt-1">
              <div className="grid gap-4 min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    {t('fieldItemName')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={t('placeholderItemName')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unit">
                    {t('unit')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unit"
                    placeholder={t('placeholderUnit')}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sku">{t('sku')}</Label>
                  <Input
                    id="sku"
                    placeholder={t('placeholderSku')}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">{t('columnDescription')}</Label>
                  <Textarea
                    id="description"
                    placeholder={t('placeholderDescription')}
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
                {t('cancel', { ns: 'common' })}
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isBusy}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCheckingSimilar ? t('checkingName') : t('creatingItem')}
                  </>
                ) : (
                  t('createItem')
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
