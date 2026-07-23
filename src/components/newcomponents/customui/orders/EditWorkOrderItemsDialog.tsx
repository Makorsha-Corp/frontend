import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '@/components/ui/hover-card';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Badge } from '@/components/ui/badge';
import {
  useAddWorkOrderItemMutation,
  useRemoveWorkOrderItemMutation,
  useUpdateWorkOrderItemMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetMachineItemsQuery } from '@/features/machineItems/machineItemsApi';
import type { WorkOrderItem, WorkOrderItemSourceType, WorkOrderItemActionType } from '@/types/workOrder';
import { WORK_ORDER_ITEM_ACTION_OPTIONS, WORK_ORDER_ITEM_ACTION_EXPLAINER } from '@/pages/newpages/orders/workOrderConstants';
import { API_LIMITS } from '@/constants/apiLimits';
import { AlertTriangle, Loader2, Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';

function formatItemDisplayLabel(selection: ItemSelection): string {
  const base = selection.itemUnit
    ? `${selection.itemName} (${selection.itemUnit})`
    : selection.itemName;
  if (selection.selectionSource === 'storage' && selection.availableQty != null) {
    return `${base} · ${selection.availableQty} on hand`;
  }
  return base;
}

function partSourceLabel(sourceType: WorkOrderItemSourceType): string {
  return sourceType === 'machine' ? 'machine stock' : 'storage';
}

export interface EditWorkOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  woId: number;
  factoryId: number;
  sectionId?: number | null;
  /** When set, Install/Replace/Borrow become available (they only make sense against a
   * machine's own on-hand inventory) alongside the always-available plain "Used up". */
  machineId?: number | null;
  items: WorkOrderItem[];
  onSaved?: () => void;
}

const EditWorkOrderItemsDialog: React.FC<EditWorkOrderItemsDialogProps> = ({
  open,
  onOpenChange,
  woId,
  factoryId,
  sectionId,
  machineId,
  items,
  onSaved,
}) => {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [sourceType, setSourceType] = useState<WorkOrderItemSourceType>('storage');
  const [sourceMachineId, setSourceMachineId] = useState<number | undefined>();
  const [actionType, setActionType] = useState<WorkOrderItemActionType>('CONSUME');
  const [replacedItemId, setReplacedItemId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTarget, setItemPickerTarget] = useState<'item' | 'replaced'>('item');
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});

  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: machineItems = [] } = useGetMachineItemsQuery(
    { machine_id: machineId ?? 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open || !machineId || actionType !== 'REPLACE' }
  );

  const [addItem] = useAddWorkOrderItemMutation();
  const [updateItem] = useUpdateWorkOrderItemMutation();
  const [removeItem] = useRemoveWorkOrderItemMutation();

  const replacedItemOnHandQty = replacedItemId
    ? machineItems.find((mi) => mi.item_id === Number(replacedItemId))?.qty ?? 0
    : 0;
  const replaceWillDegrade = actionType === 'REPLACE' && Boolean(replacedItemId) && Number(qty) > replacedItemOnHandQty;

  useEffect(() => {
    if (open) {
      setItemId('');
      setQty('1');
      setSourceType('storage');
      setSourceMachineId(undefined);
      const lockedAction = items[0]?.action_type;
      setActionType(lockedAction ?? 'CONSUME');
      setReplacedItemId('');
    }
  }, [open, items]);

  const actionLocked = items.length > 0;
  const actionOptions = machineId
    ? WORK_ORDER_ITEM_ACTION_OPTIONS
    : WORK_ORDER_ITEM_ACTION_OPTIONS.filter((o) => o.value === 'CONSUME');

  const usedItemIds = useMemo(() => new Set(items.map((i) => i.item_id)), [items]);

  const itemDisplayLabel = (id: string) =>
    itemLabels[id] ??
    (() => {
      const item = itemsList.find((i) => String(i.id) === id);
      return item ? (item.unit ? `${item.name} (${item.unit})` : item.name) : null;
    })();

  const handleItemSelect = (selection: ItemSelection) => {
    const id = String(selection.itemId);
    if (itemPickerTarget === 'item' && usedItemIds.has(selection.itemId)) {
      toast.error('Item already on this order');
      return;
    }
    const label = formatItemDisplayLabel(selection);
    setItemLabels((prev) => ({ ...prev, [id]: label }));
    if (itemPickerTarget === 'replaced') {
      setReplacedItemId(id);
    } else {
      const nextSourceType: WorkOrderItemSourceType =
        selection.selectionSource === 'machine' ? 'machine' : 'storage';
      setItemId(id);
      setSourceType(nextSourceType);
      setSourceMachineId(selection.machineId);
    }
  };

  const openItemPicker = (target: 'item' | 'replaced') => {
    setItemPickerTarget(target);
    setItemPickerOpen(true);
  };

  const canAdd = (() => {
    if (!itemId.trim() || !qty.trim()) return false;
    const q = parseFloat(qty);
    if (!(q > 0)) return false;
    if (actionType === 'REPLACE' && !replacedItemId) return false;
    return true;
  })();

  const resetDraft = () => {
    setItemId('');
    setQty('1');
    setSourceType('storage');
    setSourceMachineId(undefined);
    setReplacedItemId('');
  };

  const handleAdd = async () => {
    if (!canAdd) {
      toast.error(
        actionType === 'REPLACE'
          ? 'Pick item, quantity, and part being replaced'
          : 'Pick an item and quantity',
      );
      return;
    }
    setIsSaving(true);
    try {
      await addItem({
        woId,
        data: {
          item_id: Number(itemId),
          quantity: Number(qty),
          uses_inventory: true,
          source_location_type: sourceType,
          source_location_id: sourceType === 'machine' ? (sourceMachineId ?? machineId ?? undefined) : factoryId,
          action_type: actionType,
          replaced_item_id: actionType === 'REPLACE' ? Number(replacedItemId) : undefined,
        },
      }).unwrap();
      toast.success('Part added');
      resetDraft();
      onSaved?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add part');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQtyBlur = async (item: WorkOrderItem, raw: string) => {
    const next = parseFloat(raw);
    if (!(next > 0) || next === Number(item.quantity)) {
      setQtyDrafts((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
      return;
    }
    try {
      await updateItem({ woId, itemId: item.id, data: { quantity: next } }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update quantity');
      setQtyDrafts((prev) => ({ ...prev, [item.id]: String(item.quantity) }));
    }
  };

  const handleRemove = async (item: WorkOrderItem) => {
    try {
      await removeItem({ woId, itemId: item.id }).unwrap();
      toast.success('Part removed');
      onSaved?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove part');
    }
  };

  const itemLineSourceLabel = (item: WorkOrderItem) => {
    if (!item.uses_inventory) return 'not tracked';
    if (item.source_location_type === 'machine') {
      const name = machines.find((m) => m.id === item.source_location_id)?.name;
      return name ? `${name} stock` : 'machine stock';
    }
    return partSourceLabel('storage');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(80vh,52rem)] max-h-[80vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>Edit parts</DialogTitle>
            <DialogDescription>
              Same flow as the sheet entry footer — pick what happens, then add parts from storage or machine stock.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-4">
            <div className="shrink-0 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">What will happen with this part?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {actionOptions.map((opt) => (
                    <HoverCard key={opt.value} openDelay={120} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <Button
                          type="button"
                          variant={actionType === opt.value ? 'default' : 'outline'}
                          size="sm"
                          className={`h-8 ${actionType === opt.value ? 'bg-brand-primary hover:bg-brand-primary-hover' : ''}`}
                          disabled={actionLocked && actionType !== opt.value}
                          onClick={() => setActionType(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardPortal>
                        <HoverCardContent
                          side="top"
                          align="center"
                          sideOffset={6}
                          collisionPadding={12}
                          className="z-[200] w-auto max-w-[min(18rem,calc(100vw-2rem))] p-3 text-xs leading-snug text-muted-foreground"
                        >
                          {WORK_ORDER_ITEM_ACTION_EXPLAINER[opt.value]}
                        </HoverCardContent>
                      </HoverCardPortal>
                    </HoverCard>
                  ))}
                </div>
                {actionLocked ? (
                  <p className="text-[10px] text-muted-foreground">
                    Action locked for this order. Remove all parts to change.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 space-y-3 rounded-md border border-dashed border-border/60 bg-muted/20 p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {actionType === 'REPLACE' ? 'New item' : 'Item'}
                  </Label>
                  <ItemSelectSummaryButton
                    ariaLabel={actionType === 'REPLACE' ? 'Select new item' : 'Select item'}
                    selectedLabel={itemId ? itemDisplayLabel(itemId) : null}
                    staleNumericId={itemId || null}
                    compactLabel
                    className="h-9 min-h-9 py-0 text-sm"
                    onClick={() => openItemPicker('item')}
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <StepNumberInput
                    min={0.01}
                    step={1}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {machineId && actionType === 'REPLACE' && (
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Part being replaced on machine</Label>
                  <ItemSelectSummaryButton
                    ariaLabel="Select part being replaced"
                    selectedLabel={replacedItemId ? itemDisplayLabel(replacedItemId) : null}
                    staleNumericId={replacedItemId || null}
                    compactLabel
                    className="h-9 min-h-9 py-0 text-sm"
                    onClick={() => openItemPicker('replaced')}
                  />
                  {replacedItemId ? (
                    <p className="text-xs text-muted-foreground">Currently on this machine: {replacedItemOnHandQty}</p>
                  ) : null}
                  {replaceWillDegrade ? (
                    <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      The machine only shows {replacedItemOnHandQty} on hand — with fewer than {qty}, this will just
                      install the new part without removing anything.
                    </p>
                  ) : null}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full bg-background"
                disabled={!canAdd || isSaving}
                onClick={handleAdd}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add part
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No parts on this order yet.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.item_name ?? `Item #${item.item_id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.consumed_at ? (
                            <>
                              {item.quantity}
                              {item.item_unit ? ` ${item.item_unit}` : ''}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <StepNumberInput
                                min={0.01}
                                step={1}
                                className="h-8 w-24"
                                value={qtyDrafts[item.id] ?? String(item.quantity)}
                                onChange={(e) => setQtyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                onBlur={(e) => handleQtyBlur(item, e.target.value)}
                              />
                              {item.item_unit ? <span>{item.item_unit}</span> : null}
                            </span>
                          )}
                          {' · '}
                          {itemLineSourceLabel(item)}
                          {item.uses_inventory && item.action_type === 'REPLACE' && item.replaced_item_name ? (
                            <span> · replaces {item.replaced_item_name}</span>
                          ) : null}
                        </p>
                        {item.consumed_at ? (
                          <Badge variant="outline" className="text-green-600 border-green-600/30">
                            Stock deducted
                          </Badge>
                        ) : null}
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {item.consumed_at ? (
                          <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked — void the order to reverse" />
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        defaultFactoryId={factoryId}
        defaultSectionId={sectionId ?? undefined}
        inventoryOnly
        includeMachineStock
        defaultMachineId={machineId ?? undefined}
        initialTab={itemPickerTarget === 'replaced' ? 'machine' : 'storage'}
        selectedItemId={
          itemPickerTarget === 'replaced'
            ? replacedItemId
              ? Number(replacedItemId)
              : undefined
            : itemId
              ? Number(itemId)
              : undefined
        }
        title={itemPickerTarget === 'replaced' ? 'Select part being replaced' : 'Select part'}
        description="Pick from factory storage or machine stock on hand."
      />
    </>
  );
};

export default EditWorkOrderItemsDialog;
