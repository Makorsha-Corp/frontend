import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSalesOrderMutation } from '@/features/salesOrders/salesOrdersApi';
import { useGetProductsQuery } from '@/features/products/productsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Account } from '@/types/account';
import type { CreateSalesOrderDTO } from '@/types/salesOrder';
import type { CreateSalesOrderItemDTO } from '@/types/salesOrderItem';
import { Loader2, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutoSelectGlobalFactory } from '@/hooks/useGlobalFactoryContext';
import { API_LIMITS } from '@/constants/apiLimits';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import type { SalesOrder } from '@/types/salesOrder';

interface AddSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: (order: SalesOrder) => void;
}

interface DraftLine {
  key: string;
  item_id?: number;
  description?: string;
  quantity_ordered: number;
  unit_price: number;
  requires_delivery: boolean;
  notes?: string;
}

let draftLineSeq = 0;
const nextDraftKey = () => `draft-${++draftLineSeq}`;

const AddSalesOrderDialog: React.FC<AddSalesOrderDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}) => {
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const [accountId, setAccountId] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>('');
  const { markFactoryEdited } = useAutoSelectGlobalFactory(open, setFactoryId);
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<DraftLine[]>([]);
  const [lineMode, setLineMode] = useState<'product' | 'misc'>('product');
  const [productId, setProductId] = useState('');
  const [miscDescription, setMiscDescription] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [requiresDelivery, setRequiresDelivery] = useState(true);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [createOrder, { isLoading }] = useCreateSalesOrderMutation();
  const parsedFactoryId = factoryId ? parseInt(factoryId, 10) : undefined;
  const { data: productsList = [] } = useGetProductsQuery(
    { factory_id: parsedFactoryId, is_available_for_sale: true, limit: API_LIMITS.STRICT_100 },
    { skip: !open || !parsedFactoryId }
  );

  const usedItemIds = useMemo(
    () => new Set(items.filter((line) => line.item_id != null).map((line) => line.item_id)),
    [items]
  );
  const availableProducts = useMemo(
    () => productsList.filter((p) => !usedItemIds.has(p.item_id)),
    [productsList, usedItemIds]
  );

  const reset = () => {
    setAccountId('');
    setFactoryId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setExpectedDeliveryDate('');
    setDescription('');
    setItems([]);
    setLineMode('product');
    setProductId('');
    setMiscDescription('');
    setQty('');
    setUnitPrice('');
    setRequiresDelivery(true);
    setEditingKey(null);
  };

  const switchLineMode = (mode: 'product' | 'misc') => {
    setLineMode(mode);
    setRequiresDelivery(mode === 'product');
  };

  const handleSelectProduct = (value: string) => {
    setProductId(value);
    const product = productsList.find((p) => p.item_id.toString() === value);
    if (product?.selling_price != null) {
      setUnitPrice(String(product.selling_price));
    }
  };

  const selectedProductMinQty =
    lineMode === 'product'
      ? productsList.find((p) => p.item_id.toString() === productId)?.min_order_qty ?? undefined
      : undefined;

  const handleAddItem = () => {
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    if (isNaN(q) || q <= 0 || isNaN(p) || p < 0) {
      toast.error('Enter a valid quantity and unit price');
      return;
    }

    if (lineMode === 'product') {
      const iid = parseInt(productId, 10);
      if (isNaN(iid)) {
        toast.error('Select a product');
        return;
      }
      if (usedItemIds.has(iid)) {
        toast.error('Product already on this order — edit quantity or unit price below');
        return;
      }
      const selectedProduct = productsList.find((p) => p.item_id === iid);
      if (selectedProduct?.min_order_qty != null && q < selectedProduct.min_order_qty) {
        toast.error(
          `Minimum order quantity for ${selectedProduct.item_name ?? `item #${iid}`} is ${selectedProduct.min_order_qty}`
        );
        return;
      }
      setItems((prev) => [
        ...prev,
        { key: nextDraftKey(), item_id: iid, quantity_ordered: q, unit_price: p, requires_delivery: requiresDelivery },
      ]);
      setProductId('');
    } else {
      if (!miscDescription.trim()) {
        toast.error('Enter a description for this line');
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          key: nextDraftKey(),
          description: miscDescription.trim(),
          quantity_ordered: q,
          unit_price: p,
          requires_delivery: requiresDelivery,
        },
      ]);
      setMiscDescription('');
    }
    setQty('');
    setUnitPrice('');
    setRequiresDelivery(lineMode === 'product');
  };

  const handleRemoveItem = (idx: number) => {
    const removed = items[idx];
    if (removed && removed.key === editingKey) setEditingKey(null);
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (
    idx: number,
    field: 'quantity_ordered' | 'unit_price',
    raw: string
  ) => {
    const n = parseFloat(raw);
    if (raw.trim() === '' || Number.isNaN(n)) return;
    if (field === 'quantity_ordered' && n <= 0) return;
    if (field === 'unit_price' && n < 0) return;
    setItems((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, [field]: n } : line))
    );
  };

  const handleToggleLineDelivery = (idx: number, value: boolean) => {
    setItems((prev) => prev.map((line, i) => (i === idx ? { ...line, requires_delivery: value } : line)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aid = parseInt(accountId, 10);
    const fid = parseInt(factoryId, 10);
    if (isNaN(aid) || !accountId) {
      toast.error('Select a customer');
      return;
    }
    if (isNaN(fid) || !factoryId) {
      toast.error('Select a factory');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one sales item');
      return;
    }
    for (const line of items) {
      if (line.item_id == null) continue;
      const product = productsList.find((p) => p.item_id === line.item_id);
      if (product?.min_order_qty != null && line.quantity_ordered < product.min_order_qty) {
        toast.error(
          `Minimum order quantity for ${product.item_name ?? `item #${line.item_id}`} is ${product.min_order_qty} (currently ${line.quantity_ordered})`
        );
        return;
      }
    }

    const orderData: CreateSalesOrderDTO = {
      account_id: aid,
      factory_id: fid,
      order_date: orderDate,
      expected_delivery_date: expectedDeliveryDate || undefined,
      current_status_id: 1,
      description: description || undefined,
    };

    const itemsData: CreateSalesOrderItemDTO[] = items.map((i) => ({
      item_id: i.item_id,
      description: i.description,
      quantity_ordered: i.quantity_ordered,
      unit_price: i.unit_price,
      requires_delivery: i.requires_delivery,
      notes: i.notes,
    }));

    try {
      const result = await createOrder({ order: orderData, items: itemsData }).unwrap();
      toast.success('Sales order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create sales order');
    }
  };

  const salesItemsBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Label className="text-base">Sales items *</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} added</span>
      </div>

      <div className="shrink-0 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
          <button
            type="button"
            onClick={() => switchLineMode('product')}
            className={`flex-1 rounded px-2 py-1 font-medium transition-colors ${
              lineMode === 'product' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Product
          </button>
          <button
            type="button"
            onClick={() => switchLineMode('misc')}
            className={`flex-1 rounded px-2 py-1 font-medium transition-colors ${
              lineMode === 'misc' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Misc
          </button>
        </div>
        {lineMode === 'product' ? (
          !parsedFactoryId ? (
            <p className="rounded-md border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              Select a factory first to see products available to sell
            </p>
          ) : (
            <Select value={productId} onValueChange={handleSelectProduct}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No products available to sell at this factory</div>
                ) : (
                  availableProducts.map((p) => (
                    <SelectItem key={p.item_id} value={p.item_id.toString()}>
                      {p.item_name ?? `Item #${p.item_id}`} {p.item_unit && `(${p.item_unit})`} — {p.qty} in stock
                      {p.min_order_qty != null && ` · min ${p.min_order_qty}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )
        ) : (
          <Input
            value={miscDescription}
            onChange={(e) => setMiscDescription(e.target.value)}
            placeholder="e.g. Installation fee, Inspection fee"
            className="bg-background"
          />
        )}
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">
              Qty{selectedProductMinQty != null && ` (min ${selectedProductMinQty})`}
            </Label>
            <StepNumberInput
              min={selectedProductMinQty ?? 1}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="bg-background"
            />
          </div>
          <div className="grid min-w-[5.5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">Unit price</Label>
            <StepNumberInput
              min={0}
              step={1}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
              className="bg-background"
            />
          </div>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="requires-delivery"
            checked={requiresDelivery}
            onCheckedChange={(c) => setRequiresDelivery(!!c)}
          />
          <Label htmlFor="requires-delivery" className="font-normal cursor-pointer text-sm">
            Requires delivery
          </Label>
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-lg border border-border bg-background">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No sales items yet</p>
        ) : (
          items.map((it, idx) => {
            const product = it.item_id != null ? productsList.find((p) => p.item_id === it.item_id) : undefined;
            const unitSuffix = product?.item_unit ? ` ${product.item_unit}` : '';
            const isEditing = editingKey === it.key;
            const lineLabel = it.item_id != null ? (product?.item_name ?? `Item #${it.item_id}`) : it.description;
            const priceStr = Number(it.unit_price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return (
              <div key={it.key} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {lineLabel}
                    {it.item_id == null && (
                      <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground align-middle">
                        Misc
                      </span>
                    )}
                    {it.requires_delivery ? (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground align-middle">
                        <Truck className="h-2.5 w-2.5" />Delivery
                      </span>
                    ) : (
                      <span className="ml-1.5 rounded bg-muted px-1 py-0.5 text-[10px] font-normal text-muted-foreground align-middle">
                        No delivery
                      </span>
                    )}
                  </p>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid max-w-xs grid-cols-2 gap-2">
                        <div className="grid gap-1">
                          <Label className="text-[10px] text-muted-foreground">
                            Qty{unitSuffix}
                            {product?.min_order_qty != null && ` (min ${product.min_order_qty})`}
                          </Label>
                          <StepNumberInput
                            min={1}
                            step={1}
                            value={String(it.quantity_ordered)}
                            onChange={(e) => handleUpdateLine(idx, 'quantity_ordered', e.target.value)}
                            className={cn(
                              'h-9 bg-background',
                              product?.min_order_qty != null && it.quantity_ordered < product.min_order_qty && 'border-destructive'
                            )}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[10px] text-muted-foreground">Unit price</Label>
                          <StepNumberInput
                            min={0}
                            step={1}
                            value={String(it.unit_price)}
                            onChange={(e) => handleUpdateLine(idx, 'unit_price', e.target.value)}
                            className="h-9 bg-background"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`requires-delivery-${it.key}`}
                          checked={it.requires_delivery}
                          onCheckedChange={(c) => handleToggleLineDelivery(idx, !!c)}
                        />
                        <Label htmlFor={`requires-delivery-${it.key}`} className="font-normal cursor-pointer text-xs">
                          Requires delivery
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Quantity {it.quantity_ordered}
                      {unitSuffix}
                      <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                        ·
                      </span>
                      {priceStr} per unit
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setEditingKey(null)}
                    >
                      Done
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingKey(it.key)}
                      aria-label={`Edit ${lineLabel ?? 'item'}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const orderFieldsBlock = (
    <div className="grid min-w-0 gap-4">
      <div>
        <Label>Customer *</Label>
        <AccountSelectSummaryButton
          onClick={() => setAccountPickerOpen(true)}
          ariaLabel={
            accountId
              ? `Change customer. Current account ID ${accountId}`
              : 'Select customer'
          }
          selectedLine={accounts.find((a) => a.id === parseInt(accountId, 10))?.name || null}
          staleNumericId={accountId || null}
        />
        <AccountSelectorDialog
          open={accountPickerOpen}
          onOpenChange={setAccountPickerOpen}
          title="Select customer"
          description="Search and pick the customer account for this sales order."
          selectedAccountId={accountId ? parseInt(accountId, 10) : undefined}
          onSelect={(account) => {
            if (!account) return;
            setAccountId(String(account.id));
          }}
        />
      </div>
      <div>
        <Label>Factory *</Label>
        <Select
          value={factoryId || '__none__'}
          onValueChange={(v) => {
            markFactoryEdited();
            setFactoryId(v === '__none__' ? '' : v);
          }}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select factory" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select factory…</SelectItem>
            {factories.map((f) => (
              <SelectItem key={f.id} value={f.id.toString()}>
                {f.name} {f.abbreviation && `(${f.abbreviation})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Order date *</Label>
        <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Expected delivery date</Label>
        <Input
          type="date"
          value={expectedDeliveryDate}
          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-6 sm:max-w-none">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden pb-4 pt-0 md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="flex min-h-0 min-w-0 flex-col self-stretch overflow-hidden">
              <div className="shrink-0 pb-4 text-left">
                <DialogTitle className="text-brand-heading">Add Sales Order</DialogTitle>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pl-2 pr-4 md:flex md:flex-col md:justify-center md:py-2">
                {orderFieldsBlock}
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {salesItemsBlock}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSalesOrderDialog;
