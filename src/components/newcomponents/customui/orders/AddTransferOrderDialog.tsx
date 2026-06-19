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
import { useCreateTransferOrderMutation } from '@/features/transferOrders/transferOrdersApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
import { useGetMachineItemsQuery } from '@/features/machineItems/machineItemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { CreateTransferOrder, CreateTransferOrderItem } from '@/types/transferOrder';
import type { InventoryType } from '@/types/inventory';
import { ArrowDown, Check, Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import { isSameTransferLocation } from '@/components/newcomponents/customui/orders/transferOrderRouteHelpers';

const SOURCE_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

const DEST_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

interface SourceAvailableItem {
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  available_qty: number;
}

interface AddTransferOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: { id: number } & Record<string, unknown>) => void;
}

const AddTransferOrderDialog: React.FC<AddTransferOrderDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [sourceType, setSourceType] = useState<'storage' | 'machine' | 'damaged'>('storage');
  const [sourceId, setSourceId] = useState<string>('');
  const [destType, setDestType] = useState<'storage' | 'machine' | 'project' | 'damaged'>('storage');
  const [destId, setDestId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ item_id: number; quantity: number; notes?: string }>>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [sourceMachineDisplayLine, setSourceMachineDisplayLine] = useState('');
  const [destMachineDisplayLine, setDestMachineDisplayLine] = useState('');
  const [sourceMachinePickerOpen, setSourceMachinePickerOpen] = useState(false);
  const [destMachinePickerOpen, setDestMachinePickerOpen] = useState(false);
  const [addHintOpen, setAddHintOpen] = useState(false);
  const [unaddedHintOpen, setUnaddedHintOpen] = useState(false);

  const hasUnaddedItemDraft = Boolean(itemId.trim() || qty.trim());

  const [createOrder, { isLoading }] = useCreateTransferOrderMutation();
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });

  const sourceIdNum = parseInt(sourceId, 10);
  const hasValidSource = Boolean(sourceId) && !isNaN(sourceIdNum);
  const sourceInventoryType: InventoryType = sourceType === 'damaged' ? 'DAMAGED' : 'STORAGE';

  const { data: inventoryRows = [], isLoading: loadingInventory } = useGetInventoryListQuery(
    {
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
      inventory_type: sourceInventoryType,
      factory_id: sourceIdNum,
    },
    { skip: !open || !hasValidSource || sourceType === 'machine' }
  );

  const { data: machineItemRows = [], isLoading: loadingMachineItems } = useGetMachineItemsQuery(
    {
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
      machine_id: sourceIdNum,
    },
    { skip: !open || !hasValidSource || sourceType !== 'machine' }
  );

  const sourceAvailableItems = useMemo((): SourceAvailableItem[] => {
    if (!hasValidSource) return [];

    if (sourceType === 'machine') {
      return machineItemRows
        .filter((row) => (row.qty ?? 0) > 0)
        .map((row) => ({
          item_id: row.item_id,
          item_name: row.item_name ?? null,
          item_unit: row.item_unit ?? null,
          available_qty: row.qty,
        }));
    }

    return inventoryRows
      .filter((row) => (row.qty ?? 0) > 0 && row.is_active && !row.is_deleted)
      .map((row) => ({
        item_id: row.item_id,
        item_name: row.item_name ?? null,
        item_unit: row.item_unit ?? null,
        available_qty: row.qty,
      }));
  }, [hasValidSource, sourceType, inventoryRows, machineItemRows]);

  const loadingSourceItems =
    hasValidSource && (sourceType === 'machine' ? loadingMachineItems : loadingInventory);

  const getRemainingQty = (itemIdNum: number) => {
    const sourceItem = sourceAvailableItems.find((row) => row.item_id === itemIdNum);
    if (!sourceItem) return 0;
    const used = items
      .filter((line) => line.item_id === itemIdNum)
      .reduce((sum, line) => sum + line.quantity, 0);
    return Math.max(0, sourceItem.available_qty - used);
  };

  const selectableSourceItems = useMemo(
    () => sourceAvailableItems.filter((row) => getRemainingQty(row.item_id) > 0),
    [sourceAvailableItems, items]
  );

  const destinationFactories = useMemo(() => {
    if (!hasValidSource || destType !== sourceType) return factories;
    return factories.filter((f) => f.id.toString() !== sourceId);
  }, [factories, destType, sourceType, sourceId, hasValidSource]);

  const selectedItemRemainingQty = itemId ? getRemainingQty(parseInt(itemId, 10)) : undefined;

  useEffect(() => {
    if (!open) return;
    setItemId('');
    setQty('');
    setItems([]);
  }, [sourceType, sourceId, open]);

  useEffect(() => {
    if (isSameTransferLocation(sourceType, sourceId, destType, destId)) {
      setDestId('');
      setDestMachineDisplayLine('');
    }
  }, [sourceType, sourceId, destType, destId]);

  useEffect(() => {
    if (itemId && !selectableSourceItems.some((row) => String(row.item_id) === itemId)) {
      setItemId('');
      setQty('');
    }
  }, [itemId, selectableSourceItems]);

  const reset = () => {
    setSourceType('storage');
    setSourceId('');
    setDestType('storage');
    setDestId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setNote('');
    setItems([]);
    setItemId('');
    setQty('');
    setSourceMachineDisplayLine('');
    setDestMachineDisplayLine('');
    setSourceMachinePickerOpen(false);
    setDestMachinePickerOpen(false);
    setAddHintOpen(false);
    setUnaddedHintOpen(false);
  };

  const canAddLineItem = (() => {
    if (!hasValidSource || !itemId.trim() || !qty.trim()) return false;
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    if (isNaN(iid) || isNaN(q) || q <= 0) return false;
    const remaining = getRemainingQty(iid);
    return q <= remaining;
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
    if (!hasValidSource) {
      toast.error('Select a source location first');
      return;
    }
    if (!canAddLineItem) {
      setAddHintOpen(true);
      return;
    }
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const remaining = getRemainingQty(iid);
    if (q > remaining) {
      toast.error(`Only ${remaining} available at source`);
      return;
    }
    if (items.some((line) => line.item_id === iid)) {
      toast.error('Item already added — remove the line or adjust quantity');
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity: q }]);
    setItemId('');
    setQty('');
    setAddHintOpen(false);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceMachinePickerOpen || destMachinePickerOpen) return;

    const sid = parseInt(sourceId, 10);
    const did = parseInt(destId, 10);
    if (isNaN(sid) || !sourceId) {
      toast.error('Select source location');
      return;
    }
    if (isNaN(did) || !destId) {
      toast.error('Select destination location');
      return;
    }
    if (isSameTransferLocation(sourceType, sourceId, destType, destId)) {
      toast.error('Destination must be different from source');
      return;
    }
    if (hasUnaddedItemDraft) {
      if (!unaddedHintOpen) {
        setUnaddedHintOpen(true);
        return;
      }
      setItemId('');
      setQty('');
      setUnaddedHintOpen(false);
    }
    if (items.length === 0) {
      toast.error('Add at least one transfer item');
      return;
    }

    const orderData: CreateTransferOrder = {
      source_location_type: sourceType,
      source_location_id: sid,
      destination_location_type: destType,
      destination_location_id: did,
      order_date: orderDate || undefined,
      description: description || undefined,
      note: note || undefined,
      current_status_id: 1,
      items: items.map((i) => ({ item_id: i.item_id, quantity: i.quantity, notes: i.notes })) as CreateTransferOrderItem[],
    };

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Transfer order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create transfer order');
    }
  };

  const lineItemsBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Label className="text-base">Items *</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{items.length} added</span>
      </div>

      <div className="shrink-0 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <Select
          value={itemId}
          onValueChange={setItemId}
          disabled={!hasValidSource || loadingSourceItems || selectableSourceItems.length === 0}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue
              placeholder={
                !hasValidSource
                  ? 'Select source first'
                  : loadingSourceItems
                    ? 'Loading available items…'
                    : selectableSourceItems.length === 0
                      ? 'No items at source'
                      : 'Select item'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {selectableSourceItems.map((row) => (
              <SelectItem key={row.item_id} value={row.item_id.toString()}>
                {row.item_name ?? `Item #${row.item_id}`}
                {row.item_unit ? ` (${row.item_unit})` : ''}
                {' · '}
                {getRemainingQty(row.item_id)} avail
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">
              Qty
              {selectedItemRemainingQty != null ? (
                <span className="ml-1 font-normal text-muted-foreground/80">
                  (max {selectedItemRemainingQty})
                </span>
              ) : null}
            </Label>
            <StepNumberInput
              min={1}
              max={selectedItemRemainingQty}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="bg-background"
              disabled={!itemId || !hasValidSource}
            />
          </div>
          <div className="relative shrink-0" data-add-item-hint-root>
            {addHintOpen && !canAddLineItem ? (
              <div
                role="tooltip"
                className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[14rem] animate-in fade-in-0 zoom-in-95 rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md"
              >
                Select item and qty to add
              </div>
            ) : null}
            <Button
              type="button"
              size="icon"
              className={
                canAddLineItem
                  ? 'h-10 w-10 bg-brand-primary text-primary-foreground hover:bg-brand-primary-hover'
                  : 'h-10 w-10 cursor-not-allowed bg-neutral-400 text-neutral-100 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600'
              }
              onClick={handleAddItemClick}
              aria-label="Add line item"
              aria-expanded={addHintOpen && !canAddLineItem}
              aria-disabled={!canAddLineItem}
              disabled={!hasValidSource || loadingSourceItems}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-lg border border-border bg-background">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No order items yet</p>
        ) : (
          items.map((it, idx) => {
            const item = sourceAvailableItems.find((row) => row.item_id === it.item_id);
            const unitSuffix = item?.item_unit ? ` ${item.item_unit}` : '';
            return (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {item?.item_name ?? `Item #${it.item_id}`}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    Quantity {it.quantity}
                    {unitSuffix}
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
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-1">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Source type</Label>
          <Select
            value={sourceType}
            onValueChange={(v) => {
              setSourceType(v as typeof sourceType);
              setSourceId('');
              setSourceMachineDisplayLine('');
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          {sourceType === 'storage' || sourceType === 'damaged' ? (
            <Select value={sourceId} onValueChange={setSourceId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <MachineSelectSummaryButton
              onClick={() => setSourceMachinePickerOpen(true)}
              ariaLabel={
                sourceMachineDisplayLine
                  ? `Change source machine. Current: ${sourceMachineDisplayLine}`
                  : 'Select source machine'
              }
              selectedLine={sourceMachineDisplayLine || null}
              staleNumericId={sourceMachineDisplayLine ? null : sourceId || null}
              compactLabel
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2" aria-hidden>
        <div className="h-px flex-1 bg-border" />
        <ArrowDown className="h-4 w-4 shrink-0 text-brand-primary" />
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Destination type</Label>
          <Select
            value={destType}
            onValueChange={(v) => {
              setDestType(v as typeof destType);
              setDestId('');
              setDestMachineDisplayLine('');
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Destination</Label>
          {destType === 'storage' || destType === 'damaged' ? (
            <Select value={destId} onValueChange={setDestId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {destinationFactories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : destType === 'machine' ? (
            <MachineSelectSummaryButton
              onClick={() => setDestMachinePickerOpen(true)}
              ariaLabel={
                destMachineDisplayLine
                  ? `Change destination machine. Current: ${destMachineDisplayLine}`
                  : 'Select destination machine'
              }
              selectedLine={destMachineDisplayLine || null}
              staleNumericId={destMachineDisplayLine ? null : destId || null}
              compactLabel
            />
          ) : (
            <Select value={destId} onValueChange={setDestId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      </div>

      <div>
        <Label>Order date</Label>
        <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
      <div>
        <Label>Note</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
          <DialogHeader className="shrink-0 space-y-0 text-left">
            <DialogTitle>Add Transfer Order</DialogTitle>
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
                    className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[16rem] animate-in fade-in-0 zoom-in-95 rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md"
                  >
                    You have unadded items — click ✓ to add them, or click Create again to continue without them
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

      <MachineSelectorDialog
        open={sourceMachinePickerOpen}
        onOpenChange={setSourceMachinePickerOpen}
        title="Select source machine"
        description="Pick factory and section, highlight a machine, then confirm."
        onSelect={(m, ctx) => {
          if (isSameTransferLocation('machine', m.id, destType, destId)) {
            toast.error('Source cannot be the same as destination');
            return;
          }
          setSourceId(String(m.id));
          setSourceMachineDisplayLine(`${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`);
        }}
      />
      <MachineSelectorDialog
        open={destMachinePickerOpen}
        onOpenChange={setDestMachinePickerOpen}
        title="Select destination machine"
        description="Pick factory and section, highlight a machine, then confirm."
        onSelect={(m, ctx) => {
          if (isSameTransferLocation('machine', sourceId, 'machine', m.id)) {
            toast.error('Destination cannot be the same as source');
            return;
          }
          setDestId(String(m.id));
          setDestMachineDisplayLine(`${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`);
        }}
      />
    </>
  );
};

export default AddTransferOrderDialog;
