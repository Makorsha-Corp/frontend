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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProductMutation } from '@/features/products/productsApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import toast from 'react-hot-toast';
import { Loader2, Plus } from 'lucide-react';
import AddItemDialog from './AddItemDialog';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number;
  onSuccess?: () => void;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  onSuccess,
}) => {
  const [itemId, setItemId] = useState<number | undefined>();
  const [qty, setQty] = useState('0');
  const [avgCost, setAvgCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('');
  const [isAvailableForSale, setIsAvailableForSale] = useState(false);
  const [note, setNote] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [createProduct, { isLoading }] = useCreateProductMutation();
  const { data: items, refetch: refetchItems } = useGetItemsQuery(
    { skip: 0, limit: 100 },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      toast.error('Please select an item');
      return;
    }

    const qtyNum = parseInt(qty, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast.error('Quantity must be 0 or greater');
      return;
    }

    try {
      await createProduct({
        item_id: itemId,
        factory_id: factoryId,
        qty: qtyNum,
        avg_cost: avgCost ? parseFloat(avgCost) : undefined,
        selling_price: sellingPrice ? parseFloat(sellingPrice) : undefined,
        min_order_qty: minOrderQty ? parseInt(minOrderQty, 10) : undefined,
        is_available_for_sale: isAvailableForSale,
        note: note.trim() || undefined,
      }).unwrap();

      toast.success('Product added');
      setItemId(undefined);
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
      toast.error(e?.data?.detail || 'Failed to add product');
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
              <DialogTitle className="text-card-foreground">Add Product</DialogTitle>
              <DialogDescription>
                Add a finished good. Select from catalog or create a new item.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Item <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Select
                    value={itemId?.toString() ?? '__none__'}
                    onValueChange={(v) => setItemId(v === '__none__' ? undefined : parseInt(v))}
                  >
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select item</SelectItem>
                      {(items ?? []).map((i) => (
                        <SelectItem key={i.id} value={i.id.toString()}>
                          {i.name} ({i.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddItemOpen(true)}
                    title="Create new item"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Quantity <span className="text-destructive">*</span></Label>
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
                  <Label>Avg. Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={avgCost}
                    onChange={(e) => setAvgCost(e.target.value)}
                    placeholder="Optional"
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Selling Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="Optional"
                    className="bg-background"
                  />
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
                  placeholder="Optional"
                  rows={2}
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isLoading || !itemId}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add'
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

export default AddProductDialog;
