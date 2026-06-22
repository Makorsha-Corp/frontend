import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateSalesOrderMutation } from '@/features/salesOrders/salesOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Account } from '@/types/account';
import type { CreateSalesOrderDTO } from '@/types/salesOrder';
import type { CreateSalesOrderItemDTO } from '@/types/salesOrderItem';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAutoSelectGlobalFactory } from '@/hooks/useGlobalFactoryContext';
import { API_LIMITS } from '@/constants/apiLimits';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';

interface AddSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: (order: { id: number } & Record<string, unknown>) => void;
}

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
  const [quotationSentDate, setQuotationSentDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{ item_id: number; quantity_ordered: number; unit_price: number; notes?: string }>
  >([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [createOrder, { isLoading }] = useCreateSalesOrderMutation();
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });

  const usedItemIds = useMemo(() => new Set(items.map((line) => line.item_id)), [items]);
  const availableItems = useMemo(
    () => itemsList.filter((i) => !usedItemIds.has(i.id)),
    [itemsList, usedItemIds]
  );

  const reset = () => {
    setAccountId('');
    setFactoryId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setQuotationSentDate('');
    setExpectedDeliveryDate('');
    setNotes('');
    setItems([]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setEditingItemId(null);
  };

  const handleAddItem = () => {
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    if (isNaN(iid) || isNaN(q) || q <= 0 || isNaN(p) || p < 0) {
      toast.error('Enter valid item, quantity, and unit price');
      return;
    }
    if (usedItemIds.has(iid)) {
      toast.error('Item already on this order — edit quantity or unit price below');
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity_ordered: q, unit_price: p }]);
    setItemId('');
    setQty('');
    setUnitPrice('');
  };

  const handleRemoveItem = (idx: number) => {
    const removed = items[idx];
    if (removed && removed.item_id === editingItemId) setEditingItemId(null);
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

    const orderData: CreateSalesOrderDTO = {
      account_id: aid,
      factory_id: fid,
      order_date: orderDate,
      quotation_sent_date: quotationSentDate || undefined,
      expected_delivery_date: expectedDeliveryDate || undefined,
      current_status_id: 1,
      notes: notes || undefined,
    };

    const itemsData: CreateSalesOrderItemDTO[] = items.map((i) => ({
      item_id: i.item_id,
      quantity_ordered: i.quantity_ordered,
      unit_price: i.unit_price,
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
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {availableItems.map((i) => (
              <SelectItem key={i.id} value={i.id.toString()}>
                {i.name} {i.unit && `(${i.unit})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">Qty</Label>
            <StepNumberInput
              min={1}
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
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-lg border border-border bg-background">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No sales items yet</p>
        ) : (
          items.map((it, idx) => {
            const item = itemsList.find((i) => i.id === it.item_id);
            const unitSuffix = item?.unit ? ` ${item.unit}` : '';
            const isEditing = editingItemId === it.item_id;
            const priceStr = Number(it.unit_price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return (
              <div key={it.item_id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {item?.name ?? `Item #${it.item_id}`}
                  </p>
                  {isEditing ? (
                    <div className="grid max-w-xs grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Qty{unitSuffix}
                        </Label>
                        <StepNumberInput
                          min={1}
                          step={1}
                          value={String(it.quantity_ordered)}
                          onChange={(e) => handleUpdateLine(idx, 'quantity_ordered', e.target.value)}
                          className="h-9 bg-background"
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
                      onClick={() => setEditingItemId(null)}
                    >
                      Done
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingItemId(it.item_id)}
                      aria-label={`Edit ${item?.name ?? 'item'}`}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Quotation sent date</Label>
          <Input
            type="date"
            value={quotationSentDate}
            onChange={(e) => setQuotationSentDate(e.target.value)}
            className="mt-1"
          />
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
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1" />
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
