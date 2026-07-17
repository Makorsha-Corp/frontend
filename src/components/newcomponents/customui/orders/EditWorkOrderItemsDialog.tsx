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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Badge } from '@/components/ui/badge';
import {
  useAddWorkOrderItemMutation,
  useRemoveWorkOrderItemMutation,
  useUpdateWorkOrderItemMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
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

export interface EditWorkOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  woId: number;
  /** When set, Install/Replace/Borrow become available (they only make sense against a
   * machine's own on-hand inventory) alongside the always-available plain "Used up". */
  machineId?: number | null;
  items: WorkOrderItem[];
  onSaved?: () => void;
  /** Preselects "uses inventory" with this source type — used right after a machine
   * quick action creates an order that involves parts. */
  defaultSourceType?: WorkOrderItemSourceType;
}

const EditWorkOrderItemsDialog: React.FC<EditWorkOrderItemsDialogProps> = ({
  open,
  onOpenChange,
  woId,
  machineId,
  items,
  onSaved,
  defaultSourceType,
}) => {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [notes, setNotes] = useState('');
  const [usesInventory, setUsesInventory] = useState(Boolean(defaultSourceType));
  const [sourceType, setSourceType] = useState<WorkOrderItemSourceType | ''>(defaultSourceType ?? '');
  const [sourceId, setSourceId] = useState('');
  const [actionType, setActionType] = useState<WorkOrderItemActionType>('CONSUME');
  const [replacedItemId, setReplacedItemId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [qtyDrafts, setQtyDrafts] = useState<Record<number, string>>({});
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTarget, setItemPickerTarget] = useState<'item' | 'replaced'>('item');
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});

  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: sections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
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
      setNotes('');
      setUsesInventory(Boolean(defaultSourceType));
      setSourceType(defaultSourceType ?? '');
      setSourceId('');
      setActionType('CONSUME');
      setReplacedItemId('');
    }
  }, [open, defaultSourceType]);

  const usedItemIds = useMemo(() => new Set(items.map((i) => i.item_id)), [items]);

  const itemSelectorFactoryId =
    usesInventory && sourceType === 'storage' && sourceId ? Number(sourceId) : undefined;

  const itemPickerInitialTab =
    usesInventory && sourceType === 'storage' && sourceId ? ('storage' as const) : ('catalog' as const);

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
      setItemId(id);
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
    if (usesInventory && (!sourceType || !sourceId)) return false;
    if (usesInventory && actionType === 'REPLACE' && !replacedItemId) return false;
    return true;
  })();

  const resetForm = () => {
    setItemId('');
    setQty('1');
    setNotes('');
    setUsesInventory(false);
    setSourceType('');
    setSourceId('');
    setActionType('CONSUME');
    setReplacedItemId('');
  };

  const handleAdd = async () => {
    if (!canAdd) {
      toast.error('Pick an item, quantity, and a source location if using inventory');
      return;
    }
    setIsSaving(true);
    try {
      await addItem({
        woId,
        data: {
          item_id: Number(itemId),
          quantity: Number(qty),
          notes: notes.trim() || undefined,
          uses_inventory: usesInventory,
          source_location_type: usesInventory ? (sourceType as WorkOrderItemSourceType) : undefined,
          source_location_id: usesInventory ? Number(sourceId) : undefined,
          action_type: usesInventory ? actionType : undefined,
          replaced_item_id: usesInventory && actionType === 'REPLACE' ? Number(replacedItemId) : undefined,
        },
      }).unwrap();
      toast.success('Item added');
      resetForm();
      onSaved?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add item');
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
      toast.success('Item removed');
      onSaved?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove item');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[70vh] max-h-[70vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Edit items</DialogTitle>
          <DialogDescription>
            Mark a line "uses inventory" to deduct stock from storage or a machine when work starts.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="shrink-0 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Item *</Label>
                <ItemSelectSummaryButton
                  ariaLabel="Select item"
                  selectedLabel={itemId ? itemDisplayLabel(itemId) : null}
                  staleNumericId={itemId || null}
                  compactLabel
                  onClick={() => openItemPicker('item')}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Qty</Label>
                <StepNumberInput min={0.01} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="bg-background" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={usesInventory} onCheckedChange={(v) => setUsesInventory(Boolean(v))} />
              <span className="text-sm text-card-foreground">Uses inventory (deduct stock when work starts)</span>
            </label>

            {usesInventory && machineId && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">What will happen with this part?</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK_ORDER_ITEM_ACTION_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={actionType === opt.value ? 'default' : 'outline'}
                      size="sm"
                      className={
                        actionType === opt.value
                          ? 'bg-brand-primary hover:bg-brand-primary-hover'
                          : undefined
                      }
                      onClick={() => setActionType(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                <p className="rounded-md bg-background px-2.5 py-2 text-xs text-muted-foreground">
                  {WORK_ORDER_ITEM_ACTION_EXPLAINER[actionType]}
                </p>
              </div>
            )}

            {usesInventory && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <Select
                    value={sourceType}
                    onValueChange={(v) => {
                      setSourceType(v as WorkOrderItemSourceType);
                      setSourceId('');
                    }}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Storage or machine..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storage">Factory storage</SelectItem>
                      <SelectItem value="machine">Another machine's stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {sourceType === 'machine' ? 'Machine' : 'Factory'}
                  </Label>
                  <Select value={sourceId} onValueChange={setSourceId} disabled={!sourceType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceType === 'machine'
                        ? machines.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name}
                            </SelectItem>
                          ))
                        : factories.map((f) => (
                            <SelectItem key={f.id} value={String(f.id)}>
                              {f.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {usesInventory && machineId && actionType === 'REPLACE' && (
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Item being replaced (currently on this machine)</Label>
                <ItemSelectSummaryButton
                  ariaLabel="Select item being replaced"
                  selectedLabel={replacedItemId ? itemDisplayLabel(replacedItemId) : null}
                  staleNumericId={replacedItemId || null}
                  onClick={() => openItemPicker('replaced')}
                />
                {replacedItemId && (
                  <p className="text-xs text-muted-foreground">Currently on this machine: {replacedItemOnHandQty}</p>
                )}
                {replaceWillDegrade && (
                  <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    The machine only shows {replacedItemOnHandQty} on hand — with fewer than {qty}, this will just
                    install the new part without removing anything.
                  </p>
                )}
              </div>
            )}

            <Button type="button" variant="outline" className="w-full" disabled={!canAdd || isSaving} onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add line
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No items
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_name ?? `Item #${item.item_id}`}</TableCell>
                      <TableCell>
                        {item.consumed_at ? (
                          <span>
                            {item.quantity}
                            {item.item_unit ? ` ${item.item_unit}` : ''}
                          </span>
                        ) : (
                          <StepNumberInput
                            min={0.01}
                            step={1}
                            className="h-8 w-20"
                            value={qtyDrafts[item.id] ?? String(item.quantity)}
                            onChange={(e) => setQtyDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            onBlur={(e) => handleQtyBlur(item, e.target.value)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.uses_inventory ? (
                          item.source_location_type === 'machine' ? (
                            machines.find((m) => m.id === item.source_location_id)?.name ?? `Machine #${item.source_location_id}`
                          ) : (
                            factories.find((f) => f.id === item.source_location_id)?.name ?? `Factory #${item.source_location_id}`
                          )
                        ) : (
                          <span className="text-muted-foreground">Not tracked</span>
                        )}
                        {item.consumed_at && (
                          <Badge variant="outline" className="ml-2 gap-1 text-green-600 border-green-600/30">
                            Consumed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.uses_inventory ? (
                          <>
                            {WORK_ORDER_ITEM_ACTION_OPTIONS.find((o) => o.value === item.action_type)?.label ?? item.action_type}
                            {item.action_type === 'REPLACE' && item.replaced_item_name && (
                              <span className="block text-xs">Replaces: {item.replaced_item_name}</span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.consumed_at ? (
                          <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked — void the order to reverse" />
                        ) : (
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemove(item)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
        factoryId={itemSelectorFactoryId}
        initialTab={itemPickerTarget === 'item' ? itemPickerInitialTab : 'catalog'}
        selectedItemId={
          itemPickerTarget === 'replaced'
            ? replacedItemId
              ? Number(replacedItemId)
              : undefined
            : itemId
              ? Number(itemId)
              : undefined
        }
        title={itemPickerTarget === 'replaced' ? 'Select item being replaced' : 'Select item'}
      />
    </>
  );
};

export default EditWorkOrderItemsDialog;
