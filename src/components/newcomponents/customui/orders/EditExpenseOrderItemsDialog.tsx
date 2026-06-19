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
import {
  useAddExpenseOrderItemMutation,
  useRemoveExpenseOrderItemMutation,
  useUpdateExpenseOrderItemMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import type { ExpenseOrderItem } from '@/types/expenseOrder';
import { API_LIMITS } from '@/constants/apiLimits';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UNITS = ['', 'hr', 'day', 'month', 'pcs', 'kg', 'L', 'm', 'sqm'];
const COST_CENTER_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'factory', label: 'Factory' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'department', label: 'Department' },
] as const;

interface ExistingLineDraft {
  id: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  cost_center_type: string;
  cost_center_id: string;
  notes: string;
  removed: boolean;
}

interface PendingNewLine {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  cost_center_type: string | null;
  cost_center_id: number | null;
  notes: string;
}

export interface EditExpenseOrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eoId: number;
  items: ExpenseOrderItem[];
  onSaved?: () => void;
}

function newLineKey() {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function linesFromItems(items: ExpenseOrderItem[]): ExistingLineDraft[] {
  return items.map((item) => ({
    id: item.id,
    description: item.description ?? '',
    quantity: String(item.quantity),
    unit: item.unit ?? '',
    unit_price: item.unit_price != null ? String(item.unit_price) : '',
    cost_center_type: item.cost_center_type ?? 'none',
    cost_center_id: item.cost_center_id != null ? String(item.cost_center_id) : 'none',
    notes: item.notes ?? '',
    removed: false,
  }));
}

const EditExpenseOrderItemsDialog: React.FC<EditExpenseOrderItemsDialogProps> = ({
  open,
  onOpenChange,
  eoId,
  items,
  onSaved,
}) => {
  const [existingLines, setExistingLines] = useState<ExistingLineDraft[]>(() => linesFromItems(items));
  const [pendingNewLines, setPendingNewLines] = useState<PendingNewLine[]>([]);
  const [lineDescription, setLineDescription] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [lineUnit, setLineUnit] = useState('none');
  const [linePrice, setLinePrice] = useState('');
  const [lineCostCenterType, setLineCostCenterType] = useState('none');
  const [lineCostCenterId, setLineCostCenterId] = useState('none');
  const [lineNotes, setLineNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: factories = [] } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: machines = [] } = useGetMachinesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: projects = [] } = useGetProjectsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: departments = [] } = useGetDepartmentsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );

  const [addItem] = useAddExpenseOrderItemMutation();
  const [updateItem] = useUpdateExpenseOrderItemMutation();
  const [removeItem] = useRemoveExpenseOrderItemMutation();

  useEffect(() => {
    if (open) {
      setExistingLines(linesFromItems(items));
      setPendingNewLines([]);
      setLineDescription('');
      setLineQty('1');
      setLineUnit('none');
      setLinePrice('');
      setLineCostCenterType('none');
      setLineCostCenterId('none');
      setLineNotes('');
    }
  }, [open, items]);

  const costCenterOptions = useMemo(() => {
    switch (lineCostCenterType) {
      case 'factory':
        return factories.map((f) => ({ id: f.id, label: f.name }));
      case 'machine':
        return machines.map((m) => ({ id: m.id, label: m.name }));
      case 'project':
        return projects.map((p) => ({ id: p.id, label: p.name }));
      case 'department':
        return departments.map((d) => ({ id: d.id, label: d.name }));
      default:
        return [];
    }
  }, [lineCostCenterType, factories, machines, projects, departments]);

  const hasChanges = useMemo(() => {
    if (pendingNewLines.length > 0) return true;
    if (existingLines.some((l) => l.removed)) return true;
    const original = linesFromItems(items);
    return existingLines.some((line, idx) => {
      const orig = original[idx];
      if (!orig || line.removed) return line.removed;
      return JSON.stringify(line) !== JSON.stringify(orig);
    });
  }, [existingLines, pendingNewLines, items]);

  const parseCostCenter = (type: string, id: string) => {
    if (type === 'none' || id === 'none') return { cost_center_type: null, cost_center_id: null };
    return { cost_center_type: type, cost_center_id: Number(id) };
  };

  const handleAddLine = () => {
    const q = parseFloat(lineQty);
    const p = parseFloat(linePrice);
    if (!lineDescription.trim()) {
      toast.error('Enter a description');
      return;
    }
    if (isNaN(q) || q <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (isNaN(p) || p < 0) {
      toast.error('Enter a valid unit price');
      return;
    }
    if (lineCostCenterType !== 'none' && lineCostCenterId === 'none') {
      toast.error('Select a cost center');
      return;
    }
    const cc = parseCostCenter(lineCostCenterType, lineCostCenterId);
    setPendingNewLines((prev) => [
      ...prev,
      {
        key: newLineKey(),
        description: lineDescription.trim(),
        quantity: q,
        unit: lineUnit !== 'none' ? lineUnit : '',
        unit_price: p,
        cost_center_type: cc.cost_center_type,
        cost_center_id: cc.cost_center_id,
        notes: lineNotes.trim(),
      },
    ]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('none');
    setLinePrice('');
    setLineCostCenterType('none');
    setLineCostCenterId('none');
    setLineNotes('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const line of existingLines) {
        const orig = items.find((i) => i.id === line.id);
        if (!orig) continue;
        if (line.removed) {
          await removeItem({ itemId: line.id, eoId }).unwrap();
          continue;
        }
        const cc = parseCostCenter(line.cost_center_type, line.cost_center_id);
        const payload = {
          description: line.description.trim() || null,
          quantity: Number(line.quantity),
          unit: line.unit || null,
          unit_price: line.unit_price ? Number(line.unit_price) : null,
          cost_center_type: cc.cost_center_type,
          cost_center_id: cc.cost_center_id,
          notes: line.notes.trim() || null,
        };
        const changed =
          orig.description !== payload.description ||
          Number(orig.quantity) !== payload.quantity ||
          (orig.unit ?? '') !== (payload.unit ?? '') ||
          Number(orig.unit_price ?? 0) !== Number(payload.unit_price ?? 0) ||
          orig.cost_center_type !== payload.cost_center_type ||
          orig.cost_center_id !== payload.cost_center_id ||
          (orig.notes ?? '') !== (payload.notes ?? '');
        if (changed) {
          await updateItem({ itemId: line.id, data: payload, eoId }).unwrap();
        }
      }
      for (const line of pendingNewLines) {
        await addItem({
          eoId,
          data: {
            description: line.description,
            quantity: line.quantity,
            unit: line.unit || null,
            unit_price: line.unit_price,
            cost_center_type: line.cost_center_type,
            cost_center_id: line.cost_center_id,
            notes: line.notes || null,
          },
        }).unwrap();
      }
      toast.success('Expenses updated');
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save expenses');
    } finally {
      setIsSaving(false);
    }
  };

  const costCenterLabel = (type: string | null, id: number | null) => {
    if (!type || id == null) return '—';
    if (type === 'factory') return factories.find((f) => f.id === id)?.name ?? `#${id}`;
    if (type === 'machine') return machines.find((m) => m.id === id)?.name ?? `#${id}`;
    if (type === 'project') return projects.find((p) => p.id === id)?.name ?? `#${id}`;
    if (type === 'department') return departments.find((d) => d.id === id)?.name ?? `#${id}`;
    return `${type} #${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Edit expenses</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="shrink-0 space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Description *</Label>
              <Input
                value={lineDescription}
                onChange={(e) => setLineDescription(e.target.value)}
                placeholder="What was purchased or billed"
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Qty</Label>
                <StepNumberInput min={1} step={1} value={lineQty} onChange={(e) => setLineQty(e.target.value)} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Unit</Label>
                <Select value={lineUnit} onValueChange={setLineUnit}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {UNITS.filter(Boolean).map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Unit price</Label>
                <StepNumberInput
                  min={0}
                  step={1}
                  value={linePrice}
                  onChange={(e) => setLinePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={handleAddLine}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add line
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Cost center type</Label>
                <Select
                  value={lineCostCenterType}
                  onValueChange={(v) => {
                    setLineCostCenterType(v);
                    setLineCostCenterId('none');
                  }}
                >
                  <SelectTrigger className="bg-background mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_CENTER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cost center</Label>
                <Select
                  value={lineCostCenterId}
                  onValueChange={setLineCostCenterId}
                  disabled={lineCostCenterType === 'none'}
                >
                  <SelectTrigger className="bg-background mt-1">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {costCenterOptions.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Cost center</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingLines.filter((l) => !l.removed).length === 0 && pendingNewLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No expense lines
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {existingLines
                      .filter((l) => !l.removed)
                      .map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{line.description}</TableCell>
                          <TableCell>
                            {line.quantity}
                            {line.unit ? ` ${line.unit}` : ''}
                          </TableCell>
                          <TableCell>{line.unit_price || '—'}</TableCell>
                          <TableCell>
                            {costCenterLabel(
                              line.cost_center_type === 'none' ? null : line.cost_center_type,
                              line.cost_center_id === 'none' ? null : Number(line.cost_center_id)
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setExistingLines((prev) =>
                                  prev.map((l) => (l.id === line.id ? { ...l, removed: true } : l))
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {pendingNewLines.map((line) => (
                      <TableRow key={line.key} className="bg-brand-primary/5">
                        <TableCell className="font-medium">{line.description}</TableCell>
                        <TableCell>
                          {line.quantity}
                          {line.unit ? ` ${line.unit}` : ''}
                        </TableCell>
                        <TableCell>{line.unit_price}</TableCell>
                        <TableCell>{costCenterLabel(line.cost_center_type, line.cost_center_id)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPendingNewLines((prev) => prev.filter((l) => l.key !== line.key))
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!hasChanges || isSaving}
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleSave}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditExpenseOrderItemsDialog;
