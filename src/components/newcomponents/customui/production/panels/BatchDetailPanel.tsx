import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { cn } from '@/lib/utils';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import {
  useGetProductionBatchByIdQuery,
  useGetBatchItemsQuery,
  useAddBatchItemMutation,
  useUpdateBatchItemMutation,
  useRemoveBatchItemMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
} from '@/features/production/productionApi';
import type {
  ProductionLine,
  ProductionFormula,
  ProductionBatch,
  ProductionBatchItem,
  ItemRole,
} from '@/types/production';
import {
  Loader2,
  Trash2,
  Pencil,
  Play,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ITEM_ROLES,
  BATCH_ROLE_BADGE,
  BATCH_ROLE_SECTION_TITLE,
  BATCH_ROLE_BADGE_LABEL,
  formatOptionalPercent,
} from '../productionPageUtils';
interface BatchDetailPanelProps {
  batchId: number;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  items: { id: number; name: string }[];
  getItemName: (id: number) => string;
  getStatusBadge: (s: string) => string;
  onClose: () => void;
  onRequestStart: () => void;
  onComplete: (batch: ProductionBatch) => void;
  onCancel: (batch: ProductionBatch) => void;
  onDeleted: () => void;
  updateProductionBatch: ReturnType<typeof useUpdateProductionBatchMutation>[0];
  isUpdatingBatch: boolean;
  deleteProductionBatch: ReturnType<typeof useDeleteProductionBatchMutation>[0];
  isDeletingBatch: boolean;
}

const BatchDetailPanel: React.FC<BatchDetailPanelProps> = ({
  batchId,
  lines,
  formulas,
  items,
  getItemName,
  getStatusBadge,
  onClose,
  onRequestStart,
  onComplete,
  onCancel,
  onDeleted,
  updateProductionBatch,
  isUpdatingBatch,
  deleteProductionBatch,
  isDeletingBatch,
}) => {
  const {
    data: batch,
    isLoading: loadingBatch,
    error: batchError,
  } = useGetProductionBatchByIdQuery(batchId);
  const {
    data: batchItems = [],
    isLoading: loadingItems,
  } = useGetBatchItemsQuery({ batchId }, { skip: !batchId });
  const [addBatchItem, { isLoading: isAddingItem }] = useAddBatchItemMutation();
  const [updateBatchItem] = useUpdateBatchItemMutation();
  const [removeBatchItem] = useRemoveBatchItemMutation();

  const byRole = useMemo(() => {
    const map: Record<ItemRole, ProductionBatchItem[]> = {
      input: [],
      output: [],
      waste: [],
      byproduct: [],
    };
    for (const row of batchItems) {
      map[row.item_role as ItemRole].push(row);
    }
    return map;
  }, [batchItems]);

  const [addItemId, setAddItemId] = useState('');
  const [addRole, setAddRole] = useState<ItemRole>('input');
  const [addExpected, setAddExpected] = useState('');
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editBatchDate, setEditBatchDate] = useState('');
  const [editShift, setEditShift] = useState('');
  const [editExpectedOutput, setEditExpectedOutput] = useState('');
  const [editExpectedDuration, setEditExpectedDuration] = useState('');
  const [editActualOutput, setEditActualOutput] = useState('');
  const [editActualDuration, setEditActualDuration] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [collapsedRoles, setCollapsedRoles] = useState<Record<ItemRole, boolean>>({
    input: false,
    output: false,
    waste: true,
    byproduct: true,
  });

  const line = batch ? lines.find((l) => l.id === batch.production_line_id) : undefined;
  const formula = batch?.formula_id ? formulas.find((f) => f.id === batch.formula_id) : null;

  useEffect(() => {
    setAddItemId('');
    setAddRole('input');
    setAddExpected('');
    setIsInlineEditing(false);
  }, [batchId]);

  useEffect(() => {
    if (!batch) return;
    setEditBatchDate(batch.batch_date.split('T')[0] ?? '');
    setEditShift(batch.shift ?? '');
    setEditExpectedOutput(batch.expected_output_quantity != null ? String(batch.expected_output_quantity) : '');
    setEditExpectedDuration(batch.expected_duration_minutes != null ? String(batch.expected_duration_minutes) : '');
    setEditActualOutput(batch.actual_output_quantity != null ? String(batch.actual_output_quantity) : '');
    setEditActualDuration(batch.actual_duration_minutes != null ? String(batch.actual_duration_minutes) : '');
    setEditNotes(batch.notes ?? '');
  }, [batch?.id, batch?.updated_at]);

  useEffect(() => {
    setCollapsedRoles((prev) => {
      const next = {} as Record<ItemRole, boolean>;
      for (const role of ITEM_ROLES) {
        const hasRows = byRole[role].length > 0;
        // Default behavior: roles with rows are expanded; empty roles are collapsed.
        next[role] = !hasRows;
      }
      const unchanged = ITEM_ROLES.every((role) => prev[role] === next[role]);
      return unchanged ? prev : next;
    });
  }, [byRole]);

  const canMutateItems = batch && (batch.status === 'draft' || batch.status === 'in_progress');
  const canEditActuals = batch?.status === 'in_progress';
  const canEditBatch = batch?.status === 'draft' || batch?.status === 'in_progress';

  const handleSaveBatchDetails = async () => {
    if (!batch || !canEditBatch) return;
    try {
      const currentExpectedOutput =
        batch.expected_output_quantity ??
        byRole.output.reduce((sum, row) => sum + (row.expected_quantity ?? 0), 0);
      const nextExpectedOutput = editExpectedOutput.trim()
        ? parseInt(editExpectedOutput, 10)
        : batch.expected_output_quantity ?? undefined;

      const base = {
        batch_date: editBatchDate,
        shift: editShift.trim() || undefined,
        notes: editNotes.trim() || undefined,
      };
      if (batch.status === 'draft') {
        await updateProductionBatch({
          id: batch.id,
          data: {
            ...base,
            expected_output_quantity: nextExpectedOutput,
            expected_duration_minutes: editExpectedDuration.trim() ? parseInt(editExpectedDuration, 10) : undefined,
          },
        }).unwrap();

        if (
          nextExpectedOutput &&
          currentExpectedOutput > 0 &&
          nextExpectedOutput !== currentExpectedOutput
        ) {
          const multiplier = nextExpectedOutput / currentExpectedOutput;
          const scaleOps = byRole.input
            .filter((row) => row.expected_quantity != null)
            .map((row) => {
              const scaledExpected = Math.max(1, Math.round((row.expected_quantity ?? 0) * multiplier));
              if (scaledExpected === row.expected_quantity) return null;
              return updateBatchItem({
                id: row.id,
                data: { expected_quantity: scaledExpected },
              }).unwrap();
            })
            .filter(Boolean) as Array<Promise<unknown>>;

          if (scaleOps.length > 0) {
            await Promise.all(scaleOps);
            toast.success('Batch updated and input lines scaled');
          } else {
            toast.success('Batch updated');
          }
          setIsInlineEditing(false);
          return;
        }
      } else {
        await updateProductionBatch({
          id: batch.id,
          data: {
            ...base,
            actual_output_quantity: editActualOutput.trim() ? parseInt(editActualOutput, 10) : undefined,
            actual_duration_minutes: editActualDuration.trim() ? parseInt(editActualDuration, 10) : undefined,
          },
        }).unwrap();
      }
      toast.success('Batch updated');
      setIsInlineEditing(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to update');
    }
  };

  const handleAddLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch) return;
    const itemId = parseInt(addItemId, 10);
    const exp = addExpected.trim() ? parseInt(addExpected, 10) : undefined;
    if (!itemId) {
      toast.error('Select an item');
      return;
    }
    try {
      await addBatchItem({
        batchId: batch.id,
        data: {
          batch_id: batch.id,
          item_id: itemId,
          item_role: addRole,
          expected_quantity: exp,
        },
      }).unwrap();
      toast.success('Line added');
      setAddItemId('');
      setAddExpected('');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to add line');
    }
  };

  const handleSaveActual = async (row: ProductionBatchItem, raw: string) => {
    const n = raw.trim() === '' ? undefined : parseInt(raw, 10);
    if (raw.trim() !== '' && (n === undefined || Number.isNaN(n) || n < 0)) {
      toast.error('Invalid quantity');
      return;
    }
    try {
      await updateBatchItem({
        id: row.id,
        data: { actual_quantity: n },
      }).unwrap();
      toast.success('Saved');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to save');
    }
  };

  const handleSaveExpected = async (row: ProductionBatchItem, raw: string) => {
    if (!canMutateItems) return;
    const n = raw.trim() === '' ? undefined : parseInt(raw, 10);
    if (raw.trim() !== '' && (n === undefined || Number.isNaN(n) || n < 1)) {
      toast.error('Expected quantity must be a positive integer');
      return;
    }
    try {
      await updateBatchItem({
        id: row.id,
        data: { expected_quantity: n },
      }).unwrap();
      toast.success('Expected quantity saved');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to save');
    }
  };

  const handleDeleteDraft = async () => {
    if (!batch || batch.status !== 'draft') return;
    if (!window.confirm(`Remove draft batch ${batch.batch_number}?`)) return;
    try {
      await deleteProductionBatch(batch.id).unwrap();
      toast.success('Draft removed');
      onDeleted();
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to delete');
    }
  };

  if (loadingBatch) {
    return (
      <Card className="border-border">
        <CardContent className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  if (batchError || !batch) {
    return (
      <Card className="border-border border-destructive/40">
        <CardContent className="py-8 text-center text-sm text-destructive">
          Could not load batch.
          <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  const efficiencyDisplay = formatOptionalPercent(batch.efficiency_percentage);

  const linesBlock = (
    <div className="flex min-h-0 flex-col">
      {loadingItems ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
        </div>
      ) : batchItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {batch.status === 'draft' && batch.formula_id
            ? 'No lines yet â€” they appear after Start. Add items below when allowed, or wait for the formula.'
            : batch.status === 'draft'
              ? 'No lines yet. Add items below, or attach a formula and start.'
              : 'No line items returned.'}
        </p>
      ) : (
        <div className="space-y-4 pb-2 pl-0.5 pr-1 pt-0.5">
          {ITEM_ROLES.map((role) => {
            const rows = byRole[role];
            const isCollapsed = collapsedRoles[role] ?? rows.length === 0;
            return (
              <div key={role} className="rounded-lg border border-border/80 bg-card shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-3 py-2.5 text-left"
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
                        BATCH_ROLE_BADGE[role]
                      )}
                    >
                      {BATCH_ROLE_BADGE_LABEL[role]}
                    </Badge>
                    <span className="truncate text-sm font-medium text-foreground">
                      {BATCH_ROLE_SECTION_TITLE[role]}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {rows.length} {rows.length === 1 ? 'line' : 'lines'}
                  </span>
                </button>

                {!isCollapsed && (
                  <>
                    {rows.length === 0 ? (
                      <p className="px-3 py-4 text-center text-sm italic text-muted-foreground">No lines</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border/60 hover:bg-transparent">
                            <TableHead className="text-xs font-medium">Item</TableHead>
                            <TableHead className="w-[88px] text-right text-xs font-medium">Expected</TableHead>
                            <TableHead className="w-[100px] text-right text-xs font-medium">Actual</TableHead>
                            <TableHead className="w-[48px] p-0 text-right text-xs font-medium"> </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="![&_tr:last-child]:border-b [&_tr:last-child]:border-border/60">
                          {rows.map((row) => (
                            <BatchLineTableRow
                              key={row.id}
                              row={row}
                              name={getItemName(row.item_id)}
                              canRemove={!!canMutateItems}
                              canEditExpected={!!canMutateItems && row.item_role === 'input'}
                              canEditActual={!!canEditActuals}
                              onRemove={async () => {
                                if (!window.confirm(`Remove line for ${getItemName(row.item_id)}?`)) return;
                                try {
                                  await removeBatchItem(row.id).unwrap();
                                  toast.success('Removed');
                                } catch (e: unknown) {
                                  const err = e as { data?: { detail?: string } };
                                  toast.error(err?.data?.detail || 'Failed');
                                }
                              }}
                              onSaveExpected={(raw) => handleSaveExpected(row, raw)}
                              onSaveActual={(raw) => handleSaveActual(row, raw)}
                            />
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

  const addItemForm = (
    <form onSubmit={handleAddLine} className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Add item</p>
        <p className="text-xs text-muted-foreground">Appends a line to this batch. Saves immediately.</p>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="batch-add-item">Item</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddItemDialogOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create item
          </Button>
        </div>
        <Select value={addItemId} onValueChange={setAddItemId}>
          <SelectTrigger id="batch-add-item" className="w-full">
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
        <Label htmlFor="batch-add-role">Role</Label>
        <Select value={addRole} onValueChange={(v) => setAddRole(v as ItemRole)}>
          <SelectTrigger id="batch-add-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEM_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r === 'output' ? 'products' : r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="batch-add-exp">Expected qty (optional)</Label>
        <Input
          id="batch-add-exp"
          type="number"
          min={0}
          placeholder="â€”"
          value={addExpected}
          onChange={(e) => setAddExpected(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={isAddingItem}
        className="w-full bg-brand-primary hover:bg-brand-primary-hover sm:w-auto sm:self-start"
      >
        {isAddingItem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add item
      </Button>
      <AddItemDialog
        open={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        onSuccess={(item) => {
          setAddItemId(item.id.toString());
          toast.success('Item created and selected');
        }}
      />
    </form>
  );

  const renderSummaryDataBlock = (isEditing: boolean) => (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Production line</Label>
              <p className="text-sm font-medium">{line?.name ?? `Line #${batch.production_line_id}`}</p>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Formula</Label>
              <p className="text-sm font-medium">{formula?.name ?? 'Simple mode'}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="batch-edit-date">Batch date</Label>
              <Input id="batch-edit-date" type="date" value={editBatchDate} onChange={(e) => setEditBatchDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="batch-edit-shift">Shift</Label>
              <Input id="batch-edit-shift" value={editShift} onChange={(e) => setEditShift(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          {batch.status === 'draft' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="batch-edit-exp-out">Expected product qty</Label>
                <Input id="batch-edit-exp-out" type="number" min={0} value={editExpectedOutput} onChange={(e) => setEditExpectedOutput(e.target.value)} placeholder="Optional" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="batch-edit-exp-dur">Expected duration (minutes)</Label>
                <Input id="batch-edit-exp-dur" type="number" min={0} value={editExpectedDuration} onChange={(e) => setEditExpectedDuration(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}
          {batch.status === 'in_progress' && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="batch-edit-act-out">Actual product qty</Label>
                <Input id="batch-edit-act-out" type="number" min={0} value={editActualOutput} onChange={(e) => setEditActualOutput(e.target.value)} placeholder="Optional" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="batch-edit-act-dur">Actual duration (minutes)</Label>
                <Input id="batch-edit-act-dur" type="number" min={0} value={editActualDuration} onChange={(e) => setEditActualDuration(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="batch-edit-notes">Notes</Label>
            <Textarea id="batch-edit-notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Optional" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" className="bg-brand-primary hover:bg-brand-primary-hover" onClick={handleSaveBatchDetails} disabled={isUpdatingBatch}>
              {isUpdatingBatch && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setIsInlineEditing(false)}>
              Cancel edit
            </Button>
          </div>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Production line</dt>
              <dd className="mt-0.5 font-medium">{line?.name ?? `Line #${batch.production_line_id}`}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Formula</dt>
              <dd className="mt-0.5 font-medium">{formula?.name ?? 'Simple mode'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Batch date</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {new Date(batch.batch_date).toLocaleDateString()}
              </dd>
            </div>
            {batch.expected_output_quantity != null && (
              <div>
                <dt className="text-xs text-muted-foreground">Expected products</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{batch.expected_output_quantity}</dd>
              </div>
            )}
            {batch.actual_output_quantity != null && (
              <div>
                <dt className="text-xs text-muted-foreground">Actual products</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{batch.actual_output_quantity}</dd>
              </div>
            )}
            {efficiencyDisplay != null && (
              <div>
                <dt className="text-xs text-muted-foreground">Efficiency</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{efficiencyDisplay}</dd>
              </div>
            )}
          </dl>
          {batch.notes?.trim() && (
            <div className="mt-4 border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed">{batch.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const summaryDataBlock = renderSummaryDataBlock(isInlineEditing);

  const workflowActionsBlock = (
    <div className="flex flex-wrap gap-2">
      {batch.status === 'draft' && (
        <>
          <Button
            size="sm"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={onRequestStart}
          >
            <Play className="mr-1 h-4 w-4" />
            Startâ€¦
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsInlineEditing((prev) => !prev)}>
            <Pencil className="mr-1 h-4 w-4" />
            {isInlineEditing ? 'Cancel edit' : 'Edit batch'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteDraft}
            disabled={isDeletingBatch}
          >
            {isDeletingBatch ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-4 w-4" />
            )}
            Delete draft
          </Button>
        </>
      )}
        {batch.status === 'in_progress' && (
          <>
          <Button size="sm" variant="outline" onClick={() => setIsInlineEditing((prev) => !prev)}>
            <Pencil className="mr-1 h-4 w-4" />
            {isInlineEditing ? 'Cancel edit' : 'Edit batch'}
          </Button>
            <Button
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={() => onComplete(batch)}
            >
              <Check className="mr-1 h-4 w-4" />
              Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => onCancel(batch)}
            >
              <X className="mr-1 h-4 w-4" />
              Cancel run
            </Button>
          </>
        )}
      {batch.status === 'completed' && (
        <span className="text-xs text-muted-foreground">Products and waste auto-posted on completion.</span>
      )}
    </div>
  );

  const summaryBlock = (
    <div className="space-y-4">
      {summaryDataBlock}
      {workflowActionsBlock}
    </div>
  );

  const leftDetailsAndLinesBlock = (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-y-auto overscroll-contain py-1 pl-1 pr-2 md:pr-5">
      {summaryBlock}
      <Separator />
      {linesBlock}
    </div>
  );

  const rightAddBlock = (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto overscroll-contain py-1 pl-0.5 pr-1 md:pl-2 md:pr-2">
      {canMutateItems ? (
        <div className="rounded-lg border border-border/80 bg-card p-3 md:p-4">{addItemForm}</div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Add item is available while batch is <span className="font-medium">draft</span> or <span className="font-medium">in progress</span>.
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="border-border shadow-sm min-h-[420px]">
        <CardContent className="flex h-full min-h-0 flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-base font-semibold tracking-tight text-foreground">{batch.batch_number}</p>
              <span
                className={cn(
                  'inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize',
                  getStatusBadge(batch.status)
                )}
              >
                {batch.status.replace('_', ' ')}
              </span>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={onClose} aria-label="Clear selection">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-6 md:grid-cols-[minmax(460px,68%)_minmax(260px,32%)] md:gap-8">
            <div className="min-h-0 min-w-0 border-border md:border-r md:overflow-hidden">{leftDetailsAndLinesBlock}</div>
            <div className="min-h-0 min-w-0 md:min-h-[min(60vh,520px)] md:overflow-hidden">{rightAddBlock}</div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

interface BatchLineTableRowProps {
  row: ProductionBatchItem;
  name: string;
  canRemove: boolean;
  canEditExpected: boolean;
  canEditActual: boolean;
  onRemove: () => void;
  onSaveExpected: (raw: string) => void;
  onSaveActual: (raw: string) => void;
}

const BatchLineTableRow: React.FC<BatchLineTableRowProps> = ({
  row,
  name,
  canRemove,
  canEditExpected,
  canEditActual,
  onRemove,
  onSaveExpected,
  onSaveActual,
}) => {
  const [localExpected, setLocalExpected] = useState(row.expected_quantity?.toString() ?? '');
  const [localActual, setLocalActual] = useState(row.actual_quantity?.toString() ?? '');
  const [editingExpected, setEditingExpected] = useState(false);
  const [editingActual, setEditingActual] = useState(false);

  useEffect(() => {
    setLocalExpected(row.expected_quantity?.toString() ?? '');
    setLocalActual(row.actual_quantity?.toString() ?? '');
  }, [row.id, row.expected_quantity, row.actual_quantity]);

  return (
    <TableRow className="border-border/60">
      <TableCell className="py-2.5 align-middle font-medium">{name}</TableCell>
      <TableCell className="py-2.5 align-middle text-right text-sm tabular-nums text-muted-foreground">
        {canEditExpected && editingExpected ? (
          <>
            <Label htmlFor={`expected-${row.id}`} className="sr-only">
              Expected for {name}
            </Label>
            <Input
              id={`expected-${row.id}`}
              autoFocus
              className="ml-auto h-8 w-[5.5rem]"
              type="text"
              inputMode="numeric"
              value={localExpected}
              onChange={(e) => setLocalExpected(e.target.value)}
              onBlur={() => {
                if (localExpected !== (row.expected_quantity?.toString() ?? '')) {
                  onSaveExpected(localExpected);
                }
                setEditingExpected(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setLocalExpected(row.expected_quantity?.toString() ?? '');
                  setEditingExpected(false);
                }
              }}
              placeholder="â€”"
            />
          </>
        ) : (
          <button
            type="button"
            className={cn(
              'ml-auto inline-flex min-h-8 min-w-[5.5rem] items-center justify-end rounded px-1 text-right text-sm tabular-nums',
              canEditExpected && 'cursor-text hover:bg-muted/40'
            )}
            onDoubleClick={() => {
              if (canEditExpected) setEditingExpected(true);
            }}
            title={canEditExpected ? 'Double-click to edit expected qty' : undefined}
          >
            {row.expected_quantity ?? 'â€”'}
          </button>
        )}
      </TableCell>
      <TableCell className="py-2.5 align-middle text-right">
        {canEditActual && editingActual ? (
          <>
            <Label htmlFor={`actual-${row.id}`} className="sr-only">
              Actual for {name}
            </Label>
            <Input
              id={`actual-${row.id}`}
              autoFocus
              className="ml-auto h-8 w-[5.5rem]"
              type="text"
              inputMode="numeric"
              value={localActual}
              onChange={(e) => setLocalActual(e.target.value)}
              onBlur={() => {
                if (localActual !== (row.actual_quantity?.toString() ?? '')) {
                  onSaveActual(localActual);
                }
                setEditingActual(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                } else if (e.key === 'Escape') {
                  setLocalActual(row.actual_quantity?.toString() ?? '');
                  setEditingActual(false);
                }
              }}
              placeholder="â€”"
            />
          </>
        ) : (
          <button
            type="button"
            className={cn(
              'ml-auto inline-flex min-h-8 min-w-[5.5rem] items-center justify-end rounded px-1 text-right text-sm tabular-nums text-muted-foreground',
              canEditActual && 'cursor-text hover:bg-muted/40'
            )}
            onDoubleClick={() => {
              if (canEditActual) setEditingActual(true);
            }}
            title={canEditActual ? 'Double-click to edit actual qty' : undefined}
          >
            {row.actual_quantity ?? 'â€”'}
          </button>
        )}
      </TableCell>
      <TableCell className="p-1 align-middle text-right">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default BatchDetailPanel;

