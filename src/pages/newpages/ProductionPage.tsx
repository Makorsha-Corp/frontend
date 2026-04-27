import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderLoweredSelectorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { ContributionHeatmap } from '@/components/newcomponents/customui/ContributionHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
import {
  useGetProductionLinesQuery,
  useCreateProductionLineMutation,
  useUpdateProductionLineMutation,
  useDeleteProductionLineMutation,
  useGetProductionFormulasQuery,
  useCreateProductionFormulaMutation,
  useUpdateProductionFormulaMutation,
  useDeleteProductionFormulaMutation,
  useGetFormulaItemsQuery,
  useGetProductionBatchesQuery,
  useGetProductionBatchByIdQuery,
  useCreateProductionBatchMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  useStartBatchMutation,
  useCompleteBatchMutation,
  useCancelBatchMutation,
  useGetBatchItemsQuery,
  useAddBatchItemMutation,
  useUpdateBatchItemMutation,
  useRemoveBatchItemMutation,
} from '@/features/production/productionApi';
import type {
  ProductionLine,
  ProductionFormula,
  ProductionBatch,
  ProductionBatchItem,
  ItemRole,
} from '@/types/production';
import {
  FlaskConical,
  Search,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Play,
  Check,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const BATCH_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'] as const;
const ITEM_ROLES: ItemRole[] = ['input', 'output', 'waste', 'byproduct'];
const BATCH_STATUS_FILTER_STORAGE_KEY = 'production.batches.statusFilter';

const BATCH_ROLE_BADGE: Record<ItemRole, string> = {
  input: 'border-transparent bg-blue-500/15 text-blue-800 dark:text-blue-200',
  output: 'border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  waste: 'border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-100',
  byproduct: 'border-transparent bg-violet-500/15 text-violet-800 dark:text-violet-200',
};

const BATCH_ROLE_SECTION_TITLE: Record<ItemRole, string> = {
  input: 'Inputs',
  output: 'Outputs',
  waste: 'Waste',
  byproduct: 'Byproducts',
};

/** Backend Numeric/Decimal fields often arrive as strings in JSON */
function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatOptionalPercent(value: unknown, digits = 1): string | null {
  const n = toFiniteNumber(value);
  if (n == null) return null;
  return `${n.toFixed(digits)}%`;
}


const ProductionPage: React.FC = () => {
  const { factory: globalFactory } = useAppSelector((state) => state.auth);
  const [factoryId, setFactoryId] = useState<number | null>(() => globalFactory?.id ?? null);
  const [lineId, setLineId] = useState<number | null>(null);
  const [batchStatusFilter, setBatchStatusFilter] = useState<Array<(typeof BATCH_STATUSES)[number]>>(() => {
    if (typeof window === 'undefined') return [...BATCH_STATUSES];
    try {
      const raw = window.localStorage.getItem(BATCH_STATUS_FILTER_STORAGE_KEY);
      if (!raw) return [...BATCH_STATUSES];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [...BATCH_STATUSES];
      const validStatuses = parsed.filter((v): v is (typeof BATCH_STATUSES)[number] =>
        BATCH_STATUSES.includes(v as (typeof BATCH_STATUSES)[number])
      );
      return validStatuses;
    } catch {
      return [...BATCH_STATUSES];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Dialog states
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [isAddFormulaOpen, setIsAddFormulaOpen] = useState(false);
  const [lineActionTarget, setLineActionTarget] = useState<ProductionLine | null>(null);
  const [formulaActionTarget, setFormulaActionTarget] = useState<ProductionFormula | null>(null);
  const [isLineEditMode, setIsLineEditMode] = useState(false);
  const [isFormulaEditMode, setIsFormulaEditMode] = useState(false);
  const [lineDraftName, setLineDraftName] = useState('');
  const [lineDraftDescription, setLineDraftDescription] = useState('');
  const [formulaDraftCode, setFormulaDraftCode] = useState('');
  const [formulaDraftName, setFormulaDraftName] = useState('');
  const [formulaDraftDescription, setFormulaDraftDescription] = useState('');
  const [formulaDraftDuration, setFormulaDraftDuration] = useState('');
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [completingBatch, setCompletingBatch] = useState<ProductionBatch | null>(null);
  const [cancellingBatch, setCancellingBatch] = useState<ProductionBatch | null>(null);
  const [startBatchId, setStartBatchId] = useState<number | null>(null);

  useEffect(() => {
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BATCH_STATUS_FILTER_STORAGE_KEY, JSON.stringify(batchStatusFilter));
  }, [batchStatusFilter]);

  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: false });

  const {
    data: lines = [],
    isLoading: loadingLines,
    error: linesError,
  } = useGetProductionLinesQuery(
    {
      skip: 0,
      limit: 100,
      factory_id: factoryId ?? undefined,
      active_only: false,
    },
    { skip: false }
  );

  const linesForFactory = useMemo(() => {
    if (!factoryId) return lines;
    return lines.filter((l) => l.factory_id === factoryId);
  }, [lines, factoryId]);

  const {
    data: formulas = [],
    isLoading: loadingFormulas,
    error: formulasError,
  } = useGetProductionFormulasQuery(
    { skip: 0, limit: 100, active_only: false },
    { skip: false }
  );

  const {
    data: batchesRaw = [],
    isLoading: loadingBatches,
    error: batchesError,
  } = useGetProductionBatchesQuery(
    {
      skip: 0,
      limit: 100,
      production_line_id: lineId ?? undefined,
      status: undefined,
    },
    { skip: false }
  );

  const batches = useMemo(() => {
    if (!factoryId || lineId) return batchesRaw;
    const lineIds = new Set(linesForFactory.map((l) => l.id));
    return batchesRaw.filter((b) => lineIds.has(b.production_line_id));
  }, [batchesRaw, factoryId, lineId, linesForFactory]);

  const [createLine, { isLoading: isCreatingLine }] = useCreateProductionLineMutation();
  const [updateLine, { isLoading: isUpdatingLine }] = useUpdateProductionLineMutation();
  const [deleteLine, { isLoading: isDeletingLine }] = useDeleteProductionLineMutation();
  const [createFormula, { isLoading: isCreatingFormula }] = useCreateProductionFormulaMutation();
  const [updateFormula, { isLoading: isUpdatingFormula }] = useUpdateProductionFormulaMutation();
  const [deleteFormula, { isLoading: isDeletingFormula }] = useDeleteProductionFormulaMutation();
  const [createBatch, { isLoading: isCreatingBatch }] = useCreateProductionBatchMutation();
  const [startBatch, { isLoading: isStartingBatch }] = useStartBatchMutation();
  const [completeBatch] = useCompleteBatchMutation();
  const [cancelBatch] = useCancelBatchMutation();
  const [updateProductionBatch, { isLoading: isUpdatingBatch }] = useUpdateProductionBatchMutation();
  const [deleteProductionBatch, { isLoading: isDeletingBatch }] = useDeleteProductionBatchMutation();

  const filteredLines = useMemo(() => {
    if (!searchQuery.trim()) return linesForFactory;
    const q = searchQuery.toLowerCase();
    return linesForFactory.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [linesForFactory, searchQuery]);

  const filteredFormulas = useMemo(() => {
    if (!searchQuery.trim()) return formulas;
    const q = searchQuery.toLowerCase();
    return formulas.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.formula_code.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [formulas, searchQuery]);

  const filteredBatches = useMemo(() => {
    const statusFiltered = batches.filter((b) =>
      batchStatusFilter.includes(b.status as (typeof BATCH_STATUSES)[number])
    );
    if (!searchQuery.trim()) return statusFiltered;
    const q = searchQuery.toLowerCase();
    return statusFiltered.filter(
      (b) =>
        b.batch_number.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
    );
  }, [batches, searchQuery, batchStatusFilter]);

  // Metrics for Overview
  const metrics = useMemo(() => {
    const completedWithEfficiency = batches.filter(
      (b) => b.status === 'completed' && toFiniteNumber(b.efficiency_percentage) != null
    );
    const avgEfficiency =
      completedWithEfficiency.length > 0
        ? completedWithEfficiency.reduce(
            (s, b) => s + (toFiniteNumber(b.efficiency_percentage) ?? 0),
            0
          ) / completedWithEfficiency.length
        : null;
    const aboveTargetCount = completedWithEfficiency.filter(
      (b) => (toFiniteNumber(b.efficiency_percentage) ?? 0) >= 100
    ).length;
    const belowTargetCount = completedWithEfficiency.filter(
      (b) => (toFiniteNumber(b.efficiency_percentage) ?? 0) < 100
    ).length;
    return {
      avgEfficiency,
      aboveTargetCount,
      belowTargetCount,
    };
  }, [batches]);

  const handleFactoryChange = (value: string) => {
    const id = value ? parseInt(value, 10) : null;
    setFactoryId(id);
    setLineId(null);
  };

  const handleLineChange = (value: string) => {
    const id = value ? parseInt(value, 10) : null;
    setLineId(id);
  };

  const toggleBatchStatusFilter = (status: (typeof BATCH_STATUSES)[number]) => {
    setBatchStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearBatchStatusFilter = () => setBatchStatusFilter([]);

  const selectAllBatchStatuses = () => setBatchStatusFilter([...BATCH_STATUSES]);

  const batchStatusFilterLabel =
    batchStatusFilter.length === 0
      ? 'No status'
      : batchStatusFilter.length === BATCH_STATUSES.length
        ? 'All statuses'
        : `${batchStatusFilter.length} selected`;

  const getItemName = (itemId: number) => items.find((i) => i.id === itemId)?.name ?? `Item #${itemId}`;

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return map[status] ?? 'bg-muted text-muted-foreground';
  };

  const handleDeactivateLine = async (line: ProductionLine) => {
    if (!window.confirm(`Deactivate "${line.name}"?`)) return;
    try {
      await deleteLine(line.id).unwrap();
      toast.success('Line deactivated');
      setLineActionTarget(null);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to deactivate');
    }
  };

  const handleDeactivateFormula = async (formula: ProductionFormula) => {
    if (!window.confirm(`Deactivate "${formula.name}"?`)) return;
    try {
      await deleteFormula(formula.id).unwrap();
      toast.success('Formula deactivated');
      setFormulaActionTarget(null);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to deactivate');
    }
  };

  const handleSaveLineFromPopup = async () => {
    if (!lineActionTarget) return;
    if (!lineDraftName.trim()) {
      toast.error('Line name is required');
      return;
    }
    try {
      await updateLine({
        id: lineActionTarget.id,
        data: {
          name: lineDraftName.trim(),
          description: lineDraftDescription.trim() || undefined,
        },
      }).unwrap();
      toast.success('Line updated');
      setIsLineEditMode(false);
      setLineActionTarget((prev) =>
        prev ? { ...prev, name: lineDraftName.trim(), description: lineDraftDescription.trim() || null } : prev
      );
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to update line');
    }
  };

  const handleSaveFormulaFromPopup = async () => {
    if (!formulaActionTarget) return;
    if (!formulaDraftName.trim()) {
      toast.error('Formula name is required');
      return;
    }
    if (!formulaDraftCode.trim()) {
      toast.error('Formula code is required');
      return;
    }
    const duplicate = formulas.find(
      (f) =>
        f.id !== formulaActionTarget.id &&
        (f.formula_code.toLowerCase() === formulaDraftCode.trim().toLowerCase() ||
          f.name.toLowerCase() === formulaDraftName.trim().toLowerCase())
    );
    if (duplicate) {
      toast.error('Formula code or name already exists');
      return;
    }
    try {
      await updateFormula({
        id: formulaActionTarget.id,
        data: {
          name: formulaDraftName.trim(),
          description: formulaDraftDescription.trim() || undefined,
          estimated_duration_minutes:
            formulaDraftDuration.trim() === '' ? undefined : parseInt(formulaDraftDuration, 10),
        },
      }).unwrap();
      toast.success('Formula updated');
      setIsFormulaEditMode(false);
      setFormulaActionTarget((prev) =>
        prev
          ? {
              ...prev,
              formula_code: formulaDraftCode.trim(),
              name: formulaDraftName.trim(),
              description: formulaDraftDescription.trim() || null,
              estimated_duration_minutes:
                formulaDraftDuration.trim() === '' ? null : parseInt(formulaDraftDuration, 10),
            }
          : prev
      );
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to update formula');
    }
  };

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <Toaster position="top-right" />
        <DashboardNavbar />
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No Factories Set Up</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            You need to create a factory before you can manage production lines, formulas, and batches.
          </p>
          <Button 
            size="lg" 
            className="bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all"
            onClick={() => setIsAddFactoryOpen(true)}
          >
            Create Your First Factory
          </Button>

          <AddFactoryDialog
            open={isAddFactoryOpen}
            onOpenChange={setIsAddFactoryOpen}
            factories={factories}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className={appShellHeaderLeftGroupClass}>
                <div className={appShellHeaderIconTileClass}>
                  <FlaskConical className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className={appShellHeaderTitleClass}>Production</h1>
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <Select value={factoryId?.toString() ?? 'all'} onValueChange={handleFactoryChange}>
                <SelectTrigger className={`w-[180px] ${appShellHeaderLoweredSelectorClass}`}>
                  <SelectValue placeholder="Factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All factories</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <>
                <Select value={lineId?.toString() ?? 'all'} onValueChange={handleLineChange}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Production line" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lines</SelectItem>
                    {linesForFactory.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-[170px] justify-start bg-background border-border">
                      {batchStatusFilterLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="start">
                    <div className="space-y-1">
                      <button
                        type="button"
                        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={selectAllBatchStatuses}
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={clearBatchStatusFilter}
                      >
                        Clear all
                      </button>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      {BATCH_STATUSES.map((s) => (
                        <label key={s} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted/50">
                          <Checkbox
                            checked={batchStatusFilter.includes(s)}
                            onCheckedChange={() => toggleBatchStatusFilter(s)}
                          />
                          <span className="text-sm capitalize">{s.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </>
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search production..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </AppShellHeader>

        <div className="p-6 space-y-6">
          {/* Top analytics: status + efficiency + activity */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <Card className="border-border xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Batches by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <BatchStatusPieChart batches={filteredBatches} />
              </CardContent>
            </Card>

            <Card className="border-border xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Avg Efficiency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Average</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {metrics.avgEfficiency != null ? `${metrics.avgEfficiency.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Above target
                    </p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{metrics.aboveTargetCount}</p>
                  </div>
                  <div className="rounded-md border border-amber-500/25 bg-amber-500/[0.08] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Below target
                    </p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{metrics.belowTargetCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Batch activity (last 12 months)</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Filtered by factory, line & status above
                </p>
              </CardHeader>
              <CardContent>
                <ContributionHeatmap items={filteredBatches.map((b) => ({ date: b.batch_date }))} itemLabel="batch" />
              </CardContent>
            </Card>
          </div>

          {/* Half-half: Production Lines | Formulas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Production Lines */}
              <Card className="border-border h-full">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    {filteredLines.length} production {filteredLines.length === 1 ? 'line' : 'lines'}
                  </span>
                  <Button
                    size="sm"
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={() => setIsAddLineOpen(true)}
                    disabled={!factoryId}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                <CardContent className="p-0">
                  {linesError ? (
                    <div className="py-8 px-4 text-center">
                      <p className="text-sm text-destructive font-medium">Failed to load production lines</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(linesError as { data?: { detail?: string } })?.data?.detail || 'Check console for details'}
                      </p>
                    </div>
                  ) : loadingLines ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                    </div>
                  ) : filteredLines.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      {!factoryId
                        ? 'Select a factory to view production lines'
                        : 'No production lines. Add one to get started.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 p-4">
                      {filteredLines.map((line) => (
                        <button
                          key={line.id}
                          type="button"
                          onClick={() => setLineActionTarget(line)}
                          className="flex min-h-[118px] w-full flex-col justify-start rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
                        >
                          <div>
                            <div className="font-medium text-card-foreground">{line.name}</div>
                            {line.description && (
                              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {line.description}
                              </div>
                            )}
                            {line.machine_id && (
                              <span className="mt-2 inline-block text-xs text-muted-foreground">
                                Machine #{line.machine_id}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

                {/* Formulas */}
                <div className="h-full">
              <Card className="border-border h-full">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    {filteredFormulas.length} formulas
                  </span>
                  <Button
                    size="sm"
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={() => setIsAddFormulaOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Formula
                  </Button>
                </div>
                <CardContent className="p-0">
                  {formulasError ? (
                    <div className="py-8 px-4 text-center">
                      <p className="text-sm text-destructive font-medium">Failed to load formulas</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formulasError as { data?: { detail?: string } })?.data?.detail || 'Check console for details'}
                      </p>
                    </div>
                  ) : loadingFormulas ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                    </div>
                  ) : filteredFormulas.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">
                      No formulas. Add one to define production recipes.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 p-4">
                      {filteredFormulas.map((formula) => (
                        <button
                          key={formula.id}
                          type="button"
                          className="flex min-h-[118px] w-full flex-col justify-start rounded-lg border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
                          onClick={() => setFormulaActionTarget(formula)}
                        >
                          <div>
                            <div className="font-medium text-card-foreground">
                              {formula.name} ({formula.formula_code})
                            </div>
                            {formula.description && (
                              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {formula.description}
                              </div>
                            )}
                            {formula.estimated_duration_minutes != null && (
                              <span className="mt-2 inline-block text-xs text-muted-foreground">
                                ~{formula.estimated_duration_minutes} min
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,380px)_1fr] gap-6 items-start">
                <Card className="border-border xl:sticky xl:top-24 self-start min-h-[360px]">
                  <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-medium">
                      {filteredBatches.length} batches
                    </span>
                    <Button
                      size="sm"
                      className="bg-brand-primary hover:bg-brand-primary-hover"
                      onClick={() => setIsAddBatchOpen(true)}
                      disabled={linesForFactory.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Batch
                    </Button>
                  </div>
                  <CardContent className="p-0 min-h-[300px] max-h-[min(56vh,500px)] overflow-y-auto">
                    {batchesError ? (
                      <div className="py-8 px-4 text-center">
                        <p className="text-sm text-destructive font-medium">Failed to load batches</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(batchesError as { data?: { detail?: string } })?.data?.detail || 'Check console for details'}
                        </p>
                      </div>
                    ) : loadingBatches ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                      </div>
                    ) : filteredBatches.length === 0 ? (
                      <div className="flex min-h-[240px] items-center justify-center px-4 text-center text-muted-foreground text-sm">
                        {linesForFactory.length === 0
                          ? 'Add production lines first'
                          : 'No batches. Create one to start production.'}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredBatches.map((batch) => (
                          <BatchRow
                            key={batch.id}
                            batch={batch}
                            lines={linesForFactory}
                            formulas={formulas}
                            getStatusBadge={getStatusBadge}
                            isSelected={selectedBatchId === batch.id}
                            onClick={() => setSelectedBatchId(selectedBatchId === batch.id ? null : batch.id)}
                            onStart={() => setStartBatchId(batch.id)}
                            onComplete={() => setCompletingBatch(batch)}
                            onCancel={() => setCancellingBatch(batch)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedBatchId ? (
                  <BatchDetailPanel
                    batchId={selectedBatchId}
                    lines={linesForFactory}
                    formulas={formulas}
                    items={items}
                    getItemName={getItemName}
                    getStatusBadge={getStatusBadge}
                    onClose={() => setSelectedBatchId(null)}
                    onRequestStart={() => setStartBatchId(selectedBatchId)}
                    onComplete={(b) => setCompletingBatch(b)}
                    onCancel={(b) => setCancellingBatch(b)}
                    onDeleted={() => {
                      setSelectedBatchId(null);
                      setStartBatchId(null);
                    }}
                    updateProductionBatch={updateProductionBatch}
                    isUpdatingBatch={isUpdatingBatch}
                    deleteProductionBatch={deleteProductionBatch}
                    isDeletingBatch={isDeletingBatch}
                  />
                ) : (
                  <Card className="border-dashed border-border bg-muted/20 min-h-[360px]">
                    <CardContent className="flex min-h-[300px] items-center justify-center py-16 text-center text-sm text-muted-foreground">
                      Select a batch, then use <span className="font-medium">Batch details</span> to open the full view
                      (summary on the left, lines on the right).
                    </CardContent>
                  </Card>
                )}

              </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!lineActionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setLineActionTarget(null);
            setIsLineEditMode(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{lineActionTarget?.name ?? 'Production line'}</DialogTitle>
            <DialogDescription>
              Manage this line from one place.
            </DialogDescription>
          </DialogHeader>
          {isLineEditMode ? (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={lineDraftName} onChange={(e) => setLineDraftName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea
                  value={lineDraftDescription}
                  onChange={(e) => setLineDraftDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lineActionTarget?.description ? (
                <p className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  {lineActionTarget.description}
                </p>
              ) : (
                <p className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  No description added.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!lineActionTarget) return;
                if (!isLineEditMode) {
                  setLineDraftName(lineActionTarget.name);
                  setLineDraftDescription(lineActionTarget.description ?? '');
                  setIsLineEditMode(true);
                } else {
                  setIsLineEditMode(false);
                }
              }}
            >
              {isLineEditMode ? 'Cancel edit' : 'Edit'}
            </Button>
            {isLineEditMode ? (
              <Button onClick={handleSaveLineFromPopup} disabled={isUpdatingLine}>
                {isUpdatingLine ? 'Saving...' : 'Save'}
              </Button>
            ) : null}
            <Button
              variant="destructive"
              onClick={() => lineActionTarget && handleDeactivateLine(lineActionTarget)}
              disabled={isDeletingLine}
            >
              {isDeletingLine ? 'Deactivating...' : 'Deactivate line'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!formulaActionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFormulaActionTarget(null);
            setIsFormulaEditMode(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {formulaActionTarget ? `${formulaActionTarget.name} (${formulaActionTarget.formula_code})` : 'Formula'}
            </DialogTitle>
            <DialogDescription>
              Manage this formula from one place.
            </DialogDescription>
          </DialogHeader>
          {isFormulaEditMode ? (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Formula code</Label>
                <Input value={formulaDraftCode} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={formulaDraftName} onChange={(e) => setFormulaDraftName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea
                  value={formulaDraftDescription}
                  onChange={(e) => setFormulaDraftDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Estimated duration (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formulaDraftDuration}
                  onChange={(e) => setFormulaDraftDuration(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {formulaActionTarget?.description ? (
                <p className="rounded-md border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  {formulaActionTarget.description}
                </p>
              ) : (
                <p className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                  No description added.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!formulaActionTarget) return;
                if (!isFormulaEditMode) {
                  setFormulaDraftCode(formulaActionTarget.formula_code);
                  setFormulaDraftName(formulaActionTarget.name);
                  setFormulaDraftDescription(formulaActionTarget.description ?? '');
                  setFormulaDraftDuration(
                    formulaActionTarget.estimated_duration_minutes?.toString() ?? ''
                  );
                  setIsFormulaEditMode(true);
                } else {
                  setIsFormulaEditMode(false);
                }
              }}
            >
              {isFormulaEditMode ? 'Cancel edit' : 'Edit'}
            </Button>
            {isFormulaEditMode ? (
              <Button onClick={handleSaveFormulaFromPopup} disabled={isUpdatingFormula}>
                {isUpdatingFormula ? 'Saving...' : 'Save'}
              </Button>
            ) : null}
            <Button
              variant="destructive"
              onClick={() => formulaActionTarget && handleDeactivateFormula(formulaActionTarget)}
              disabled={isDeletingFormula}
            >
              {isDeletingFormula ? 'Deactivating...' : 'Deactivate formula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Line Dialog */}
      <AddEditLineDialog
        open={isAddLineOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddLineOpen(false);
          }
        }}
        factories={factories}
        factoryId={factoryId}
        line={null}
        createLine={createLine}
        updateLine={updateLine}
        isCreating={isCreatingLine}
        isUpdating={isUpdatingLine}
        onSuccess={() => {
          setIsAddLineOpen(false);
        }}
      />

      {/* Add/Edit Formula Dialog */}
      <AddEditFormulaDialog
        open={isAddFormulaOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddFormulaOpen(false);
          }
        }}
        formula={null}
        formulas={formulas}
        createFormula={createFormula}
        updateFormula={updateFormula}
        isCreating={isCreatingFormula}
        isUpdating={isUpdatingFormula}
        onSuccess={() => {
          setIsAddFormulaOpen(false);
        }}
      />

      {/* Add Batch Dialog */}
      <AddBatchDialog
        open={isAddBatchOpen}
        onOpenChange={setIsAddBatchOpen}
        lines={linesForFactory}
        formulas={formulas}
        factoryId={factoryId}
        createBatch={createBatch}
        isCreating={isCreatingBatch}
        onSuccess={() => setIsAddBatchOpen(false)}
      />

      {/* Complete Batch Dialog */}
      {completingBatch && (
        <CompleteBatchDialog
          batch={completingBatch}
          onClose={() => setCompletingBatch(null)}
          completeBatch={completeBatch}
          onSuccess={() => setCompletingBatch(null)}
        />
      )}

      {/* Cancel Batch Dialog */}
      {cancellingBatch && (
        <CancelBatchDialog
          batch={cancellingBatch}
          onClose={() => setCancellingBatch(null)}
          cancelBatch={cancelBatch}
          onSuccess={() => setCancellingBatch(null)}
        />
      )}

      {startBatchId != null && (
        <StartBatchDialog
          batchId={startBatchId}
          lines={linesForFactory}
          getItemName={getItemName}
          startBatch={startBatch}
          isStarting={isStartingBatch}
          onClose={() => setStartBatchId(null)}
        />
      )}

    </div>
  );
};

// ─── Add/Edit Line Dialog ─────────────────────────────────────────────

interface AddEditLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factories: { id: number; name: string }[];
  factoryId: number | null;
  line: ProductionLine | null;
  createLine: ReturnType<typeof useCreateProductionLineMutation>[0];
  updateLine: ReturnType<typeof useUpdateProductionLineMutation>[0];
  isCreating: boolean;
  isUpdating: boolean;
  onSuccess: () => void;
}

const AddEditLineDialog: React.FC<AddEditLineDialogProps> = ({
  open,
  onOpenChange,
  factories,
  factoryId,
  line,
  createLine,
  updateLine,
  isCreating,
  isUpdating,
  onSuccess,
}) => {
  const [name, setName] = useState(line?.name ?? '');
  const [description, setDescription] = useState(line?.description ?? '');
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    (line?.factory_id ?? factoryId ?? factories[0]?.id)?.toString() ?? ''
  );

  React.useEffect(() => {
    if (open) {
      setName(line?.name ?? '');
      setDescription(line?.description ?? '');
      setSelectedFactoryId(
        (line?.factory_id ?? factoryId ?? factories[0]?.id)?.toString() ?? ''
      );
    }
  }, [open, line, factoryId, factories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const fid = parseInt(selectedFactoryId, 10);
    if (!fid) {
      toast.error('Factory is required');
      return;
    }
    try {
      if (line) {
        await updateLine({
          id: line.id,
          data: { name: name.trim(), description: description.trim() || undefined },
        }).unwrap();
        toast.success('Line updated');
      } else {
        await createLine({
          factory_id: fid,
          name: name.trim(),
          description: description.trim() || undefined,
        }).unwrap();
        toast.success('Line created');
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to save');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{line ? 'Edit Production Line' : 'Add Production Line'}</DialogTitle>
            <DialogDescription>
              {line ? 'Update the production line details.' : 'Create a new production line.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!line && (
              <div className="grid gap-2">
                <Label>Factory</Label>
                <Select value={selectedFactoryId} onValueChange={setSelectedFactoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select factory" />
                  </SelectTrigger>
                  <SelectContent>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Line A"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {line ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Add/Edit Formula Dialog ──────────────────────────────────────────

interface AddEditFormulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: ProductionFormula | null;
  formulas: ProductionFormula[];
  createFormula: ReturnType<typeof useCreateProductionFormulaMutation>[0];
  updateFormula: ReturnType<typeof useUpdateProductionFormulaMutation>[0];
  isCreating: boolean;
  isUpdating: boolean;
  onSuccess: () => void;
}

const AddEditFormulaDialog: React.FC<AddEditFormulaDialogProps> = ({
  open,
  onOpenChange,
  formula,
  formulas,
  createFormula,
  updateFormula,
  isCreating,
  isUpdating,
  onSuccess,
}) => {
  const [formulaCode, setFormulaCode] = useState(formula?.formula_code ?? '');
  const [name, setName] = useState(formula?.name ?? '');
  const [description, setDescription] = useState(formula?.description ?? '');
  const [estimatedDuration, setEstimatedDuration] = useState(
    formula?.estimated_duration_minutes?.toString() ?? ''
  );

  React.useEffect(() => {
    if (open) {
      setFormulaCode(formula?.formula_code ?? '');
      setName(formula?.name ?? '');
      setDescription(formula?.description ?? '');
      setEstimatedDuration(formula?.estimated_duration_minutes?.toString() ?? '');
    }
  }, [open, formula]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formulaCode.trim()) {
      toast.error('Formula code is required');
      return;
    }
    const dup = formulas.find(
      (f) =>
        f.id !== formula?.id &&
        (f.formula_code.toLowerCase() === formulaCode.trim().toLowerCase() ||
          f.name.toLowerCase() === name.trim().toLowerCase())
    );
    if (dup) {
      toast.error('A formula with this code or name already exists');
      return;
    }
    try {
      if (formula) {
        await updateFormula({
          id: formula.id,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
            estimated_duration_minutes: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
          },
        }).unwrap();
        toast.success('Formula updated');
      } else {
        await createFormula({
          formula_code: formulaCode.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          estimated_duration_minutes: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
        }).unwrap();
        toast.success('Formula created');
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to save');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{formula ? 'Edit Formula' : 'Add Formula'}</DialogTitle>
            <DialogDescription>
              {formula ? 'Update the formula details.' : 'Create a production recipe (BOM).'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Formula Code</Label>
              <Input
                value={formulaCode}
                onChange={(e) => setFormulaCode(e.target.value)}
                placeholder="e.g. YARN-001"
                disabled={!!formula}
              />
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cotton Yarn Production"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Estimated Duration (minutes, optional)</Label>
              <Input
                type="number"
                min={0}
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="e.g. 60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formula ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Batch Charts ─────────────────────────────────────────────────────

const CHART_COLORS = ['#9067c6', '#8d86c9', '#7c6bb8', '#6b5aa7', '#5a4996'];

const BatchStatusPieChart: React.FC<{ batches: ProductionBatch[] }> = ({ batches }) => {
  const byStatus = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of batches) {
      map[b.status] = (map[b.status] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [batches]);

  if (byStatus.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No batch data</p>;
  }
  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} label>
            {byStatus.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Batch Detail Panel ───────────────────────────────────────────────

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
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Batch lines</p>
        {!loadingItems && (
          <span className="text-xs tabular-nums text-muted-foreground">{batchItems.length} lines</span>
        )}
      </div>
      <Separator className="mb-3 shrink-0" />
      {loadingItems ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
        </div>
      ) : batchItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {batch.status === 'draft' && batch.formula_id
            ? 'No lines yet — they appear after Start. Add items below when allowed, or wait for the formula.'
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
                      {role}
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
                {r}
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
          placeholder="—"
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
                <Label htmlFor="batch-edit-exp-out">Expected output qty</Label>
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
                <Label htmlFor="batch-edit-act-out">Actual output qty</Label>
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
                <dt className="text-xs text-muted-foreground">Expected output</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{batch.expected_output_quantity}</dd>
              </div>
            )}
            {batch.actual_output_quantity != null && (
              <div>
                <dt className="text-xs text-muted-foreground">Actual output</dt>
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
            Start…
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
        <span className="text-xs text-muted-foreground">Outputs and waste auto-posted on completion.</span>
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
              placeholder="—"
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
            {row.expected_quantity ?? '—'}
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
              placeholder="—"
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
            {row.actual_quantity ?? '—'}
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

// ─── Batch Row ───────────────────────────────────────────────────────

interface BatchRowProps {
  batch: ProductionBatch;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  getStatusBadge: (s: string) => string;
  isSelected?: boolean;
  onClick?: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const BatchRow: React.FC<BatchRowProps> = ({
  batch,
  lines,
  formulas,
  getStatusBadge,
  isSelected,
  onClick,
  onStart,
  onComplete,
  onCancel,
}) => {
  const line = lines.find((l) => l.id === batch.production_line_id);
  const formula = batch.formula_id
    ? formulas.find((f) => f.id === batch.formula_id)
    : null;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer ${isSelected ? 'bg-brand-primary/10' : ''}`}
      onClick={onClick}
    >
        <div>
        <div className="font-medium text-card-foreground">{batch.batch_number}</div>
        <div className="text-sm text-muted-foreground">
          {line?.name ?? `Line #${batch.production_line_id}`}
          {formula && ` • ${formula.name}`}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(batch.status)}`}>
            {batch.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(batch.batch_date).toLocaleDateString()}
            {batch.expected_output_quantity != null && ` • Expected: ${batch.expected_output_quantity}`}
            {batch.actual_output_quantity != null && ` • Actual: ${batch.actual_output_quantity}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {batch.status === 'draft' && (
          <Button size="sm" variant="outline" onClick={onStart}>
            <Play className="h-4 w-4 mr-1" />
            Start
          </Button>
        )}
        {batch.status === 'in_progress' && (
          <>
            <Button size="sm" variant="outline" onClick={onComplete}>
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Add Batch Dialog ────────────────────────────────────────────────

interface AddBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  factoryId: number | null;
  createBatch: ReturnType<typeof useCreateProductionBatchMutation>[0];
  isCreating: boolean;
  onSuccess: () => void;
}

const AddBatchDialog: React.FC<AddBatchDialogProps> = ({
  open,
  onOpenChange,
  lines,
  formulas,
  factoryId,
  createBatch,
  isCreating,
  onSuccess,
}) => {
  const [addBatchItem] = useAddBatchItemMutation();
  const [lineId, setLineId] = useState('');
  const [formulaId, setFormulaId] = useState('__none__');
  const [batchDate, setBatchDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [shift, setShift] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [notes, setNotes] = useState('');
  const selectedFormulaId = formulaId && formulaId !== '__none__' ? parseInt(formulaId, 10) : null;
  const parsedExpectedOutput =
    expectedOutput.trim() === '' ? null : parseInt(expectedOutput, 10);
  const { data: selectedFormulaItems = [] } = useGetFormulaItemsQuery(
    { formulaId: selectedFormulaId ?? 0 },
    { skip: !selectedFormulaId }
  );

  const formulaDefaultOutput = useMemo(() => {
    if (!selectedFormulaId || selectedFormulaItems.length === 0) return 0;
    return selectedFormulaItems
      .filter((fi) => fi.item_role === 'output')
      .reduce((sum, fi) => sum + fi.quantity, 0);
  }, [selectedFormulaId, selectedFormulaItems]);

  React.useEffect(() => {
    if (open) {
      setLineId('');
      setFormulaId('__none__');
      setBatchDate(new Date().toISOString().split('T')[0]);
      setShift('');
      setExpectedOutput('');
      setNotes('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lid = parseInt(lineId, 10);
    if (!lid) {
      toast.error('Production line is required');
      return;
    }
    if (
      expectedOutput.trim() !== '' &&
      (parsedExpectedOutput == null || Number.isNaN(parsedExpectedOutput) || parsedExpectedOutput < 1)
    ) {
      toast.error('Enter a positive integer for target output, or leave blank for the formula default');
      return;
    }

    const effectiveTargetOutput =
      selectedFormulaId && selectedFormulaItems.length > 0
        ? parsedExpectedOutput != null && !Number.isNaN(parsedExpectedOutput) && parsedExpectedOutput >= 1
          ? parsedExpectedOutput
          : formulaDefaultOutput > 0
            ? formulaDefaultOutput
            : undefined
        : parsedExpectedOutput != null && !Number.isNaN(parsedExpectedOutput) && parsedExpectedOutput >= 1
          ? parsedExpectedOutput
          : undefined;

    try {
      const createdBatch = await createBatch({
        production_line_id: lid,
        formula_id: selectedFormulaId ?? undefined,
        batch_date: batchDate,
        shift: shift.trim() || undefined,
        expected_output_quantity: effectiveTargetOutput,
        notes: notes.trim() || undefined,
      }).unwrap();

      if (selectedFormulaId && selectedFormulaItems.length > 0) {
        const formulaOutputBase = formulaDefaultOutput;
        const targetOutput = effectiveTargetOutput;
        const multiplier =
          formulaOutputBase > 0 && targetOutput != null && targetOutput > 0
            ? targetOutput / formulaOutputBase
            : 1;

        const addOps = selectedFormulaItems.map((fi) =>
          addBatchItem({
            batchId: createdBatch.id,
            data: {
              batch_id: createdBatch.id,
              item_id: fi.item_id,
              item_role: fi.item_role,
              expected_quantity: Math.max(0, Math.trunc(fi.quantity * multiplier)),
            },
          }).unwrap()
        );

        try {
          await Promise.all(addOps);
        } catch {
          // Keep draft batch even if one line insert fails.
          toast.error('Batch created, but some formula lines could not be seeded');
        }
      }

      toast.success('Batch created');
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to create');
    }
  };

  const filteredLines = factoryId
    ? lines.filter((l) => l.factory_id === factoryId)
    : lines;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Batch</DialogTitle>
            <DialogDescription>
              Create a batch in draft. Use formula for variance tracking, or leave empty for simple mode.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Production Line *</Label>
              <Select value={lineId} onValueChange={setLineId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select line" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLines.map((l) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Formula (optional - for variance tracking)</Label>
              <Select value={formulaId} onValueChange={setFormulaId}>
                <SelectTrigger>
                  <SelectValue placeholder="None (simple mode)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (simple mode)</SelectItem>
                  {formulas.filter((f) => f.is_active).map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name} ({f.formula_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>
                {selectedFormulaId ? 'Target output qty (optional)' : 'Expected output qty (optional)'}
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                placeholder={
                  selectedFormulaId
                    ? formulaDefaultOutput > 0
                      ? `Blank = default (${formulaDefaultOutput})`
                      : 'Blank = formula base output'
                    : 'Optional'
                }
              />
              {selectedFormulaId && formulaDefaultOutput > 0 && (
                <p className="text-xs text-muted-foreground">
                  Leave blank to use the formula&apos;s default output ({formulaDefaultOutput}) for scaling.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Batch Date *</Label>
              <Input
                type="date"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Shift (optional)</Label>
              <Input
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                placeholder="e.g. Morning"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Complete Batch Dialog ────────────────────────────────────────────

interface CompleteBatchDialogProps {
  batch: ProductionBatch;
  onClose: () => void;
  completeBatch: ReturnType<typeof useCompleteBatchMutation>[0];
  onSuccess: () => void;
}

const CompleteBatchDialog: React.FC<CompleteBatchDialogProps> = ({
  batch,
  onClose,
  completeBatch,
  onSuccess,
}) => {
  const [actualOutput, setActualOutput] = useState(
    batch.expected_output_quantity?.toString() ?? ''
  );
  const [actualDuration, setActualDuration] = useState('');
  const [notes, setNotes] = useState(batch.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeBatch({
        id: batch.id,
        data: {
          actual_output_quantity: actualOutput ? parseInt(actualOutput, 10) : undefined,
          actual_duration_minutes: actualDuration ? parseInt(actualDuration, 10) : undefined,
          notes: notes.trim() || undefined,
        },
      }).unwrap();
      toast.success('Batch completed — outputs and waste posted to inventory');
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to complete');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Complete Batch {batch.batch_number}</DialogTitle>
            <DialogDescription>
              Enter actual output and duration. Variance will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Actual Output Quantity</Label>
              <Input
                type="number"
                min={0}
                value={actualOutput}
                onChange={(e) => setActualOutput(e.target.value)}
                placeholder={batch.expected_output_quantity?.toString() ?? ''}
              />
            </div>
            <div className="grid gap-2">
              <Label>Actual Duration (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                placeholder="e.g. 55"
              />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Completion notes"
              />
            </div>
            <p className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/20 p-3">
              Completing will automatically post output and byproduct quantities to finished goods and waste to the damaged ledger.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Cancel Batch Dialog ───────────────────────────────────────────────

interface CancelBatchDialogProps {
  batch: ProductionBatch;
  onClose: () => void;
  cancelBatch: ReturnType<typeof useCancelBatchMutation>[0];
  onSuccess: () => void;
}

const CancelBatchDialog: React.FC<CancelBatchDialogProps> = ({
  batch,
  onClose,
  cancelBatch,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await cancelBatch({
        id: batch.id,
        data: { notes: notes.trim() || undefined },
      }).unwrap();
      toast.success('Batch cancelled');
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to cancel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Cancel Batch {batch.batch_number}</DialogTitle>
            <DialogDescription>
              This will mark the batch as cancelled. Optionally provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Reason (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cancellation reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Batch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Start Batch Dialog ───────────────────────────────────────────────

interface StartBatchDialogProps {
  batchId: number;
  lines: ProductionLine[];
  getItemName: (id: number) => string;
  startBatch: ReturnType<typeof useStartBatchMutation>[0];
  isStarting: boolean;
  onClose: () => void;
}

const StartBatchDialog: React.FC<StartBatchDialogProps> = ({
  batchId,
  lines,
  getItemName,
  startBatch,
  isStarting,
  onClose,
}) => {
  const { data: batch, isLoading: loadingBatch, error: batchErr } = useGetProductionBatchByIdQuery(batchId);
  const { data: batchItems = [], isLoading: loadingItems } = useGetBatchItemsQuery(
    { batchId },
    { skip: !batchId }
  );
  const line = batch ? lines.find((l) => l.id === batch.production_line_id) : undefined;

  const inputItems = useMemo(
    () => batchItems.filter((bi) => bi.item_role === 'input'),
    [batchItems]
  );

  const { data: storageRows = [], isLoading: loadingStorage } = useGetInventoryListQuery(
    {
      skip: 0,
      limit: 500,
      inventory_type: 'STORAGE',
      factory_id: line?.factory_id,
    },
    { skip: !line?.factory_id || inputItems.length === 0 }
  );

  const qtyByItem = useMemo(() => {
    const m = new Map<number, number>();
    for (const inv of storageRows) {
      m.set(inv.item_id, (m.get(inv.item_id) ?? 0) + inv.qty);
    }
    return m;
  }, [storageRows]);

  const shortages = useMemo(() => {
    if (inputItems.length === 0 || loadingStorage) return [];
    const out: { item_id: number; required: number; onHand: number }[] = [];
    for (const bi of inputItems) {
      const required = bi.actual_quantity ?? bi.expected_quantity ?? 0;
      if (required <= 0) continue;
      const onHand = qtyByItem.get(bi.item_id) ?? 0;
      if (onHand < required) {
        out.push({ item_id: bi.item_id, required, onHand });
      }
    }
    return out;
  }, [inputItems, qtyByItem, loadingStorage]);

  const noItems = !loadingItems && batchItems.length === 0;
  const stockCheckLoading = inputItems.length > 0 && !!line?.factory_id && loadingStorage;
  const blockedByStock = shortages.length > 0;

  const canSubmit =
    !!batch &&
    batch.status === 'draft' &&
    !noItems &&
    !blockedByStock &&
    !stockCheckLoading &&
    !loadingBatch &&
    !loadingItems;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !canSubmit) return;
    try {
      await startBatch({
        id: batch.id,
        data: {},
      }).unwrap();
      toast.success('Batch started — inputs deducted from storage');
      onClose();
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      toast.error(e2?.data?.detail || 'Failed to start batch');
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Start batch</DialogTitle>
            <DialogDescription>
              Input items will be deducted from storage. Starting will be blocked if storage is insufficient.
            </DialogDescription>
          </DialogHeader>

          {(loadingBatch || loadingItems) && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          )}

          {batchErr && (
            <p className="text-sm text-destructive py-4">Could not load batch.</p>
          )}

          {batch && !loadingBatch && !loadingItems && (
            <div className="grid gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{batch.batch_number}</span>
                {line && ` · ${line.name}`}
              </p>

              {noItems && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">No items added to this batch.</p>
                  <p className="text-muted-foreground mt-1">Add at least one item before starting.</p>
                </div>
              )}

              {!noItems && inputItems.length === 0 && (
                <p className="text-xs text-muted-foreground">No input items — no storage deduction needed.</p>
              )}

              {stockCheckLoading && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking storage…
                </p>
              )}

              {!stockCheckLoading && shortages.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive mb-2">Insufficient storage for input items</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {shortages.map((s) => (
                      <li key={s.item_id}>
                        {getItemName(s.item_id)}: need {s.required}, on hand {s.onHand}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {batch.status !== 'draft' && (
                <p className="text-sm text-destructive">This batch is not in draft status.</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Back
            </Button>
            <Button type="submit" disabled={!canSubmit || isStarting}>
              {isStarting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Start
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionPage;
