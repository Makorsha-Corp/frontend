import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import {
  useGetProductionLinesQuery,
  useCreateProductionLineMutation,
  useUpdateProductionLineMutation,
  useDeleteProductionLineMutation,
} from '@/features/production/productionApi';
import {
  useGetProductionFormulasQuery,
  useCreateProductionFormulaMutation,
  useUpdateProductionFormulaMutation,
  useDeleteProductionFormulaMutation,
  useGetFormulaItemsQuery,
  useAddFormulaItemMutation,
  useRemoveFormulaItemMutation,
} from '@/features/production/productionApi';
import {
  useGetProductionBatchesQuery,
  useCreateProductionBatchMutation,
  useStartBatchMutation,
  useCompleteBatchMutation,
  useCancelBatchMutation,
} from '@/features/production/productionApi';
import type {
  ProductionLine,
  ProductionFormula,
  ProductionFormulaItem,
  ProductionBatch,
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
  Minus,
  Layers,
  FileText,
  Package,
  LayoutDashboard,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';

const BATCH_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'] as const;
const ITEM_ROLES: ItemRole[] = ['input', 'output', 'waste', 'byproduct'];

const ProductionPage: React.FC = () => {
  const { factory: globalFactory } = useAppSelector((state) => state.auth);
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [factoryId, setFactoryId] = useState<number | null>(() => globalFactory?.id ?? null);
  const [lineId, setLineId] = useState<number | null>(null);
  const [batchStatusFilter, setBatchStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'batches'>('overview');
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Dialog states
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [isAddFormulaOpen, setIsAddFormulaOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<ProductionFormula | null>(null);
  const [selectedFormulaId, setSelectedFormulaId] = useState<number | null>(null);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [completingBatch, setCompletingBatch] = useState<ProductionBatch | null>(null);
  const [cancellingBatch, setCancellingBatch] = useState<ProductionBatch | null>(null);

  useEffect(() => {
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id]);

  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 });
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
      status: batchStatusFilter === 'all' ? undefined : batchStatusFilter,
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
  const [startBatch] = useStartBatchMutation();
  const [completeBatch] = useCompleteBatchMutation();
  const [cancelBatch] = useCancelBatchMutation();

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
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter(
      (b) =>
        b.batch_number.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
    );
  }, [batches, searchQuery]);

  // Metrics for Overview
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const batchesThisMonth = batches.filter(
      (b) => new Date(b.batch_date) >= thisMonthStart
    );
    const activeBatches = batches.filter((b) => b.status === 'in_progress');
    const completedWithEfficiency = batches.filter(
      (b) => b.status === 'completed' && b.efficiency_percentage != null
    );
    const avgEfficiency =
      completedWithEfficiency.length > 0
        ? completedWithEfficiency.reduce((s, b) => s + (b.efficiency_percentage ?? 0), 0) /
          completedWithEfficiency.length
        : null;
    return {
      totalLines: filteredLines.length,
      totalFormulas: filteredFormulas.length,
      activeBatches: activeBatches.length,
      batchesThisMonth: batchesThisMonth.length,
      avgEfficiency,
    };
  }, [filteredLines, filteredFormulas, batches]);

  const handleFactoryChange = (value: string) => {
    const id = value ? parseInt(value, 10) : null;
    setFactoryId(id);
    setLineId(null);
  };

  const handleLineChange = (value: string) => {
    const id = value ? parseInt(value, 10) : null;
    setLineId(id);
  };

  // When switching to Overview, clear line/status filters so metrics show full counts
  const handleTabChange = (tab: string) => {
    if (tab === 'overview') {
      setLineId(null);
      setBatchStatusFilter('all');
      setSelectedBatchId(null);
    }
    setActiveTab(tab as 'overview' | 'batches');
  };

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

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Production</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={factoryId?.toString() ?? 'all'} onValueChange={handleFactoryChange}>
                <SelectTrigger className="w-[180px] h-9">
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
              {activeTab === 'batches' && (
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
                <Select value={batchStatusFilter} onValueChange={setBatchStatusFilter}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {BATCH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </>
              )}
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={
                    activeTab === 'overview'
                      ? 'Search lines & formulas...'
                      : 'Search batches...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="batches">
                <Package className="h-4 w-4 mr-2" />
                Batches ({filteredBatches.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                <Card className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Production Lines</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metrics.totalLines}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Formulas</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metrics.totalFormulas}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Active Batches</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metrics.activeBatches}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Batches This Month</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metrics.batchesThisMonth}</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Avg. Efficiency</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.avgEfficiency != null
                        ? `${metrics.avgEfficiency.toFixed(1)}%`
                        : '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Half-half: Production Lines | Formulas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Production Lines */}
              <Card className="border-border">
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
                    <div className="divide-y divide-border">
                      {filteredLines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                        >
                          <div>
                            <div className="font-medium text-card-foreground">{line.name}</div>
                            {line.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-md">
                                {line.description}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Factory #{line.factory_id}
                              {line.machine_id && ` • Machine #${line.machine_id}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setEditingLine(line)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit line</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={async () => {
                                      if (!window.confirm(`Deactivate "${line.name}"?`)) return;
                                      try {
                                        await deleteLine(line.id).unwrap();
                                        toast.success('Line deactivated');
                                      } catch (e: unknown) {
                                        const err = e as { data?: { detail?: string } };
                                        toast.error(err?.data?.detail || 'Failed to deactivate');
                                      }
                                    }}
                                    disabled={isDeletingLine}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Deactivate line</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

                {/* Formulas */}
                <div>
              <Card className="border-border">
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
                    <div className="divide-y divide-border">
                      {filteredFormulas.map((formula) => (
                        <div
                          key={formula.id}
                          className={`flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer ${
                            selectedFormulaId === formula.id ? 'bg-brand-primary/10' : ''
                          }`}
                          onClick={() =>
                            setSelectedFormulaId(selectedFormulaId === formula.id ? null : formula.id)
                          }
                        >
                          <div>
                            <div className="font-medium text-card-foreground">
                              {formula.name} ({formula.formula_code})
                            </div>
                            {formula.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-md">
                                {formula.description}
                              </div>
                            )}
                            <span className="text-xs text-muted-foreground">
                              v{formula.version}
                              {formula.estimated_duration_minutes != null &&
                                ` • ~${formula.estimated_duration_minutes} min`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => setEditingFormula(formula)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit formula</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={async () => {
                                      if (!window.confirm(`Deactivate "${formula.name}"?`)) return;
                                      try {
                                        await deleteFormula(formula.id).unwrap();
                                        toast.success('Formula deactivated');
                                        setSelectedFormulaId(null);
                                      } catch (e: unknown) {
                                        const err = e as { data?: { detail?: string } };
                                        toast.error(err?.data?.detail || 'Failed to deactivate');
                                      }
                                    }}
                                    disabled={isDeletingFormula}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Deactivate formula</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedFormulaId && (
                <FormulaItemsPanel
                  formulaId={selectedFormulaId}
                  formula={formulas.find((f) => f.id === selectedFormulaId)!}
                  items={items}
                  getItemName={getItemName}
                  onClose={() => setSelectedFormulaId(null)}
                />
              )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="batches" className="mt-0">
              {/* Batch charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-base">Batches by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BatchStatusPieChart batches={filteredBatches} />
                  </CardContent>
                </Card>
                <Card className="border-border">
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

              <Card className="border-border">
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
                <CardContent className="p-0">
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
                    <div className="py-12 text-center text-muted-foreground text-sm">
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
                          onStart={async () => {
                            try {
                              await startBatch({ id: batch.id, data: {} }).unwrap();
                              toast.success('Batch started');
                            } catch (e: unknown) {
                              const err = e as { data?: { detail?: string } };
                              toast.error(err?.data?.detail || 'Failed to start');
                            }
                          }}
                          onComplete={() => setCompletingBatch(batch)}
                          onCancel={() => setCancellingBatch(batch)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedBatchId && (
                <BatchDetailPanel
                  batch={filteredBatches.find((b) => b.id === selectedBatchId)!}
                  lines={linesForFactory}
                  formulas={formulas}
                  getStatusBadge={getStatusBadge}
                  onClose={() => setSelectedBatchId(null)}
                  onStart={async () => {
                    const b = filteredBatches.find((x) => x.id === selectedBatchId);
                    if (!b) return;
                    try {
                      await startBatch({ id: b.id, data: {} }).unwrap();
                      toast.success('Batch started');
                    } catch (e: unknown) {
                      const err = e as { data?: { detail?: string } };
                      toast.error(err?.data?.detail || 'Failed to start');
                    }
                  }}
                  onComplete={() => {
                    const b = filteredBatches.find((x) => x.id === selectedBatchId);
                    if (b) setCompletingBatch(b);
                  }}
                  onCancel={() => {
                    const b = filteredBatches.find((x) => x.id === selectedBatchId);
                    if (b) setCancellingBatch(b);
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add/Edit Line Dialog */}
      <AddEditLineDialog
        open={isAddLineOpen || !!editingLine}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddLineOpen(false);
            setEditingLine(null);
          }
        }}
        factories={factories}
        factoryId={factoryId}
        line={editingLine}
        createLine={createLine}
        updateLine={updateLine}
        isCreating={isCreatingLine}
        isUpdating={isUpdatingLine}
        onSuccess={() => {
          setIsAddLineOpen(false);
          setEditingLine(null);
        }}
      />

      {/* Add/Edit Formula Dialog */}
      <AddEditFormulaDialog
        open={isAddFormulaOpen || !!editingFormula}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddFormulaOpen(false);
            setEditingFormula(null);
          }
        }}
        formula={editingFormula}
        formulas={formulas}
        createFormula={createFormula}
        updateFormula={updateFormula}
        isCreating={isCreatingFormula}
        isUpdating={isUpdatingFormula}
        onSuccess={() => {
          setIsAddFormulaOpen(false);
          setEditingFormula(null);
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

// ─── Formula Items Panel ──────────────────────────────────────────────

interface FormulaItemsPanelProps {
  formulaId: number;
  formula: ProductionFormula;
  items: { id: number; name: string }[];
  getItemName: (id: number) => string;
  onClose: () => void;
}

const FormulaItemsPanel: React.FC<FormulaItemsPanelProps> = ({
  formulaId,
  formula,
  items,
  getItemName,
  onClose,
}) => {
  const { data: formulaItems = [], isLoading } = useGetFormulaItemsQuery({ formulaId });
  const [addFormulaItem, { isLoading: isAdding }] = useAddFormulaItemMutation();
  const [removeFormulaItem] = useRemoveFormulaItemMutation();
  const [addItemId, setAddItemId] = useState('');
  const [addRole, setAddRole] = useState<ItemRole>('input');
  const [addQty, setAddQty] = useState('1');

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
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to add');
    }
  };

  const handleRemove = async (item: ProductionFormulaItem) => {
    if (!window.confirm(`Remove ${getItemName(item.item_id)} from formula?`)) return;
    try {
      await removeFormulaItem(item.id).unwrap();
      toast.success('Item removed');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to remove');
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

  return (
    <Card className="border-border mt-4">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Formula Items: {formula.name}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <Minus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
          <Select value={addItemId} onValueChange={setAddItemId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((i) => (
                <SelectItem key={i.id} value={i.id.toString()}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={addRole} onValueChange={(v) => setAddRole(v as ItemRole)}>
            <SelectTrigger className="w-[120px]">
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
          <Input
            type="number"
            min={1}
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
            className="w-20"
            placeholder="Qty"
          />
          <Button type="submit" size="sm" disabled={isAdding}>
            {isAdding && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Add
          </Button>
        </form>

        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <div className="space-y-3">
            {ITEM_ROLES.map((role) => (
              <div key={role}>
                <div className="text-xs font-medium text-muted-foreground uppercase mb-1">{role}</div>
                <div className="space-y-1">
                  {byRole[role].length === 0 ? (
                    <p className="text-sm text-muted-foreground">None</p>
                  ) : (
                    byRole[role].map((fi) => (
                      <div
                        key={fi.id}
                        className="flex items-center justify-between py-1 px-2 rounded bg-muted/50"
                      >
                        <span>
                          {getItemName(fi.item_id)} × {fi.quantity}
                          {fi.unit && ` ${fi.unit}`}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleRemove(fi)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
  batch: ProductionBatch;
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  getStatusBadge: (s: string) => string;
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const BatchDetailPanel: React.FC<BatchDetailPanelProps> = ({
  batch,
  lines,
  formulas,
  getStatusBadge,
  onClose,
  onStart,
  onComplete,
  onCancel,
}) => {
  const line = lines.find((l) => l.id === batch.production_line_id);
  const formula = batch.formula_id ? formulas.find((f) => f.id === batch.formula_id) : null;

  return (
    <Card className="border-border mt-6">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Batch details: {batch.batch_number}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${getStatusBadge(batch.status)}`}>
              {batch.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <p className="text-muted-foreground">Line</p>
            <p className="font-medium">{line?.name ?? `Line #${batch.production_line_id}`}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Formula</p>
            <p className="font-medium">{formula?.name ?? 'Simple mode'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{new Date(batch.batch_date).toLocaleDateString()}</p>
          </div>
          {batch.expected_output_quantity != null && (
            <div>
              <p className="text-muted-foreground">Expected output</p>
              <p className="font-medium">{batch.expected_output_quantity}</p>
            </div>
          )}
          {batch.actual_output_quantity != null && (
            <div>
              <p className="text-muted-foreground">Actual output</p>
              <p className="font-medium">{batch.actual_output_quantity}</p>
            </div>
          )}
          {batch.efficiency_percentage != null && (
            <div>
              <p className="text-muted-foreground">Efficiency</p>
              <p className="font-medium">{batch.efficiency_percentage.toFixed(1)}%</p>
            </div>
          )}
          {batch.notes && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Notes</p>
              <p className="font-medium">{batch.notes}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          {batch.status === 'draft' && (
            <Button size="sm" onClick={onStart}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {batch.status === 'in_progress' && (
            <>
              <Button size="sm" onClick={onComplete}>
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
      </CardContent>
    </Card>
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
  const [lineId, setLineId] = useState('');
  const [formulaId, setFormulaId] = useState('__none__');
  const [batchDate, setBatchDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [shift, setShift] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [notes, setNotes] = useState('');

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
    try {
      await createBatch({
        production_line_id: lid,
        formula_id: formulaId && formulaId !== '__none__' ? parseInt(formulaId, 10) : undefined,
        batch_date: batchDate,
        shift: shift.trim() || undefined,
        expected_output_quantity: expectedOutput ? parseInt(expectedOutput, 10) : undefined,
        notes: notes.trim() || undefined,
      }).unwrap();
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
              <Label>Expected Output Qty (optional)</Label>
              <Input
                type="number"
                min={1}
                value={expectedOutput}
                onChange={(e) => setExpectedOutput(e.target.value)}
                placeholder="For formula scaling"
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
      toast.success('Batch completed');
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

export default ProductionPage;
