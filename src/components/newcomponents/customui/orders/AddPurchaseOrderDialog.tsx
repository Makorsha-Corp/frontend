import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useCreatePurchaseOrderMutation } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Account } from '@/types/account';
import type { Factory } from '@/types/factory';
import type { CreatePurchaseOrder, CreatePurchaseOrderItem } from '@/types/purchaseOrder';
import { Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import { useAutoSelectGlobalFactory, useGlobalFactory } from '@/hooks/useGlobalFactoryContext';

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  factories: Factory[];
  onSuccess: (order: { id: number }) => void;
}

const AddPurchaseOrderDialog: React.FC<AddPurchaseOrderDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  factories,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState<string>('');
  const [destinationType, setDestinationType] = useState<'storage' | 'machine' | 'project'>('storage');
  const [destinationId, setDestinationId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [items, setItems] = useState<
    Array<{ item_id: number; quantity_ordered: number; unit_price: number; notes?: string }>
  >([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [machinePickerOpen, setMachinePickerOpen] = useState(false);
  const [machineDisplayLine, setMachineDisplayLine] = useState('');
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [addHintOpen, setAddHintOpen] = useState(false);
  const [unaddedHintOpen, setUnaddedHintOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const hasUnaddedItemDraft = Boolean(itemId.trim() || qty.trim() || unitPrice.trim());

  const [createOrder, { isLoading }] = useCreatePurchaseOrderMutation();
  const globalFactory = useGlobalFactory();
  const { markFactoryEdited: markDestinationFactoryEdited } = useAutoSelectGlobalFactory(
    open,
    setDestinationId,
    undefined,
    open && destinationType === 'storage'
  );
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: !open });

  const usedItemIds = useMemo(() => new Set(items.map((line) => line.item_id)), [items]);
  const availableItems = useMemo(
    () => itemsList.filter((i) => !usedItemIds.has(i.id)),
    [itemsList, usedItemIds]
  );

  const reset = () => {
    setAccountId('');
    setDestinationType('storage');
    setDestinationId('');
    setDescription('');
    setOrderNote('');
    setItems([]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setMachineDisplayLine('');
    setMachinePickerOpen(false);
    setAddHintOpen(false);
    setUnaddedHintOpen(false);
    setEditingItemId(null);
  };

  const canAddLineItem = (() => {
    if (!itemId.trim() || !qty.trim() || !unitPrice.trim()) return false;
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    return !isNaN(iid) && !isNaN(q) && q > 0 && !isNaN(p) && p >= 0 && !usedItemIds.has(iid);
  })();

  useEffect(() => {
    if (canAddLineItem) setAddHintOpen(false);
  }, [canAddLineItem]);

  useEffect(() => {
    if (!hasUnaddedItemDraft) setUnaddedHintOpen(false);
  }, [hasUnaddedItemDraft]);

  useEffect(() => {
    if (!unaddedHintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-unadded-hint-root]')) {
        setUnaddedHintOpen(false);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [unaddedHintOpen]);

  useEffect(() => {
    if (!addHintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-add-item-hint-root]')) {
        setAddHintOpen(false);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [addHintOpen]);

  const handleAddItemClick = () => {
    if (!canAddLineItem) {
      setAddHintOpen(true);
      return;
    }
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    if (usedItemIds.has(iid)) {
      toast.error('Item already on this order — edit quantity or unit price below');
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity_ordered: q, unit_price: p }]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setAddHintOpen(false);
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
    // Ignore accidental submits while nested selector dialogs are open.
    if (accountPickerOpen || machinePickerOpen) {
      return;
    }
    const did = parseInt(destinationId, 10);
    const aid = accountId ? parseInt(accountId, 10) : null;
    if (accountId && (aid == null || isNaN(aid))) {
      toast.error('Invalid supplier selection');
      return;
    }
    if (isNaN(did) || !destinationId) {
      toast.error('Select a destination');
      return;
    }
    if (hasUnaddedItemDraft) {
      if (!unaddedHintOpen) {
        setUnaddedHintOpen(true);
        return;
      }
      setItemId('');
      setQty('');
      setUnitPrice('');
      setUnaddedHintOpen(false);
    }
    if (items.length === 0) {
      toast.error('Add at least one order item');
      return;
    }

    const orderData: CreatePurchaseOrder = {
      ...(aid != null ? { account_id: aid } : {}),
      destination_type: destinationType,
      destination_id: did,
      order_date: new Date().toISOString().slice(0, 10),
      description: description || undefined,
      order_note: orderNote || undefined,
      items: items.map((i) => ({
        item_id: i.item_id,
        quantity_ordered: i.quantity_ordered,
        unit_price: i.unit_price,
        notes: i.notes,
      })) as CreatePurchaseOrderItem[],
    };

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Purchase order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create order');
    }
  };

  const lineItemsBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <Label className="text-base">Items *</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} added</span>
      </div>

      <div className="space-y-2 shrink-0 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
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
          </div>
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            - or -
          </span>
          <Button
            type="button"
            className="h-10 shrink-0 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground"
            onClick={() => setIsCreateItemOpen(true)}
          >
            Create item +
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid flex-1 min-w-[5rem] gap-1">
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
          <div className="grid flex-1 min-w-[5.5rem] gap-1">
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
          <div className="relative shrink-0" data-add-item-hint-root>
            {addHintOpen && !canAddLineItem ? (
              <div
                role="tooltip"
                className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[14rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
              >
                Select item, qty and unit price to add
              </div>
            ) : null}
            <Button
              type="button"
              size="icon"
              className={
                canAddLineItem
                  ? 'h-10 w-10 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground'
                  : 'h-10 w-10 bg-neutral-400 text-neutral-100 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600 cursor-not-allowed'
              }
              onClick={handleAddItemClick}
              aria-label="Add line item"
              aria-expanded={addHintOpen && !canAddLineItem}
              aria-disabled={!canAddLineItem}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background divide-y">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No order items yet</p>
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
    <div className="grid gap-4 min-w-0">
      <div>
        <Label>Destination type *</Label>
        <Select
          value={destinationType}
          onValueChange={(v) => {
            setDestinationType(v as 'storage' | 'machine' | 'project');
            setDestinationId('');
            setMachineDisplayLine('');
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="storage">Storage (Factory)</SelectItem>
            <SelectItem value="machine">Machine</SelectItem>
            <SelectItem value="project">Project</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {destinationType === 'storage' && (
        <div>
          <Label>Factory *</Label>
          <Select
            value={destinationId || '__none__'}
            onValueChange={(v) => {
              markDestinationFactoryEdited();
              setDestinationId(v === '__none__' ? '' : v);
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
                  {f.name} ({f.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {destinationType === 'machine' && (
        <div>
          <Label>Machine *</Label>
          <MachineSelectSummaryButton
            onClick={() => setMachinePickerOpen(true)}
            ariaLabel={
              machineDisplayLine
                ? `Change machine. Current: ${machineDisplayLine}`
                : 'Select machine'
            }
            selectedLine={machineDisplayLine || null}
            staleNumericId={machineDisplayLine ? null : destinationId || null}
          />
          <MachineSelectorDialog
            open={machinePickerOpen}
            onOpenChange={setMachinePickerOpen}
            initialFactoryId={globalFactory?.id}
            title="Select destination machine"
            description="Pick factory and section, highlight a machine, then confirm."
            onSelect={(m, ctx) => {
              setDestinationId(String(m.id));
              setMachineDisplayLine(`${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`);
            }}
          />
        </div>
      )}
      {destinationType === 'project' && (
        <div>
          <Label>Destination ID *</Label>
          <Input
            type="number"
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            placeholder="Project component ID"
            className="mt-1"
          />
        </div>
      )}
      <div>
        <Label>Supplier</Label>
        <AccountSelectSummaryButton
          onClick={() => setAccountPickerOpen(true)}
          ariaLabel={
            accountId
              ? `Change supplier. Current account ID ${accountId}`
              : 'Select supplier'
          }
          selectedLine={accounts.find((a) => a.id === parseInt(accountId, 10))?.name || null}
          staleNumericId={accountId || null}
        />
        <AccountSelectorDialog
          open={accountPickerOpen}
          onOpenChange={setAccountPickerOpen}
          title="Select supplier"
          description="Search and pick the supplier account for this purchase order."
          selectedAccountId={accountId ? parseInt(accountId, 10) : undefined}
          onSelect={(account) => {
            if (!account) return;
            setAccountId(String(account.id));
          }}
        />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
      <div>
        <Label>Order note</Label>
        <Input value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-0 text-left">
          <DialogTitle>Add Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto pl-2 pr-4 md:flex md:flex-col md:justify-center">
              {orderFieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {lineItemsBlock}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="relative" data-unadded-hint-root>
              {unaddedHintOpen ? (
                <div
                  role="tooltip"
                  className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[16rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                >
                  You have unadded order items — click ✓ to add them, or click Create again to continue without them
                </div>
              ) : null}
              <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </form>
        </DialogContent>
      </Dialog>
      <AddItemDialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen} />
    </>
  );
};

export default AddPurchaseOrderDialog;
