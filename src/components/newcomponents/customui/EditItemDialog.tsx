import React, { useEffect, useState } from 'react';
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
import { useUpdateItemMutation } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import ItemTagPickerSection from '@/components/newcomponents/customui/ItemTagPickerSection';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';
import { apiErrorDetail } from '@/utils/apiError';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}

const EditItemDialog: React.FC<EditItemDialogProps> = ({ open, onOpenChange, item }) => {
  const { t } = useTranslation(['items', 'common']);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [sku, setSku] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [updateItem, { isLoading }] = useUpdateItemMutation();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setUnit(item.unit);
      setSku(item.sku ?? '');
      setSelectedTagIds(item.tags?.map((t) => t.id) || []);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item) return;

    if (!name.trim()) {
      appToast.error(t('fieldNameRequired'));
      return;
    }

    if (!unit.trim()) {
      appToast.error(t('fieldUnitRequired'));
      return;
    }

    try {
      await updateItem({
        id: item.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          unit: unit.trim(),
          sku: sku.trim() || null,
          tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        },
      }).unwrap();

      appToast.success(t('itemUpdatedSuccess'));
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update item:', error);
      appToast.error(apiErrorDetail(error, t('itemUpdateFailed')));
    }
  };

  const handleCancel = () => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setUnit(item.unit);
      setSku(item.sku ?? '');
      setSelectedTagIds(item.tags?.map((t) => t.id) || []);
    }
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(56rem,94vw)] max-w-none max-h-[min(90dvh,720px)] overflow-y-auto sm:max-w-none">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-brand-heading">{t('dialogEditTitle')}</DialogTitle>
            <DialogDescription>{t('dialogEditDescription')}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2 md:gap-8 md:items-start">
            <div className="grid gap-4 min-w-0">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">
                  {t('fieldItemName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  placeholder={t('placeholderItemName')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-unit">
                  {t('unit')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-unit"
                  placeholder={t('placeholderUnit')}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-sku">{t('sku')}</Label>
                <Input
                  id="edit-sku"
                  placeholder={t('placeholderSku')}
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">{t('columnDescription')}</Label>
                <Textarea
                  id="edit-description"
                  placeholder={t('placeholderDescription')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
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
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('updatingItem')}
                </>
              ) : (
                t('updateItem')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditItemDialog;
