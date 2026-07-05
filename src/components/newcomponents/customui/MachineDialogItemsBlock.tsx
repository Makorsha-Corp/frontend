import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import { API_LIMITS } from '@/constants/apiLimits';
import { cn } from '@/lib/utils';
import { handleUnaddedItemDraftOnSubmit } from '@/components/newcomponents/customui/orders/useLineItemAddButtonHighlight';
import { Check, Trash2 } from 'lucide-react';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';

export type MachineItemDraft = {
  key: string;
  /** Present when row came from API (edit mode) */
  machineItemId?: number;
  item_id: number;
  qty: number;
  req_qty: number | null;
  defective_qty: number | null;
};

function newDraftKey() {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface MachineDialogItemsBlockProps {
  lines: MachineItemDraft[];
  onLinesChange: React.Dispatch<React.SetStateAction<MachineItemDraft[]>>;
  /** Optional subtitle under “Machine items” */
  hint?: string;
  addButtonHighlighted?: boolean;
  onAddButtonHighlightDismiss?: () => void;
}

export type MachineDialogItemsBlockHandle = {
  /** Call before parent submit. Returns true when submit should abort (unadded draft hint shown). */
  prepareSubmit: (args: {
    unaddedHintOpen: boolean;
    setUnaddedHintOpen: (open: boolean) => void;
    pulseAddButtonHighlight: () => void;
  }) => boolean;
};

const MachineDialogItemsBlock = forwardRef<
  MachineDialogItemsBlockHandle,
  MachineDialogItemsBlockProps
>(function MachineDialogItemsBlock(
  { lines, onLinesChange, hint, addButtonHighlighted = false, onAddButtonHighlightDismiss },
  ref
) {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [defectiveQty, setDefectiveQty] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addHintOpen, setAddHintOpen] = useState(false);

  const hasUnaddedItemDraft = Boolean(
    itemId.trim() || qty.trim() || reqQty.trim() || defectiveQty.trim()
  );

  const clearComposerDraft = () => {
    setItemId('');
    setQty('');
    setReqQty('');
    setDefectiveQty('');
  };

  useImperativeHandle(ref, () => ({
    prepareSubmit: ({ unaddedHintOpen, setUnaddedHintOpen, pulseAddButtonHighlight }) => {
      return (
        handleUnaddedItemDraftOnSubmit({
          hasUnaddedItemDraft,
          unaddedHintOpen,
          setUnaddedHintOpen,
          pulseAddButtonHighlight,
          clearDraft: clearComposerDraft,
        }) === 'blocked'
      );
    },
  }));

  const { data: itemsList = [], refetch: refetchItems } = useGetItemsQuery(
    { skip: 0, limit: API_LIMITS.STRICT_100 },
    { skip: false }
  );

  const usedItemIds = new Set(lines.map((l) => l.item_id));
  const availableItems = itemsList.filter((i) => !usedItemIds.has(i.id));

  const handleCreateItemSuccess = (newItem: Item) => {
    refetchItems();
    setItemId(newItem.id.toString());
    setIsAddItemOpen(false);
  };

  const canAddLineItem = (() => {
    if (!itemId.trim() || qty.trim() === '') return false;
    const iid = parseInt(itemId, 10);
    const q = parseInt(qty, 10);
    if (isNaN(iid) || isNaN(q) || q < 0 || usedItemIds.has(iid)) return false;
    if (reqQty.trim() !== '') {
      const req = parseInt(reqQty, 10);
      if (isNaN(req) || req < 0) return false;
    }
    if (defectiveQty.trim() !== '') {
      const def = parseInt(defectiveQty, 10);
      if (isNaN(def) || def < 0) return false;
    }
    return true;
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

  const handleAddLineClick = () => {
    if (!canAddLineItem) {
      setAddHintOpen(true);
      return;
    }
    const iid = parseInt(itemId, 10);
    const q = parseInt(qty, 10);
    const req = reqQty.trim() === '' ? null : parseInt(reqQty, 10);
    const def = defectiveQty.trim() === '' ? null : parseInt(defectiveQty, 10);

    onLinesChange((prev) => [
      ...prev,
      {
        key: newDraftKey(),
        item_id: iid,
        qty: q,
        req_qty: req,
        defective_qty: def,
      },
    ]);
    setItemId('');
    setQty('');
    setReqQty('');
    setDefectiveQty('');
    setAddHintOpen(false);
    onAddButtonHighlightDismiss?.();
  };

  const updateLine = (key: string, patch: Partial<Pick<MachineItemDraft, 'qty' | 'req_qty' | 'defective_qty'>>) => {
    onLinesChange((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  };

  const removeLine = (key: string) => {
    onLinesChange((prev) => prev.filter((l) => l.key !== key));
  };

  const resolveName = (id: number) => itemsList.find((i) => i.id === id)?.name ?? `Item #${id}`;

  const addFormItemIdNum = parseInt(itemId, 10);
  const addFormUnit =
    itemId !== '' && !isNaN(addFormItemIdNum)
      ? itemsList.find((i) => i.id === addFormItemIdNum)?.unit
      : undefined;

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base">Machine items</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{lines.length} line{lines.length !== 1 ? 's' : ''}</span>
          </div>
          {hint?.trim() ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>

        <TooltipProvider delayDuration={150}>
          <div className="shrink-0 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <Select
                  value={itemId || '__none__'}
                  onValueChange={(v) => setItemId(v === '__none__' ? '' : v)}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select item</SelectItem>
                    {availableItems.map((i) => (
                      <SelectItem key={i.id} value={i.id.toString()}>
                        {i.name}
                        {i.unit ? ` (${i.unit})` : ''}
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
                onClick={() => setIsAddItemOpen(true)}
              >
                Create item +
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="grid min-w-[5rem] flex-1 gap-1">
                <Label className="text-xs text-muted-foreground">
                  Qty *{addFormUnit ? ` (${addFormUnit})` : ''}
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="bg-background"
                />
              </div>
              <div className="grid min-w-[5.5rem] flex-1 gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="w-fit cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                      Required
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[14rem]">
                    Optional minimum quantity to keep on this machine.
                  </TooltipContent>
                </Tooltip>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  placeholder="—"
                  className="bg-background"
                />
              </div>
              <div className="grid min-w-[5.5rem] flex-1 gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="w-fit cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                      Defective
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[14rem]">
                    Optional count of defective units tracked separately from on-hand qty.
                  </TooltipContent>
                </Tooltip>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={defectiveQty}
                  onChange={(e) => setDefectiveQty(e.target.value)}
                  placeholder="—"
                  className="bg-background"
                />
              </div>
              <div className="relative shrink-0" data-add-item-hint-root>
                {addHintOpen && !canAddLineItem ? (
                  <div
                    role="tooltip"
                    className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[14rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                  >
                    Select item and qty
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  className={cn(
                    canAddLineItem
                      ? 'h-10 w-10 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground'
                      : 'h-10 w-10 bg-neutral-400 text-neutral-100 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600 cursor-not-allowed',
                    addButtonHighlighted && 'po-scroll-target-highlight'
                  )}
                  onClick={handleAddLineClick}
                  onMouseEnter={() => {
                    if (addButtonHighlighted) onAddButtonHighlightDismiss?.();
                  }}
                  aria-label="Add line item"
                  aria-expanded={addHintOpen && !canAddLineItem}
                  aria-disabled={!canAddLineItem}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TooltipProvider>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background">
          {lines.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">No items yet — add from the catalog above.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((line, idx) => {
                const prev = idx > 0 ? lines[idx - 1] : undefined;
                const insertSep =
                  idx > 0 &&
                  line.machineItemId == null &&
                  prev != null &&
                  prev.machineItemId != null;
                const unit = itemsList.find((i) => i.id === line.item_id)?.unit;
                return (
                  <li key={line.key} className="px-3 py-2.5">
                    {insertSep ? (
                      <div className="-mx-3 mb-3 px-3">
                        <Separator />
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1 sm:flex sm:items-center">
                        <p className="truncate text-sm font-medium text-foreground">{resolveName(line.item_id)}</p>
                      </div>
                      <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[14rem]">
                        <div className="grid gap-0.5">
                          <Label className="text-[10px] text-muted-foreground">
                            Qty{unit ? ` (${unit})` : ''}
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={line.qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              updateLine(line.key, { qty: isNaN(v) ? 0 : v });
                            }}
                            className="h-8 bg-background text-sm"
                          />
                        </div>
                        <div className="grid gap-0.5">
                          <Label className="text-[10px] text-muted-foreground">Req</Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={line.req_qty ?? ''}
                            onChange={(e) => {
                              const t = e.target.value;
                              updateLine(line.key, {
                                req_qty: t === '' ? null : parseInt(t, 10),
                              });
                            }}
                            placeholder="—"
                            className="h-8 bg-background text-sm"
                          />
                        </div>
                        <div className="grid gap-0.5">
                          <Label className="text-[10px] text-muted-foreground">Def.</Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={line.defective_qty ?? ''}
                            onChange={(e) => {
                              const t = e.target.value;
                              updateLine(line.key, {
                                defective_qty: t === '' ? null : parseInt(t, 10),
                              });
                            }}
                            placeholder="—"
                            className="h-8 bg-background text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 self-end sm:self-center text-destructive hover:text-destructive"
                        onClick={() => removeLine(line.key)}
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <AddItemDialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen} onSuccess={handleCreateItemSuccess} />
    </>
  );
});

export default MachineDialogItemsBlock;
