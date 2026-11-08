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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProductMutation } from '@/features/products/productsApi';
import type { Item } from '@/types/item';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';
import AddItemDialog from './AddItemDialog';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';
import { ITEM_CATALOG_TAG_CODES } from '@/lib/productionItemCatalogTags';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number | null;
  factories: { id: number; name: string }[];
  onSuccess?: () => void;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  factories,
  onSuccess,
}) => {
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(factoryId);
  const [itemId, setItemId] = useState<number | undefined>();
  const [pickedItem, setPickedItem] = useState<{
    id: number;
    name: string;
    unit?: string | null;
  } | null>(null);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [qty, setQty] = useState('0');
  const [avgCost, setAvgCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('');
  const [isAvailableForSale, setIsAvailableForSale] = useState(false);
  const [note, setNote] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [createProduct, { isLoading }] = useCreateProductMutation();

  const selectedItemLabel =
    pickedItem == null
      ? null
      : pickedItem.unit
        ? `${pickedItem.name} (${pickedItem.unit})`
        : pickedItem.name;

  useEffect(() => {
    if (!open) return;
    setSelectedFactoryId(factoryId);
  }, [open, factoryId]);

  const handleItemSelect = (selection: ItemSelection) => {
    setItemId(selection.itemId);
    setPickedItem({
      id: selection.itemId,
      name: selection.itemName,
      unit: selection.itemUnit,
    });
    setItemPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFactoryId == null) {
      appToast.error(t('toastPickFactory'));
      return;
    }

    if (!itemId) {
      appToast.error(t('toastSelectItem'));
      return;
    }

    const qtyNum = parseFloat(qty);
    if (isNaN(qtyNum) || qtyNum < 0) {
      appToast.error(t('toastQtyNonNeg'));
      return;
    }

    try {
      await createProduct({
        item_id: itemId,
        factory_id: selectedFactoryId,
        qty: qtyNum,
        avg_cost: avgCost ? parseFloat(avgCost) : undefined,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : undefined,
        min_order_qty: minOrderQty ? parseInt(minOrderQty, 10) : undefined,
        is_available_for_sale: isAvailableForSale,
        note: note.trim() || undefined,
      }).unwrap();

      appToast.success(t('toastProductAdded'));
      setItemId(undefined);
      setPickedItem(null);
      setQty('0');
      setAvgCost('');
      setSellingPrice('');
      setMinOrderQty('');
      setIsAvailableForSale(false);
      setNote('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || t('toastFailedAddProduct'));
    }
  };

  const handleCreateItemSuccess = (newItem: Item) => {
    setItemId(newItem.id);
    setPickedItem({ id: newItem.id, name: newItem.name, unit: newItem.unit });
    setIsAddItemOpen(false);
  };

  const handleCancel = () => {
    setItemId(undefined);
    setPickedItem(null);
    setQty('0');
    setAvgCost('');
    setSellingPrice('');
    setMinOrderQty('');
    setIsAvailableForSale(false);
    setNote('');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-card-foreground">{t('dlgAddProduct')}</DialogTitle>
              <DialogDescription>
                {t('dlgAddProductHint')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('dlgFactory')} <span className="text-destructive">*</span></Label>
                <Select
                  value={selectedFactoryId != null ? String(selectedFactoryId) : '__none__'}
                  onValueChange={(v) => setSelectedFactoryId(v === '__none__' ? null : parseInt(v, 10))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t('dlgPickFactory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('dlgPickFactory')}</SelectItem>
                    {factories.map((factory) => (
                      <SelectItem key={factory.id} value={String(factory.id)}>
                        {factory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('dlgItem')} <span className="text-destructive">*</span></Label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <ItemSelectSummaryButton
                      ariaLabel={t('dlgSelectItem')}
                      emptyLabel={t('dlgSelectItem')}
                      selectedLabel={selectedItemLabel}
                      staleNumericId={itemId != null ? String(itemId) : null}
                      onClick={() => setItemPickerOpen(true)}
                      className="h-10"
                    />
                  </div>
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('dlgOr')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 shrink-0"
                    onClick={() => setIsAddItemOpen(true)}
                  >
                    {t('dlgCreateItemPlus')}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('quantity')} <span className="text-destructive">*</span></Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-background"
                    />
                    {pickedItem?.unit && (
                      <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-md border border-input h-10 flex items-center justify-center min-w-[3.5rem] select-none shadow-sm">
                        {pickedItem.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{t('dlgAvgCost')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    placeholder={t('dlgOptional')}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('dlgSellingPrice')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder={t('dlgOptional')}
                    className="bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t('dlgMinOrderQty')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={minOrderQty}
                      onChange={(e) => setMinOrderQty(e.target.value)}
                      placeholder={t('dlgOptional')}
                      className="flex-1 bg-background"
                    />
                    {pickedItem?.unit && (
                      <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-md border border-input h-10 flex items-center justify-center min-w-[3.5rem] select-none shadow-sm">
                        {pickedItem.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="available"
                  checked={isAvailableForSale}
                  onCheckedChange={(c) => setIsAvailableForSale(!!c)}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="available" className="font-normal cursor-pointer">
                    {t('dlgAvailableForSale')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('dlgAvailableHint')}
                  </p>
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

      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        selectedItemId={itemId}
        defaultFactoryId={selectedFactoryId ?? undefined}
        factoryId={selectedFactoryId ?? undefined}
        catalogDefaultTagCodes={[ITEM_CATALOG_TAG_CODES.finishedGood]}
        allowCreateCatalogItem
        title="Select item"
        description="Search catalog or pick from storage at this factory."
      />
      <AddItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        onSuccess={handleCreateItemSuccess}
      />
    </>
  );
};

export default AddProductDialog;
