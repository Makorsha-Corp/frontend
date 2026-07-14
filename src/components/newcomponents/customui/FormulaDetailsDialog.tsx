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
  useGetFormulaStagesQuery,
  useAddFormulaStageMutation,
  useUpdateFormulaStageMutation,
  useRemoveFormulaStageMutation,
} from '@/features/production/productionApi';
import type {
  ProductionFormula,
  ProductionFormulaItem,
  ProductionFormulaStage,
  ProductionLine,
  ItemRole,
} from '@/types/production';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Loader2, Trash2, ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

const ITEM_ROLES: ItemRole[] = ['input', 'output', 'waste', 'byproduct'];

const FORMULA_ROLE_BADGE: Record<ItemRole, string> = {
  input: 'border-transparent bg-blue-500/15 text-blue-800 dark:text-blue-200',
  output: 'border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  waste: 'border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-100',
  byproduct: 'border-transparent bg-violet-500/15 text-violet-800 dark:text-violet-200',
};

const FORMULA_ROLE_SECTION_TITLE: Record<ItemRole, string> = {
  input: 'Inputs',
  output: 'Products',
  waste: 'Waste',
  byproduct: 'Byproducts',
};

const FORMULA_ROLE_BADGE_LABEL: Record<ItemRole, string> = {
  input: 'input',
  output: 'product',
  waste: 'waste',
  byproduct: 'byproduct',
};

export interface FormulaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: ProductionFormula;
  lines: ProductionLine[];
  items: { id: number; name: string; unit?: string }[];
  getItemName: (id: number) => string;
  onEditRequest?: () => void;
}

type FormulaDialogTab = 'bom' | 'stages';

const FormulaDetailsDialog: React.FC<FormulaDetailsDialogProps> = ({
  open,
  onOpenChange,
  formula,
  lines,
  items,
  getItemName,
  onEditRequest,
}) => {
  const formulaId = formula.id;
  const [activeTab, setActiveTab] = useState<FormulaDialogTab>('bom');
  const { data: formulaItems = [], isLoading } = useGetFormulaItemsQuery(
    { formulaId },
    { skip: !open }
  );
  const { data: formulaStagesRaw = [], isLoading: loadingStages } = useGetFormulaStagesQuery(formulaId, {
    skip: !open,
  });
  const formulaStages = useMemo(
    () => [...formulaStagesRaw].sort((a, b) => a.stage_order - b.stage_order),
    [formulaStagesRaw]
  );
  const [addFormulaItem, { isLoading: isAdding }] = useAddFormulaItemMutation();
  const [removeFormulaItem] = useRemoveFormulaItemMutation();
  const [addFormulaStage, { isLoading: isAddingStage }] = useAddFormulaStageMutation();
  const [updateFormulaStage] = useUpdateFormulaStageMutation();
  const [removeFormulaStage] = useRemoveFormulaStageMutation();
  const [addItemId, setAddItemId] = useState('');
  const [addRole, setAddRole] = useState<ItemRole>('input');
  const [addQty, setAddQty] = useState('1');
  const [stageName, setStageName] = useState('');
  const [stageLineId, setStageLineId] = useState('');
  const [stageDuration, setStageDuration] = useState('');
  const [stageOutputQty, setStageOutputQty] = useState('');
  const [stageOutputItemId, setStageOutputItemId] = useState('');
  const [collapsedRoles, setCollapsedRoles] = useState<Record<ItemRole, boolean>>({
    input: false,
    output: false,
    waste: true,
    byproduct: true,
  });

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id.toString() === addItemId);
  }, [items, addItemId]);

  useEffect(() => {
    if (open) {
      setAddItemId('');
      setAddRole('input');
      setAddQty('1');
      setStageName('');
      setStageLineId('');
      setStageDuration('');
      setStageOutputQty('');
      setStageOutputItemId('');
      setActiveTab('bom');
    }
  }, [open, formulaId]);

  const getLineName = (lineId: number | null) => {
    if (!lineId) return '—';
    return lines.find((l) => l.id === lineId)?.name ?? `Line #${lineId}`;
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = stageName.trim();
    if (!name) {
      toast.error('Stage name is required');
      return;
    }
    const nextOrder = formulaStages.length > 0 ? Math.max(...formulaStages.map((s) => s.stage_order)) + 1 : 1;
    try {
      await addFormulaStage({
        formulaId,
        data: {
          formula_id: formulaId,
          stage_order: nextOrder,
          name,
          production_line_id: stageLineId ? parseInt(stageLineId, 10) : undefined,
          expected_duration_minutes: stageDuration.trim() ? parseInt(stageDuration, 10) : undefined,
          expected_output_quantity: stageOutputQty.trim() ? parseInt(stageOutputQty, 10) : undefined,
          expected_output_item_id: stageOutputItemId ? parseInt(stageOutputItemId, 10) : undefined,
        },
      }).unwrap();
      toast.success('Stage added');
      setStageName('');
      setStageLineId('');
      setStageDuration('');
      setStageOutputQty('');
      setStageOutputItemId('');
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to add stage');
    }
  };

  const handleRemoveStage = async (stage: ProductionFormulaStage) => {
    if (!window.confirm(`Remove stage "${stage.name}"?`)) return;
    try {
      await removeFormulaStage({ id: stage.id, formulaId }).unwrap();
      toast.success('Stage removed');
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to remove stage');
    }
  };

  const handleMoveStage = async (stage: ProductionFormulaStage, direction: 'up' | 'down') => {
    const idx = formulaStages.findIndex((s) => s.id === stage.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= formulaStages.length) return;
    const other = formulaStages[swapIdx];
    try {
      await Promise.all([
        updateFormulaStage({
          id: stage.id,
          formulaId,
          data: { stage_order: other.stage_order },
        }).unwrap(),
        updateFormulaStage({
          id: other.id,
          formulaId,
          data: { stage_order: stage.stage_order },
        }).unwrap(),
      ]);
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to reorder');
    }
  };

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

  useEffect(() => {
    setCollapsedRoles(() => {
      const next = {} as Record<ItemRole, boolean>;
      for (const role of ITEM_ROLES) {
        const hasRows = byRole[role].length > 0;
        next[role] = !hasRows;
      }
      return next;
    });
  }, [byRole]);

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
            const isCollapsed = collapsedRoles[role] ?? rows.length === 0;
            return (
              <div key={role} className="rounded-lg border border-border/80 bg-card shadow-sm">
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-3 py-2.5 text-left'
                  )}
                  onClick={() =>
                    setCollapsedRoles((prev) => ({
                      ...prev,
                      [role]: !isCollapsed,
                    }))
                  }
                  aria-expanded={!isCollapsed}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <Badge
                      variant="secondary"
                      className={cn(
                        'shrink-0 text-[10px] font-semibold uppercase tracking-wide',
                        FORMULA_ROLE_BADGE[role]
                      )}
                    >
                      {FORMULA_ROLE_BADGE_LABEL[role]}
                    </Badge>
                    <span className="truncate text-sm font-medium text-foreground">
                      {FORMULA_ROLE_SECTION_TITLE[role]}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {rows.length} {rows.length === 1 ? 'line' : 'lines'}
                  </span>
                </button>
                {!isCollapsed && (
                  <>
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
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const stagesListBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Production route</p>
        {!loadingStages && (
          <span className="text-xs tabular-nums text-muted-foreground">{formulaStages.length} stages</span>
        )}
      </div>
      <Separator className="mb-3 shrink-0" />
      {loadingStages ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
        </div>
      ) : formulaStages.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">
          No stages yet — define Blowroom → Carding → Ring on the right.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pb-6 pl-0.5 pr-1 pt-0.5">
          {formulaStages.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-start gap-2 rounded-lg border border-border/80 bg-card p-3 shadow-sm"
            >
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => handleMoveStage(stage, 'up')}
                  aria-label={`Move ${stage.name} up`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={idx === formulaStages.length - 1}
                  onClick={() => handleMoveStage(stage, 'down')}
                  aria-label={`Move ${stage.name} down`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="tabular-nums">
                    {stage.stage_order}
                  </Badge>
                  <span className="font-medium text-foreground">{stage.name}</span>
                </div>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Line</dt>
                    <dd className="font-medium">{getLineName(stage.production_line_id)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Expected duration</dt>
                    <dd className="font-medium tabular-nums">
                      {stage.expected_duration_minutes != null ? `${stage.expected_duration_minutes} min` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Expected output</dt>
                    <dd className="font-medium tabular-nums">
                      {stage.expected_output_quantity != null ? stage.expected_output_quantity : '—'}
                      {stage.expected_output_item_id != null && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {getItemName(stage.expected_output_item_id)}
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => handleRemoveStage(stage)}
                aria-label={`Remove ${stage.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const addStageBlock = (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-foreground">Add stage</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Ordered route template — copied as pending logs when a batch is created from this formula.
      </p>
      <form onSubmit={handleAddStage} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="formula-stage-name">Stage name</Label>
          <Input
            id="formula-stage-name"
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            placeholder="e.g. Blowroom"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="formula-stage-line">Production line (optional)</Label>
          <Select value={stageLineId || 'none'} onValueChange={(v) => setStageLineId(v === 'none' ? '' : v)}>
            <SelectTrigger id="formula-stage-line">
              <SelectValue placeholder="Any line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {lines.map((l) => (
                <SelectItem key={l.id} value={l.id.toString()}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="formula-stage-duration">Expected duration (min)</Label>
            <Input
              id="formula-stage-duration"
              type="number"
              min={0}
              value={stageDuration}
              onChange={(e) => setStageDuration(e.target.value)}
              placeholder="720"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="formula-stage-output-qty">Expected output qty</Label>
            <Input
              id="formula-stage-output-qty"
              type="number"
              min={0}
              value={stageOutputQty}
              onChange={(e) => setStageOutputQty(e.target.value)}
              placeholder="20"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="formula-stage-output-item">WIP output item (optional)</Label>
          <Select
            value={stageOutputItemId || 'none'}
            onValueChange={(v) => setStageOutputItemId(v === 'none' ? '' : v)}
          >
            <SelectTrigger id="formula-stage-output-item">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not tracked</SelectItem>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id.toString()}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={isAddingStage}
          className="w-full bg-brand-primary hover:bg-brand-primary-hover sm:w-auto sm:self-start"
        >
          {isAddingStage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add stage
        </Button>
      </form>
    </div>
  );

  const addItemBlock = (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border bg-card p-4 shadow-sm">
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
                  {i.name} {i.unit ? `(${i.unit})` : ''}
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
          <div className="flex items-center gap-2">
            <Input
              id="formula-add-qty"
              type="number"
              min={1}
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder="1"
              className="flex-1"
            />
            {selectedItem?.unit && (
              <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-md border border-input h-10 flex items-center justify-center min-w-[3.5rem] select-none shadow-sm">
                {selectedItem.unit}
              </span>
            )}
          </div>
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
          <DialogTitle className="text-foreground">{formula.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs tabular-nums">
            {metaParts.join(' · ')}
          </DialogDescription>
          {formula.description?.trim() && (
            <p className="text-sm text-muted-foreground">{formula.description.trim()}</p>
          )}
        </DialogHeader>

        <div className="flex shrink-0 gap-2 border-b border-border pb-3">
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'bom' ? 'default' : 'outline'}
            className={cn(activeTab === 'bom' && 'bg-brand-primary hover:bg-brand-primary-hover')}
            onClick={() => setActiveTab('bom')}
          >
            Bill of materials
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeTab === 'stages' ? 'default' : 'outline'}
            className={cn(activeTab === 'stages' && 'bg-brand-primary hover:bg-brand-primary-hover')}
            onClick={() => setActiveTab('stages')}
          >
            Production stages
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-col py-1 pl-1 pr-2 md:pr-3">
            {activeTab === 'bom' ? bomBlock : stagesListBlock}
          </div>
          <div className="flex min-h-0 min-w-0 flex-col border-t border-border py-2 pl-2 pr-4 pt-6 md:border-t-0 md:border-l md:border-border md:py-2 md:pl-10 md:pr-5 md:pt-2">
            {activeTab === 'bom' ? addItemBlock : addStageBlock}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          {onEditRequest && (
            <Button type="button" variant="outline" onClick={onEditRequest}>
              Edit formula
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaDetailsDialog;
