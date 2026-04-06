import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetFormulaItemsQuery,
  useAddFormulaItemMutation,
  useRemoveFormulaItemMutation,
} from '@/features/production/productionApi';
import type { ProductionFormula, ProductionFormulaItem, ItemRole } from '@/types/production';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Trash2 } from 'lucide-react';

const ITEM_ROLES: ItemRole[] = ['input', 'output', 'waste', 'byproduct'];

const FORMULA_ROLE_BADGE: Record<ItemRole, string> = {
  input: 'border-transparent bg-blue-500/15 text-blue-800 dark:text-blue-200',
  output: 'border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  waste: 'border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-100',
  byproduct: 'border-transparent bg-violet-500/15 text-violet-800 dark:text-violet-200',
};

const FORMULA_ROLE_SECTION_TITLE: Record<ItemRole, string> = {
  input: 'Inputs',
  output: 'Outputs',
  waste: 'Waste',
  byproduct: 'Byproducts',
};

export interface FormulaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: ProductionFormula;
  items: { id: number; name: string }[];
  getItemName: (id: number) => string;
}

const FormulaDetailsDialog: React.FC<FormulaDetailsDialogProps> = ({
  open,
  onOpenChange,
  formula,
  items,
  getItemName,
}) => {
  const formulaId = formula.id;
  const { data: formulaItems = [], isLoading } = useGetFormulaItemsQuery(
    { formulaId },
    { skip: !open }
  );
  const [addFormulaItem, { isLoading: isAdding }] = useAddFormulaItemMutation();
  const [removeFormulaItem] = useRemoveFormulaItemMutation();
  const [addItemId, setAddItemId] = useState('');
  const [addRole, setAddRole] = useState<ItemRole>('input');
  const [addQty, setAddQty] = useState('1');

  useEffect(() => {
    if (open) {
      setAddItemId('');
      setAddRole('input');
      setAddQty('1');
    }
  }, [open, formulaId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemId = parseInt(addItemId, 10);
    const qty = parseInt(addQty, 10);
    if (!itemId || qty < 1) {
      toast.error('Select item and enter quantity');
      return;
    }
    const exists = formulaItems.some((fi) => fi.item_id === itemId && fi.item_role === addRole);
    if (exists) {
      toast.error('This item/role combination already exists');
      return;
    }
    try {
      await addFormulaItem({
        formulaId,
        data: {
          formula_id: formulaId,
          item_id: itemId,
          item_role: addRole,
          quantity: qty,
        },
      }).unwrap();
      toast.success('Item added');
      setAddItemId('');
      setAddQty('1');
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to add');
    }
  };

  const handleRemove = async (row: ProductionFormulaItem) => {
    if (!window.confirm(`Remove ${getItemName(row.item_id)} from formula?`)) return;
    try {
      await removeFormulaItem(row.id).unwrap();
      toast.success('Item removed');
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to remove');
    }
  };

  const byRole = useMemo(() => {
    const map: Record<ItemRole, ProductionFormulaItem[]> = {
      input: [],
      output: [],
      waste: [],
      byproduct: [],
    };
    for (const fi of formulaItems) {
      map[fi.item_role as ItemRole].push(fi);
    }
    return map;
  }, [formulaItems]);

  const metaParts = [
    formula.formula_code,
    `v${formula.version}`,
    formula.estimated_duration_minutes != null ? `${formula.estimated_duration_minutes} min` : null,
  ].filter(Boolean);

  const bomBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill of materials</p>
        {!isLoading && (
          <span className="text-xs tabular-nums text-muted-foreground">{formulaItems.length} lines</span>
        )}
      </div>
      <Separator className="mb-3 shrink-0" />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-6 pl-0.5 pr-1 pt-0.5">
          {formulaItems.length === 0 && (
            <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">
              No lines yet — use <span className="font-medium text-foreground">Add item</span> on the right.
            </p>
          )}
          {ITEM_ROLES.map((role) => {
            const rows = byRole[role];
            return (
              <div key={role} className="rounded-lg border border-border/80 bg-card shadow-sm">
                <div
                  className={cn(
                    'flex items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-3 py-2.5'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'shrink-0 text-[10px] font-semibold uppercase tracking-wide',
                        FORMULA_ROLE_BADGE[role]
                      )}
                    >
                      {role}
                    </Badge>
                    <span className="truncate text-sm font-medium text-foreground">
                      {FORMULA_ROLE_SECTION_TITLE[role]}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {rows.length} {rows.length === 1 ? 'line' : 'lines'}
                  </span>
                </div>
                {rows.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm italic text-muted-foreground">None</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead className="text-xs font-medium">Item</TableHead>
                        <TableHead className="w-[120px] text-right text-xs font-medium">Qty</TableHead>
                        <TableHead className="hidden w-[120px] text-xs font-medium sm:table-cell">
                          Tolerance
                        </TableHead>
                        <TableHead className="w-[56px] text-right text-xs font-medium"> </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="![&_tr:last-child]:border-b [&_tr:last-child]:border-border/60">
                      {rows.map((fi) => (
                        <TableRow key={fi.id} className="border-border/60">
                          <TableCell className="py-2.5 align-middle font-medium">
                            {getItemName(fi.item_id)}
                          </TableCell>
                          <TableCell className="py-2.5 align-middle text-right tabular-nums">
                            <span className="font-medium text-foreground">{fi.quantity}</span>
                            {fi.unit ? <span className="text-muted-foreground"> {fi.unit}</span> : null}
                          </TableCell>
                          <TableCell className="hidden py-2.5 align-middle text-xs text-muted-foreground sm:table-cell">
                            {fi.tolerance_percentage != null ? `±${fi.tolerance_percentage}%` : '—'}
                            {fi.is_optional && (
                              <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px]">
                                optional
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 align-middle text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemove(fi)}
                              aria-label={`Remove ${getItemName(fi.item_id)}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const addItemBlock = (
    <div className="flex min-h-0 min-w-0 flex-col">
      <p className="mb-1 text-sm font-medium text-foreground">Add item</p>
      <p className="mb-4 text-xs text-muted-foreground">Append an item to this formula. Saves immediately.</p>
      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="formula-add-item">Item</Label>
          <Select value={addItemId} onValueChange={setAddItemId}>
            <SelectTrigger id="formula-add-item" className="w-full">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id.toString()}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="formula-add-role">Role</Label>
          <Select value={addRole} onValueChange={(v) => setAddRole(v as ItemRole)}>
            <SelectTrigger id="formula-add-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="formula-add-qty">Quantity</Label>
          <Input
            id="formula-add-qty"
            type="number"
            min={1}
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
            placeholder="1"
          />
        </div>
        <Button
          type="submit"
          disabled={isAdding}
          className="w-full bg-brand-primary hover:bg-brand-primary-hover sm:w-auto sm:self-start"
        >
          {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add item
        </Button>
      </form>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(66vh,720px)] max-h-[90vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-x-clip overflow-y-auto p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle className="text-brand-secondary">{formula.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs tabular-nums">
            {metaParts.join(' · ')}
          </DialogDescription>
          {formula.description?.trim() && (
            <p className="text-sm text-muted-foreground">{formula.description.trim()}</p>
          )}
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-col py-1 pl-1 pr-2 md:pr-3">{bomBlock}</div>
          <div className="flex min-h-0 min-w-0 flex-col border-t border-border py-2 pl-2 pr-4 pt-6 md:border-t-0 md:border-l md:border-border md:py-2 md:pl-10 md:pr-5 md:pt-2">
            {addItemBlock}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaDetailsDialog;
