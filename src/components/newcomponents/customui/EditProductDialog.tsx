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
import { Checkbox } from '@/components/ui/checkbox';
import { useUpdateProductMutation } from '@/features/products/productsApi';
import type { Product } from '@/types/product';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  onOpenChange,
  product,
  onSuccess,
}) => {
  const [qty, setQty] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('');
  const [isAvailableForSale, setIsAvailableForSale] = useState(false);
  const [note, setNote] = useState('');

  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  useEffect(() => {
    if (product) {
      setQty(product.qty.toString());
      setAvgCost(product.avg_cost != null ? product.avg_cost.toString() : '');
      setSellingPrice(product.selling_price != null ? product.selling_price.toString() : '');
      setMinOrderQty(product.min_order_qty != null ? product.min_order_qty.toString() : '');
      setIsAvailableForSale(product.is_available_for_sale);
      setNote(product.note ?? '');
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const qtyNum = parseInt(qty, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast.error('Quantity must be 0 or greater');
      return;
    }

    try {
      await updateProduct({
        id: product.id,
        data: {
          qty: qtyNum,
          avg_cost: avgCost ? parseFloat(avgCost) : undefined,
          selling_price: sellingPrice ? parseFloat(sellingPrice) : undefined,
          min_order_qty: minOrderQty ? parseInt(minOrderQty, 10) : undefined,
          is_available_for_sale: isAvailableForSale,
          note: note.trim() || undefined,
        },
      }).unwrap();

      toast.success('Product updated');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update product');
    }
  };

  if (!product) return null;

  const itemLabel = product.item_name ?? `Item #${product.item_id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Product</DialogTitle>
            <DialogDescription>{itemLabel}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Quantity <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Avg. Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={avgCost}
                  onChange={(e) => setAvgCost(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="grid gap-2">
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Min Order Qty</Label>
              <Input
                type="number"
                min="0"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                placeholder="Optional"
                className="bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="available"
                checked={isAvailableForSale}
                onCheckedChange={(c) => setIsAvailableForSale(!!c)}
              />
              <Label htmlFor="available" className="font-normal cursor-pointer">
                Available for sale
              </Label>
            </div>
            <div className="grid gap-2">
              <Label>Note</Label>
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
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
