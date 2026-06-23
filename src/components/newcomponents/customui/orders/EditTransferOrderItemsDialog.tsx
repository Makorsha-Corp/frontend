import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { StepNumberInput } from '@/components/ui/step-number-input';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import {
  useAddTransferOrderItemMutation,
  useRemoveTransferOrderItemMutation,
  useUpdateTransferOrderItemMutation,
} from '@/features/transferOrders/transferOrdersApi';
import type { TransferOrderItem } from '@/types/transferOrder';
import { API_LIMITS } from '@/constants/apiLimits';
import { Check, Loader2, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExistingLineDraft {
  id: number;
  item_id: number;
  item_name: string | null;
  item_unit: string | null;
  quantity: string;
  removed: boolean;
}

interface PendingNewLine {
  key: string;
  item_id: number;
  quantity: number;
}

export interface EditTransferOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toId: number;
  items: TransferOrderItem[];
  onSaved?: () => void;
}

function newLineKey() {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function linesFromItems(items: TransferOrderItem[]): ExistingLineDraft[] {
  return items.map((item) => ({
    id: item.id,
    item_id: item.item_id,
    item_name: item.item_name,
    item_unit: item.item_unit,
    quantity: String(item.quantity),
    removed: false,
  }));
}

const EditTransferOrderItemsDialog: React.FC<EditTransferOrderItemsDialogProps> = ({
  open,
  onOpenChange,
  toId,
  items,
  onSaved,
}) => {
  const [existingLines, setExistingLines] = useState<ExistingLineDraft[]>(() => linesFromItems(items));
  const [pendingNewLines, setPendingNewLines] = useState<PendingNewLine[]>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: itemsList = [] } = useGetItemsQuery(
    { skip: 0, limit: API_LIMITS.STRICT_100 },
    { skip: !open }
  );

  const [addItem] = useAddTransferOrderItemMutation();
  const [updateItem] = useUpdateTransferOrderItemMutation();
  const [removeItem] = useRemoveTransferOrderItemMutation();

  useEffect(() => {
    if (open) {
      setExistingLines(linesFromItems(items));
      setPendingNewLines([]);
      setItemId('');
      setQty('');
    }
  }, [open, items]);

  const activeExisting = existingLines.filter((l) => !l.removed);
  const totalLineCount = activeExisting.length + pendingNewLines.length;

  const hasChanges = useMemo(() => {
    if (pendingNewLines.length > 0) return true;
    if (existingLines.some((l) => l.removed)) return true;
    const original = linesFromItems(items);
    return existingLines.some((line, idx) => {
      const orig = original[idx];
      if (!orig || line.removed) return line.removed;
      return line.quantity !== orig.quantity;
    });
  }, [existingLines, pendingNewLines, items]);

  const canAddLineItem = itemId !== '' && Number(qty) > 0;

  const handleAddLine = () => {
    if (!canAddLineItem) return;
    const id = Number(itemId);
    if (existingLines.some((l) => !l.removed && l.item_id === id)) {
      toast.error('Item already on this transfer order');
      return;
    }
    if (pendingNewLines.some((l) => l.item_id === id)) {
      toast.error('Item already in pending lines');
      return;
    }
    setPendingNewLines((prev) => [
      ...prev,
      { key: newLineKey(), item_id: id, quantity: Number(qty) },
    ]);
    setItemId('');
    setQty('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const line of existingLines) {
        const orig = items.find((i) => i.id === line.id);
        if (!orig) continue;
        if (line.removed) {
          await removeItem({ itemId: line.id, toId }).unwrap();
          continue;
        }
        if (Number(line.quantity) !== orig.quantity) {
          await updateItem({
            itemId: line.id,
            data: { quantity: Number(line.quantity) },
          }).unwrap();
        }
      }
      for (const line of pendingNewLines) {
        await addItem({
          toId,
          data: { item_id: line.item_id, quantity: line.quantity },
        }).unwrap();
      }
      toast.success('Transfer items saved');
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save items');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(80vh,42rem)] max-h-[80vh] w-[min(42rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-muted-foreground" />
              Edit transfer items
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Add line</Label>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Item *</Label>
                <Select value={itemId} onValueChange={setItemId}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {itemsList.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.name}
                        {i.unit ? ` (${i.unit})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Button
                  type="button"
                  size="icon"
                  className={
                    canAddLineItem
                      ? 'h-9 w-9 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground'
                      : 'h-9 w-9 bg-neutral-400 text-neutral-100 cursor-not-allowed'
                  }
                  onClick={handleAddLine}
                  disabled={!canAddLineItem}
                  aria-label="Add line item"
                >
                  <Check className="h-4 w-4" />
                </Button>
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
                            {line.quantity} {catalog?.unit ?? ''}
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
                  Transfer items
                </Label>
                <span className="text-xs text-muted-foreground tabular-nums">{totalLineCount} items</span>
              </div>
              {activeExisting.length === 0 && pendingNewLines.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No transfer items yet. Add at least one above.
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2">Item</TableHead>
                        <TableHead className="py-2 w-28 text-right">Qty</TableHead>
                        <TableHead className="py-2 w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingLines
                        .filter((l) => !l.removed)
                        .map((line) => (
                          <TableRow key={line.id}>
                            <TableCell className="py-2">
                              <span className="text-sm font-medium">
                                {line.item_name ?? `Item #${line.item_id}`}
                              </span>
                              {line.item_unit ? (
                                <span className="ml-1 text-xs text-muted-foreground">{line.item_unit}</span>
                              ) : null}
                            </TableCell>
                            <TableCell className="py-2">
                              <StepNumberInput
                                min={1}
                                step={1}
                                value={line.quantity}
                                onChange={(e) =>
                                  setExistingLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id ? { ...l, quantity: e.target.value } : l
                                    )
                                  )
                                }
                                className="h-8 text-right text-sm bg-background"
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  setExistingLines((prev) =>
                                    prev.map((l) =>
                                      l.id === line.id ? { ...l, removed: true } : l
                                    )
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
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
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-brand-primary hover:bg-brand-primary-hover"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Save items
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditTransferOrderItemsDialog;
