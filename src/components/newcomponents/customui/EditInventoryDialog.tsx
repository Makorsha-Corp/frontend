import React, { useState, useEffect } from 'react';
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
import { useUpdateInventoryMutation } from '@/features/inventory/inventoryApi';
import type { Inventory } from '@/types/inventory';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';
import { translateInventoryType } from './storage/inventoryTypeLabel';

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory | null;
  onSuccess?: () => void;
}

const EditInventoryDialog: React.FC<EditInventoryDialogProps> = ({
  open,
  onOpenChange,
  inventory,
  onSuccess,
}) => {
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');
  const [qty, setQty] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [note, setNote] = useState('');

  const [updateInventory, { isLoading }] = useUpdateInventoryMutation();

  useEffect(() => {
    if (inventory) {
      setQty(inventory.qty.toString());
      setAvgPrice(inventory.avg_price != null ? inventory.avg_price.toString() : '');
      setNote(inventory.note ?? '');
    }
  }, [inventory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventory) return;

    const qtyNum = parseFloat(qty);
    if (isNaN(qtyNum) || qtyNum < 0) {
      appToast.error('Quantity must be 0 or greater');
      return;
    }

    const priceNum = avgPrice ? parseFloat(avgPrice) : undefined;
    if (avgPrice && (isNaN(priceNum!) || priceNum! < 0)) {
      appToast.error('Average price must be 0 or greater');
      return;
    }

    try {
      await updateInventory({
        id: inventory.id,
        data: {
          qty: qtyNum,
          avg_price: priceNum,
          note: note.trim() || undefined,
        },
      }).unwrap();

      appToast.success(t('toastInventoryUpdated'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || t('toastFailedUpdate'));
    }
  };

  if (!inventory) return null;

  const itemLabel = inventory.item_name ?? t('itemNumber', { id: inventory.item_id });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">{t('dlgEditInventory')}</DialogTitle>
            <DialogDescription>
              {itemLabel} ({translateInventoryType(inventory.inventory_type, t)})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('quantity')} <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
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
            <div className="grid gap-2">
              <Label>{t('dlgNote')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tc('saving')}
                </>
              ) : (
                tc('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInventoryDialog;
