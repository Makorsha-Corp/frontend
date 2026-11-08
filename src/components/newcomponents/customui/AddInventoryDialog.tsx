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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateInventoryMutation, useUpdateInventoryMutation } from '@/features/inventory/inventoryApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import type { InventoryType } from '@/types/inventory';
import { appToast } from '@/lib/appToast';
import { Loader2, Plus } from 'lucide-react';
import AddItemDialog from './AddItemDialog';
import { translateInventoryType } from './storage/inventoryTypeLabel';

const INVENTORY_TYPE_VALUES: InventoryType[] = ['STORAGE', 'DAMAGED', 'WASTE', 'SCRAP'];

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number;
  defaultType?: InventoryType;
  onSuccess?: () => void;
  /** Prefill when opened from a short production step. */
  initialItemId?: number;
  initialItemName?: string;
  initialQty?: number;
  /** When set, Quantity is added onto this storage row instead of creating a new one. */
  existingQty?: { id: number; qty: number } | null;
}

const AddInventoryDialog: React.FC<AddInventoryDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  defaultType = 'STORAGE',
  onSuccess,
  initialItemId,
  initialItemName,
  initialQty,
  existingQty = null,
}) => {
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');
  const [itemId, setItemId] = useState<number | undefined>();
  const [inventoryType, setInventoryType] = useState<InventoryType>(defaultType);
  const [qty, setQty] = useState('0');
  const [avgPrice, setAvgPrice] = useState('');
  const [note, setNote] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [createInventory, { isLoading: isCreating }] = useCreateInventoryMutation();
  const [updateInventory, { isLoading: isUpdating }] = useUpdateInventoryMutation();
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    setInventoryType(defaultType);
    setItemId(initialItemId);
    setQty(initialQty != null && initialQty > 0 ? String(initialQty) : '0');
    setAvgPrice('');
    setNote('');
  }, [open, defaultType, initialItemId, initialQty]);
  const { data: items, isLoading: loadingItems, error: itemsError, refetch: refetchItems } = useGetItemsQuery(
    { skip: 0, limit: 100 },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      appToast.error(t('toastSelectItem'));
      return;
    }

    const qtyNum = parseFloat(qty);
    if (isNaN(qtyNum) || qtyNum < 0) {
      appToast.error(t('toastQtyNonNeg'));
      return;
    }

    const priceNum = avgPrice ? parseFloat(avgPrice) : undefined;
    if (avgPrice && (isNaN(priceNum!) || priceNum! < 0)) {
      appToast.error(t('toastPriceNonNeg'));
      return;
    }

    try {
      if (existingQty) {
        await updateInventory({
          id: existingQty.id,
          data: {
            qty: Math.round((Number(existingQty.qty) + qtyNum) * 100) / 100,
            ...(priceNum != null ? { avg_price: priceNum } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
          },
        }).unwrap();
      } else {
        await createInventory({
          item_id: itemId,
          inventory_type: inventoryType,
          factory_id: factoryId,
          qty: qtyNum,
          avg_price: priceNum,
          note: note.trim() || undefined,
        }).unwrap();
      }

      appToast.success(t('toastStockAdded'));
      setItemId(undefined);
      setQty('0');
      setAvgPrice('');
      setNote('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || t('toastFailedAdd'));
    }
  };

  const handleCreateItemSuccess = (newItem: Item) => {
    refetchItems();
    setItemId(newItem.id);
    setIsAddItemOpen(false);
  };

  const handleCancel = () => {
    setItemId(undefined);
    setQty('0');
    setAvgPrice('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-card-foreground">{t('dlgAddInventory')}</DialogTitle>
              <DialogDescription>
                {existingQty
                  ? t('dlgAddOnto', { qty: existingQty.qty })
                  : t('dlgAddItemHint')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('dlgType')} <span className="text-destructive">*</span></Label>
                <Select
                  value={inventoryType}
                  onValueChange={(v) => setInventoryType(v as InventoryType)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVENTORY_TYPE_VALUES.map((typeValue) => (
                      <SelectItem key={typeValue} value={typeValue}>
                        {translateInventoryType(typeValue, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>{t('dlgItem')} <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Select
                    value={itemId?.toString() ?? '__none__'}
                    onValueChange={(v) => {
                      if (v === '__none__' || v.startsWith('__')) return;
                      setItemId(parseInt(v));
                    }}
                  >
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue placeholder={t('dlgSelectItem')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('dlgSelectItem')}</SelectItem>
                      {loadingItems ? (
                        <SelectItem value="__loading__" disabled>{t('dlgLoadingItems')}</SelectItem>
                      ) : itemsError ? (
                        <SelectItem value="__error__" disabled>{t('dlgFailedItems')}</SelectItem>
                      ) : (items ?? []).length === 0 && itemId == null ? (
                        <SelectItem value="__empty__" disabled>{t('dlgNoCatalogItems')}</SelectItem>
                      ) : (
                        <>
                        {itemId != null &&
                        initialItemName &&
                        !(items ?? []).some((i) => i.id === itemId) ? (
                          <SelectItem value={itemId.toString()}>{initialItemName}</SelectItem>
                        ) : null}
                        {(items ?? []).map((i) => (
                          <SelectItem key={i.id} value={i.id.toString()}>
                            {i.name} ({i.unit})
                          </SelectItem>
                        ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddItemOpen(true)}
                    title={t('dlgCreateItem')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('quantity')} <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t('dlgAvgPrice')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
                    placeholder={t('dlgOptional')}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t('dlgNote')}</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('dlgOptional')}
                  rows={2}
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {tc('cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isLoading || !itemId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('dlgAdding')}
                  </>
                ) : (
                  tc('add')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        onSuccess={handleCreateItemSuccess}
      />
    </>
  );
};

export default AddInventoryDialog;
