import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Check, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';

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

  const [createOrder, { isLoading }] = useCreatePurchaseOrderMutation();
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: !open });

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
  };

  const canAddLineItem = (() => {
    if (!itemId.trim() || !qty.trim() || !unitPrice.trim()) return false;
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    return !isNaN(iid) && !isNaN(q) && q > 0 && !isNaN(p) && p >= 0;
  })();

  useEffect(() => {
    if (canAddLineItem) setAddHintOpen(false);
  }, [canAddLineItem]);

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
    setItems((prev) => [...prev, { item_id: iid, quantity_ordered: q, unit_price: p }]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setAddHintOpen(false);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
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
    if (items.length === 0) {
      toast.error('Add at least one item');
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
                {itemsList.map((i) => (
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
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="bg-background"
            />
          </div>
          <div className="grid flex-1 min-w-[5.5rem] gap-1">
            <Label className="text-xs text-muted-foreground">Unit price</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
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
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No line items yet</p>
        ) : (
          items.map((it, idx) => {
            const item = itemsList.find((i) => i.id === it.item_id);
            const unitSuffix = item?.unit ? ` ${item.unit}` : '';
            const priceStr = Number(it.unit_price).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            return (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {item?.name ?? `Item #${it.item_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Quantity {it.quantity_ordered}
                    {unitSuffix}
                    <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                    {priceStr} per unit
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
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
        <Label>Destination type</Label>
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
          <Select value={destinationId} onValueChange={setDestinationId} required>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select factory" />
            </SelectTrigger>
            <SelectContent>
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
            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>
      <AddItemDialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen} />
    </>
  );
};

export default AddPurchaseOrderDialog;
