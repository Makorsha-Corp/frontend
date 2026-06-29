import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import {
  useAddPurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
  useSyncPurchaseOrderItemsMutation,
  useUpdatePurchaseOrderItemMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import type { PurchaseOrderItem } from '@/types/purchaseOrder';
import type { Item } from '@/types/item';
import { API_LIMITS } from '@/constants/apiLimits';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import { cn } from '@/lib/utils';
import { Check, Loader2, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExistingLineDraft {
  id: number;
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  quantity_ordered: string;
  quantity_received: number;
  unit_price: string;
  removed: boolean;
}

interface PendingNewLine {
  key: string;
  item_id: number;
  quantity_ordered: number;
  unit_price: number | null;
}

export interface EditPurchaseOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poId: number;
  items: PurchaseOrderItem[];
  onSaved?: () => void;
}

function newLineKey() {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function numEq(a: number | string, b: number | string): boolean {
  return Math.abs(Number(a) - Number(b)) < 1e-9;
}

function parseUnitPriceForSave(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

function unitPriceDraftEq(raw: string, original: number | null): boolean {
  const parsed = parseUnitPriceForSave(raw);
  if (parsed === null && (original === null || original === undefined)) return true;
  if (parsed === null || original === null || original === undefined) return false;
  return numEq(parsed, original);
}

function draftLineNeedsUnitPrice(unitPrice: string): boolean {
  const trimmed = unitPrice.trim();
  if (trimmed === '') return true;
  const n = parseFloat(trimmed);
  return !Number.isFinite(n) || n <= 0;
}

function linesFromItems(items: PurchaseOrderItem[]): ExistingLineDraft[] {
  return items.map((item) => ({
    id: item.id,
    item_id: item.item_id,
    item_name: item.item_name,
    item_unit: item.item_unit,
    quantity_ordered: String(item.quantity_ordered),
    quantity_received: Number(item.quantity_received),
    unit_price: item.unit_price != null ? String(item.unit_price) : '',
    removed: false,
  }));
}

const EditPurchaseOrderItemsDialog: React.FC<EditPurchaseOrderItemsDialogProps> = ({
  open,
  onOpenChange,
  poId,
  items,
  onSaved,
}) => {
  const [existingLines, setExistingLines] = useState<ExistingLineDraft[]>(() => linesFromItems(items));
  const [pendingNewLines, setPendingNewLines] = useState<PendingNewLine[]>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [addHintOpen, setAddHintOpen] = useState(false);
  const [unaddedHintOpen, setUnaddedHintOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnaddedItemDraft = Boolean(itemId.trim() || qty.trim() || unitPrice.trim());

  const { data: itemsList = [], refetch: refetchItems } = useGetItemsQuery(
    { skip: 0, limit: API_LIMITS.STRICT_100 },
    { skip: !open }
  );
  const [addItem] = useAddPurchaseOrderItemMutation();
  const [updateItem] = useUpdatePurchaseOrderItemMutation();
  const [removeItem] = useRemovePurchaseOrderItemMutation();
  const [syncItems] = useSyncPurchaseOrderItemsMutation();

  useEffect(() => {
    if (open && !isSaving) {
      setExistingLines(linesFromItems(items));
      setPendingNewLines([]);
      setItemId('');
      setQty('');
      setUnitPrice('');
      setAddHintOpen(false);
      setUnaddedHintOpen(false);
    }
  }, [open, items, isSaving]);

  useEffect(() => {
    if (!hasUnaddedItemDraft) setUnaddedHintOpen(false);
  }, [hasUnaddedItemDraft]);

  const originalById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const usedItemIds = useMemo(() => {
    const ids = new Set<number>();
    existingLines.forEach((l) => {
      if (!l.removed) ids.add(l.item_id);
    });
    pendingNewLines.forEach((l) => ids.add(l.item_id));
    return ids;
  }, [existingLines, pendingNewLines]);

  const availableItems = itemsList.filter((i) => !usedItemIds.has(i.id));

  const canAddLineItem = (() => {
    if (!itemId.trim() || !qty.trim()) return false;
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    if (unitPrice.trim()) {
      const p = parseFloat(unitPrice);
      if (Number.isNaN(p) || p < 0) return false;
    }
    return !isNaN(iid) && !isNaN(q) && q > 0 && !usedItemIds.has(iid);
  })();

  useEffect(() => {
    if (canAddLineItem) setAddHintOpen(false);
  }, [canAddLineItem]);

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

  const handleCreateItemSuccess = (newItem: Item) => {
    refetchItems();
    setItemId(newItem.id.toString());
    setIsCreateItemOpen(false);
  };

  const handleAddLineClick = () => {
    if (!canAddLineItem) {
      setAddHintOpen(true);
      return;
    }
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = unitPrice.trim() ? parseFloat(unitPrice) : null;
    if (p != null && (Number.isNaN(p) || p < 0)) {
      toast.error('Enter a valid unit price or leave blank');
      return;
    }
    setPendingNewLines((prev) => [
      ...prev,
      { key: newLineKey(), item_id: iid, quantity_ordered: q, unit_price: p },
    ]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setAddHintOpen(false);
  };

  const validateLines = (): boolean => {
    const activeExisting = existingLines.filter((l) => !l.removed);
    if (activeExisting.length + pendingNewLines.length === 0) {
      toast.error('At least one order item is required');
      return false;
    }

    for (const line of activeExisting) {
      const ordered = parseFloat(line.quantity_ordered);
      if (!Number.isFinite(ordered) || ordered <= 0) {
        toast.error(`Invalid quantity for ${line.item_name ?? 'item'}`);
        return false;
      }
      const trimmedPrice = line.unit_price.trim();
      if (trimmedPrice !== '') {
        const price = parseFloat(trimmedPrice);
        if (!Number.isFinite(price) || price < 0) {
          toast.error(`Invalid unit price for ${line.item_name ?? 'item'}`);
          return false;
        }
      }
      const orig = originalById.get(line.id);
      const minOrdered = Math.max(
        line.quantity_received,
        Number(orig?.quantity_received ?? 0)
      );
      if (ordered < minOrdered) {
        toast.error(
          `${line.item_name ?? 'Item'}: ordered qty cannot be less than received (${minOrdered})`
        );
        return false;
      }
    }

    for (const line of pendingNewLines) {
      if (!Number.isFinite(line.quantity_ordered) || line.quantity_ordered <= 0) {
        toast.error('Invalid quantity on new line item');
        return false;
      }
      if (line.unit_price != null && line.unit_price < 0) {
        toast.error('Invalid unit price on new line item');
        return false;
      }
    }
    return true;
  };

  const hasChanges = useMemo(() => {
    if (pendingNewLines.length > 0) return true;
    for (const line of existingLines) {
      if (line.removed) return true;
      const orig = originalById.get(line.id);
      if (!orig) continue;
      if (
        !numEq(orig.quantity_ordered, line.quantity_ordered) ||
        !unitPriceDraftEq(line.unit_price, orig.unit_price)
      ) {
        return true;
      }
    }
    return false;
  }, [existingLines, pendingNewLines, originalById]);

  const handleSave = async () => {
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
    if (!validateLines()) return;
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const removeIds = existingLines.filter((l) => l.removed).map((l) => l.id);
      const updates = existingLines
        .filter((l) => !l.removed)
        .flatMap((line) => {
          const orig = originalById.get(line.id);
          if (!orig) return [];
          if (
            numEq(orig.quantity_ordered, line.quantity_ordered) &&
            unitPriceDraftEq(line.unit_price, orig.unit_price)
          ) {
            return [];
          }
          return [{
            id: line.id,
            quantity_ordered: parseFloat(line.quantity_ordered),
            unit_price: parseUnitPriceForSave(line.unit_price),
          }];
        });
      const additions = pendingNewLines.map((line) => ({
        item_id: line.item_id,
        quantity_ordered: line.quantity_ordered,
        unit_price: line.unit_price,
      }));

      try {
        await syncItems({
          poId,
          data: { remove_ids: removeIds, updates, additions },
        }).unwrap();
      } catch (syncErr: unknown) {
        const se = syncErr as { status?: number };
        if (se?.status !== 404) throw syncErr;

        for (const line of existingLines) {
          if (line.removed) {
            await removeItem(line.id).unwrap();
            continue;
          }
          const orig = originalById.get(line.id);
          if (!orig) continue;
          const ordered = parseFloat(line.quantity_ordered);
          const price = parseUnitPriceForSave(line.unit_price);
          if (
            !numEq(orig.quantity_ordered, line.quantity_ordered) ||
            !unitPriceDraftEq(line.unit_price, orig.unit_price)
          ) {
            await updateItem({
              itemId: line.id,
              poId,
              data: { quantity_ordered: ordered, unit_price: price },
            }).unwrap();
          }
        }
        for (const line of pendingNewLines) {
          await addItem({
            poId,
            data: {
              item_id: line.item_id,
              quantity_ordered: line.quantity_ordered,
              unit_price: line.unit_price,
            },
          }).unwrap();
        }
      }

      toast.success('Order items updated');
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: unknown } })?.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : String(d))).join('; ')
            : undefined;
      toast.error(message || 'Failed to save order items');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  const activeExistingCount = existingLines.filter((l) => !l.removed).length;
  const totalLineCount = activeExistingCount + pendingNewLines.length;
  const linesMissingPriceCount = useMemo(() => {
    let count = 0;
    for (const line of existingLines) {
      if (!line.removed && draftLineNeedsUnitPrice(line.unit_price)) count += 1;
    }
    for (const line of pendingNewLines) {
      if (line.unit_price == null || line.unit_price <= 0) count += 1;
    }
    return count;
  }, [existingLines, pendingNewLines]);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
        <DialogContent className="flex max-h-[min(90dvh,720px)] w-[min(52rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
            <DialogTitle className="flex items-center gap-2 text-brand-heading">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              Edit Items and Prices
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update quantities and prices, add lines, or remove items.
            </p>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <Label className="text-sm font-medium">Add order item</Label>
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
                  className="h-9 shrink-0 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground"
                  onClick={() => setIsCreateItemOpen(true)}
                >
                  Create item +
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="grid min-w-[5rem] flex-1 gap-1">
                  <Label className="text-xs text-muted-foreground">Qty *</Label>
                  <StepNumberInput
                    min={1}
                    step={1}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="h-9 bg-background"
                  />
                </div>
                <div className="grid min-w-[5.5rem] flex-1 gap-1">
                  <Label className="text-xs text-muted-foreground">Unit price (optional)</Label>
                  <StepNumberInput
                    min={0}
                    step={1}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="h-9 bg-background"
                  />
                </div>
                <div className="relative shrink-0" data-add-item-hint-root>
                  {addHintOpen && !canAddLineItem ? (
                    <div
                      role="tooltip"
                      className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[14rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md"
                    >
                      Select item and qty to add (unit price optional)
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    size="icon"
                    className={
                      canAddLineItem
                        ? 'h-9 w-9 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground'
                        : 'h-9 w-9 bg-neutral-400 text-neutral-100 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600 cursor-not-allowed'
                    }
                    onClick={handleAddLineClick}
                    aria-label="Add line item"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {pendingNewLines.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Pending new lines
                </Label>
                <div className="rounded-lg border border-dashed border-brand-primary/30 bg-brand-primary/5 divide-y divide-border">
                  {pendingNewLines.map((line) => {
                    const catalog = itemsList.find((i) => i.id === line.item_id);
                    return (
                      <div key={line.key} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {catalog?.name ?? `Item #${line.item_id}`}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {line.quantity_ordered} {catalog?.unit ?? ''} ·{' '}
                            {line.unit_price != null ? (
                              `${formatCurrency(line.unit_price)} each`
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">Set unit price</span>
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() =>
                            setPendingNewLines((prev) => prev.filter((p) => p.key !== line.key))
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Order items
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">{totalLineCount} items</span>
              </div>
              {activeExistingCount === 0 && pendingNewLines.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No order items yet. Add at least one above.
                </div>
              ) : (
                <>
                  {linesMissingPriceCount > 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {linesMissingPriceCount === 1
                        ? '1 item still needs a unit price — required before you can confirm order items.'
                        : `${linesMissingPriceCount} items still need unit prices — required before you can confirm order items.`}
                    </p>
                  ) : null}
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2">Item</TableHead>
                        <TableHead className="py-2 w-28 text-right">Ordered</TableHead>
                        <TableHead className="py-2 w-28 text-right">Unit price</TableHead>
                        <TableHead className="py-2 w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingLines
                        .filter((l) => !l.removed)
                        .map((line) => {
                          const needsPrice = draftLineNeedsUnitPrice(line.unit_price);
                          return (
                          <TableRow
                            key={line.id}
                            className={needsPrice ? 'bg-amber-50/60 dark:bg-amber-950/20' : undefined}
                          >
                            <TableCell className="py-2">
                              <span className="text-sm font-medium">
                                {line.item_name ?? `Item #${line.item_id}`}
                              </span>
                              {line.item_unit ? (
                                <span className="ml-1 text-xs text-muted-foreground">{line.item_unit}</span>
                              ) : null}
                              {needsPrice ? (
                                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                                  Set unit price
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="py-2">
                              <StepNumberInput
                                min={line.quantity_received}
                                step={1}
                                value={line.quantity_ordered}
                                onChange={(e) =>
                                  setExistingLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id
                                        ? { ...l, quantity_ordered: e.target.value }
                                        : l
                                    )
                                  )
                                }
                                className="h-8 text-right text-sm bg-background"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <StepNumberInput
                                min={0}
                                step={1}
                                value={line.unit_price}
                                onChange={(e) =>
                                  setExistingLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id ? { ...l, unit_price: e.target.value } : l
                                    )
                                  )
                                }
                                className={cn(
                                  'h-8 text-right text-sm bg-background',
                                  needsPrice &&
                                    'border-amber-400/70 focus-visible:ring-amber-400/40 dark:border-amber-600/70'
                                )}
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (line.quantity_received > 0) {
                                    toast.error(
                                      `Cannot remove ${line.item_name ?? 'this item'} — receiving has already been recorded`
                                    );
                                    return;
                                  }
                                  setExistingLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id ? { ...l, removed: true } : l
                                    )
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                        })}
                    </TableBody>
                  </Table>
                </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-between">
            <span className="text-xs text-muted-foreground mr-auto">
              {hasChanges ? 'Unsaved changes' : 'No changes'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <div className="relative" data-unadded-hint-root>
                {unaddedHintOpen ? (
                  <div
                    role="tooltip"
                    className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[16rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                  >
                    You have unadded order items — click ✓ to add them, or click Save again to continue without them
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || (!hasChanges && !hasUnaddedItemDraft)}
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                >
                  {isSaving ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-4 w-4" />
                  )}
                  Save changes
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddItemDialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen} onSuccess={handleCreateItemSuccess} />
    </>
  );
};

export default EditPurchaseOrderItemsDialog;
