import React, { useState } from 'react';
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
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import { API_LIMITS } from '@/constants/apiLimits';
import { Plus, Trash2 } from 'lucide-react';
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
}

const MachineDialogItemsBlock: React.FC<MachineDialogItemsBlockProps> = ({
  lines,
  onLinesChange,
  hint,
}) => {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [defectiveQty, setDefectiveQty] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

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

  const handleAddLine = () => {
    const iid = parseInt(itemId, 10);
    const q = parseInt(qty, 10);
    if (isNaN(iid) || isNaN(q) || q < 0) {
      return;
    }
    if (usedItemIds.has(iid)) return;

    const req = reqQty.trim() === '' ? null : parseInt(reqQty, 10);
    const def = defectiveQty.trim() === '' ? null : parseInt(defectiveQty, 10);
    if (reqQty.trim() !== '' && (isNaN(req!) || req! < 0)) return;
    if (defectiveQty.trim() !== '' && (isNaN(def!) || def! < 0)) return;

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

        <div className="shrink-0 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex gap-2">
            <Select
              value={itemId || '__none__'}
              onValueChange={(v) => setItemId(v === '__none__' ? '' : v)}
            >
              <SelectTrigger className="min-w-0 flex-1 bg-background">
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
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setIsAddItemOpen(true)} title="Create new item">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="grid gap-1">
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
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Req qty</Label>
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
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Defective</Label>
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
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" onClick={handleAddLine} disabled={!itemId || qty === ''}>
                <Plus className="mr-1 h-4 w-4" />
                Add line
              </Button>
            </div>
          </div>
        </div>

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
};

export default MachineDialogItemsBlock;
