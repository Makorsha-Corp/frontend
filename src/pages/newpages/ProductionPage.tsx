import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { useProductionPageNavigation } from '@/pages/newpages/production/useProductionPageNavigation';
import { normalizeProductionScheduleWeekAnchor } from '@/components/newcomponents/customui/production/productionScheduleWeek';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import {
  singleFactoryToSlice,
  sliceToSingleFactoryId,
} from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import { useScrollTargetHighlight } from '@/lib/scrollTargetHighlight';
import { AppShellHeaderCompactList } from '@/components/newcomponents/customui/AppShellHeaderCompactList';
import { appShellHeaderScopeSeparatorClass } from '@/components/newcomponents/customui/AppShellHeader';
import { ORDER_PANEL_HEADER_CLASS } from '@/components/newcomponents/customui/orders/orderListConstants';
import { ContributionHeatmap } from '@/components/newcomponents/customui/ContributionHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatProductionQuantity,
  formatProductionScaleFactor,
  parseProductionQuantity,
} from '@/lib/productionQuantity';
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
import { EmphasisTabsProvider } from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import ProductionPageHeaderTabList, {
  type ProductionPageTab,
} from '@/components/newcomponents/customui/production/ProductionPageHeaderTabs';
import {
  ProductionBatchSearchBar,
  ProductionSetupSearchBar,
  BATCH_STATUS_POPOVER_STATUSES,
  PRODUCTION_BATCH_STATUSES,
  batchMatchesDateRange,
  filterBatchesByStatusForList,
  isDefaultBatchStatusFilter,
  isDayDefaultBatchStatusFilter,
  isWeekDefaultBatchStatusFilter,
  normalizeLegacyBatchStatusToken,
  resolveEffectiveBatchStatusFilter,
  type ProductionBatchStatus,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import ProductionSetupPanel from '@/components/newcomponents/customui/production/ProductionSetupPanel';
import ProductionLineDetailDialog from '@/components/newcomponents/customui/production/ProductionLineDetailDialog';
import ProductionLineMachinesSelector from '@/components/newcomponents/customui/production/ProductionLineMachinesSelector';
import {
  lineMachineIds,
  resolveLineMachineIdForSchedule,
} from '@/components/newcomponents/customui/production/StationMachinesField';
import ProductionRunsTab from '@/components/newcomponents/customui/production/ProductionRunsTab';
import {
  buildStageDraftDefaults,
  plannedStartLocalAtEight,
  type ScheduleBatchCreateSeed,
} from '@/components/newcomponents/customui/production/scheduleBatchCreateSeed';
import ProductionOverviewByLine from '@/components/newcomponents/customui/production/ProductionOverviewByLine';
import ProductionHeaderFilters from '@/components/newcomponents/customui/production/ProductionHeaderFilters';
import {
  batchesInLineScope,
  linesInLineScope,
} from '@/components/newcomponents/customui/production/productionHeaderFilterHelpers';
import { productionActivityFilterSummary } from '@/lib/productionActivityFilterSummary';
import { productionFilterCopy, productionStatusLabel } from '@/components/newcomponents/customui/production/productionStatusLabel';
import {
  activityFormulaIdsForQuery,
  isNoActivityRecipesSelected,
} from '@/lib/productionActivityRecipeFilter';
import { buildActivityHeatmapItemsFromBatches } from '@/lib/productionActivityHeatmapItems';
import BatchDetailPanel from '@/components/newcomponents/customui/production/panels/BatchDetailPanel';
import {
  resolveScheduleFactoryId,
  useFactoryProductionSchedule,
} from '@/features/production/useFactoryProductionSchedule';
import { plannedStartLocalFromIso } from '@/lib/plannedStartLocal';
import BatchActivityPanel from '@/components/newcomponents/customui/production/BatchActivityPanel';
import BatchRow from '@/components/newcomponents/customui/production/panels/BatchRow';
import AddBatchRecipePathList from '@/components/newcomponents/customui/production/AddBatchRecipePathList';
import AddBatchRecipePathStepEditor from '@/components/newcomponents/customui/production/AddBatchRecipePathStepEditor';
import RecipePickerDialog from '@/components/newcomponents/customui/production/RecipePickerDialog';
import ProductionLineMachineSelect from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import { cn } from '@/lib/utils';
import BatchShiftWhenRow from '@/components/newcomponents/customui/production/BatchShiftWhenRow';
import { useGetWorkspaceShiftsQuery } from '@/features/workspaceShifts/workspaceShiftsApi';
import { millBatchDate } from '@/lib/millCalendarDate';
import { useMillTimezone } from '@/hooks/useMillTimezone';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import {
  finishedGoodOutputItemIds,
  finishedGoodOutputQuantity,
} from '@/lib/recipeDerivedMetrics';
import AddBatchRecipeStepMaterials from '@/components/newcomponents/customui/production/AddBatchRecipeStepMaterials';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import {
  allProductionLineIds,
  isAllProductionLinesSelected,
} from '@/components/newcomponents/customui/production/productionRunsLineFilterUtils';
import { useGetSalesOrderItemsQuery, useGetSalesOrdersQuery } from '@/features/salesOrders/salesOrdersApi';
import { ProductionScheduleConflictDialog } from '@/components/newcomponents/customui/production/ProductionScheduleConflictDialog';
import {
  findProductionScheduleConflicts,
  sequentialStepWindows,
  type ProductionScheduleConflict,
} from '@/components/newcomponents/customui/production/productionScheduleConflict';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import BatchStartStoragePreview from '@/components/newcomponents/customui/production/BatchStartStoragePreview';
import BatchShortStockDialogs, {
  existingStorageForShort,
  type ShortStockSeed,
} from '@/components/newcomponents/customui/production/BatchShortStockDialogs';
import { storageGapQty } from '@/lib/batchInputStorageCheck';
import { useBatchInputStoragePreview } from '@/hooks/useBatchInputStoragePreview';
import {
  useGetProductionLinesQuery,
  useCreateProductionLineMutation,
  useUpdateProductionLineMutation,
  useDeleteProductionLineMutation,
  useGetProductionFormulasQuery,
  useCreateProductionFormulaMutation,
  useCopyProductionFormulaMutation,
  useUpdateProductionFormulaMutation,
  useDeleteProductionFormulaMutation,
  useGetFormulaStagesQuery,
  useGetAllFormulaStageItemsQuery,
  useGetAllFormulaStageParametersQuery,
  useGetProductionRouteStepsQuery,
  useGetProductionScheduleQuery,
  useGetProductionBatchesQuery,
  useGetProductionOverviewStatsQuery,
  useGetProductionBatchActivityQuery,
  useGetProductionBatchByIdQuery,
  useCreateProductionBatchMutation,
  useCreateProductionBatchProgramMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  useStartBatchMutation,
  useCompleteBatchMutation,
  useCancelBatchMutation,
  useGetBatchItemsQuery,
} from '@/features/production/productionApi';
import type {
  ProductionLine,
  ProductionFormula,
  ProductionBatch,
} from '@/types/production';
import {
  FlaskConical,
  Plus,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { appToast } from '@/lib/appToast';
import ProductionStartEarlierFields from '@/components/newcomponents/customui/production/ProductionStartEarlierFields';
import {
  ProductionRunRecurrenceFields,
  type ProductionRunRecurrenceCadence,
} from '@/components/newcomponents/customui/production/ProductionRunRecurrenceFields';
import { DEFAULT_RECURRENCE_CADENCE } from '@/pages/newpages/orders/workOrderRecurrenceCadence';
import { validateRecurrenceSpan } from '@/pages/newpages/orders/workOrderTemplateLabels';
import { apiErrorDetail } from '@/utils/apiError';
import {
  defaultLocalDatetimeNow,
  startedAtForApi,
  validateStartedEarlier,
} from '@/lib/productionStartEarlier';

const BATCH_STATUS_FILTER_STORAGE_KEY = 'production.batches.statusFilter';
const BATCH_STATUS_FILTER_CUSTOM_READY_KEY = 'production.batches.statusFilterCustomReady';

function readStoredBatchStatuses(): ProductionBatchStatus[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BATCH_STATUS_FILTER_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validStatuses = parsed
      .filter((v): v is string => typeof v === 'string')
      .map(normalizeLegacyBatchStatusToken)
      .filter((v): v is ProductionBatchStatus =>
        PRODUCTION_BATCH_STATUSES.includes(v as ProductionBatchStatus),
      );
    if (validStatuses.length === 0) return [];
    const withoutCompleted = validStatuses.filter((s) => s !== 'completed');
    if (withoutCompleted.length === 0) return [];
    if (
      withoutCompleted.length === BATCH_STATUS_POPOVER_STATUSES.length &&
      BATCH_STATUS_POPOVER_STATUSES.every((s) => withoutCompleted.includes(s))
    ) {
      return [];
    }
    const customReady = window.localStorage.getItem(BATCH_STATUS_FILTER_CUSTOM_READY_KEY) === '1';
    if (!customReady) {
      window.localStorage.setItem(BATCH_STATUS_FILTER_CUSTOM_READY_KEY, '1');
      if (
        isWeekDefaultBatchStatusFilter(withoutCompleted) ||
        isDayDefaultBatchStatusFilter(withoutCompleted)
      ) {
        window.localStorage.setItem(BATCH_STATUS_FILTER_STORAGE_KEY, '[]');
        return [];
      }
    }
    return withoutCompleted;
  } catch {
    return [];
  }
}

function persistStoredBatchStatuses(statuses: ProductionBatchStatus[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BATCH_STATUS_FILTER_STORAGE_KEY, JSON.stringify(statuses));
}

/** Backend Numeric/Decimal fields often arrive as strings in JSON */
function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const ProductionPage: React.FC = () => {
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
  const isLgScreen = useIsLgScreen();
  const [catalogLineIds, setCatalogLineIds] = useState<number[] | null>(null);
  const [catalogMachineIds, setCatalogMachineIds] = useState<number[] | null>(null);
  const {
    factoryId,
    setFactoryId,
    activeTab,
    setActiveTab,
    selectedBatchId,
    setSelectedBatchId,
    lineId,
    setLineId,
    batchSearchQuery,
    setBatchSearchQuery,
    batchStatusFilter,
    setBatchStatusFilter,
    setupSearchQuery,
    setSetupSearchQuery,
    setupFocusFormulaId,
    setSetupFocusFormulaId,
    handleSetupFocusFormulaHandled,
    showCompletedBatches,
    setShowCompletedBatches,
    batchDateFrom,
    batchDateTo,
    setBatchDateRange,
    runsDateViewMode,
    runsWeekAnchorIso,
    runsDayIso,
    runsLineIdsFromUrl,
    runsMachine,
    setRunsDateViewMode,
    pickRunsWeek,
    pickRunsDay,
    openRunsDay,
    setRunsLineIds,
    setRunsMachine,
    runsWeekBatchGrid,
    setRunsWeekBatchGrid,
  } = useProductionPageNavigation({
    readStoredStatuses: readStoredBatchStatuses,
    persistStoredStatuses: persistStoredBatchStatuses,
    knownLineIds: catalogLineIds,
    knownMachineIds: catalogMachineIds,
  });
  const [activityFormulaIds, setActivityFormulaIds] = useState<number[]>([]);
  const [factoryPickerOpen, setFactoryPickerOpen] = useState(false);
  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const {
    highlighted: factoryPickerHighlight,
    pulseHighlight: pulseFactoryPickerHighlight,
    dismissHighlight: dismissFactoryPickerHighlight,
  } = useScrollTargetHighlight();
  const {
    data: factoryMachines = [],
    isLoading: loadingMachines,
    isFetching: fetchingMachines,
  } = useGetMachinesQuery(
    { limit: 500, ...(factoryId != null ? { factory_id: factoryId } : {}) },
    { skip: isLoadingFactories },
  );
  const { data: factorySections = [] } = useGetFactorySectionsQuery(
    { limit: 500, ...(factoryId != null ? { factory_id: factoryId } : {}) },
    { skip: isLoadingFactories },
  );

  const factoryMachineOptions = useMemo(
    () =>
      factoryMachines.map((machine) => ({
        id: machine.id,
        name: machine.name,
        is_running: machine.is_running,
        latest_status_type: machine.latest_status_type ?? null,
      })),
    [factoryMachines],
  );
  // Dialog states
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<ProductionFormula | null>(null);
  const [isAddFormulaOpen, setIsAddFormulaOpen] = useState(false);
  const [createRecipeRouteId, setCreateRecipeRouteId] = useState<number | null>(null);
  const [lineActionTarget, setLineActionTarget] = useState<ProductionLine | null>(null);
  const [formulaActionTarget, setFormulaActionTarget] = useState<ProductionFormula | null>(null);
  const [isFormulaEditMode, setIsFormulaEditMode] = useState(false);
  const [formulaDraftCode, setFormulaDraftCode] = useState('');
  const [formulaDraftName, setFormulaDraftName] = useState('');
  const [formulaDraftDescription, setFormulaDraftDescription] = useState('');
  const [runsHeaderControls, setRunsHeaderControls] = useState<React.ReactNode>(null);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [addBatchInitialMode, setAddBatchInitialMode] = useState<'recipe' | 'recurring'>('recipe');
  const [scheduleCreateSeed, setScheduleCreateSeed] = useState<ScheduleBatchCreateSeed | null>(null);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [completingBatch, setCompletingBatch] = useState<ProductionBatch | null>(null);
  const [cancellingBatch, setCancellingBatch] = useState<ProductionBatch | null>(null);
  const [startBatchId, setStartBatchId] = useState<number | null>(null);

  const promptFactorySelect = useCallback(() => {
    pulseFactoryPickerHighlight();
    setFactoryPickerOpen(true);
  }, [pulseFactoryPickerHighlight]);

  const requireFactory = useCallback((): boolean => {
    if (factoryId != null) return true;
    promptFactorySelect();
    return false;
  }, [factoryId, promptFactorySelect]);

  const openRunsNewRun = useCallback(
    (day: Date | null) => {
      if (!requireFactory()) return;
      setAddBatchInitialMode('recipe');
      setScheduleCreateSeed(day ? { day: new Date(day) } : null);
      setIsAddBatchOpen(true);
    },
    [requireFactory],
  );

  const openRunsRecurring = useCallback(() => {
    if (!requireFactory()) return;
    setAddBatchInitialMode('recurring');
    setScheduleCreateSeed(null);
    setIsAddBatchOpen(true);
  }, [requireFactory]);

  const factoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const factory of factories) {
      map.set(factory.id, factory.abbreviation?.trim() || factory.name);
    }
    return map;
  }, [factories]);
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: false });

  const {
    data: lines = [],
    isLoading: loadingLines,
    isFetching: fetchingLines,
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

  useEffect(() => {
    if (loadingLines || fetchingLines) {
      setCatalogLineIds(null);
      return;
    }
    setCatalogLineIds(linesForFactory.map((line) => line.id));
  }, [loadingLines, fetchingLines, linesForFactory]);

  useEffect(() => {
    if (loadingMachines || fetchingMachines) {
      setCatalogMachineIds(null);
      return;
    }
    setCatalogMachineIds(factoryMachines.map((machine) => machine.id));
  }, [loadingMachines, fetchingMachines, factoryMachines]);

  useEffect(() => {
    if (isLoadingFactories || factories.length === 0) return;
    if (factoryId == null) return;
    if (factories.some((factory) => factory.id === factoryId)) return;
    setFactoryId(null);
  }, [isLoadingFactories, factories, factoryId, setFactoryId]);

  const effectiveRunsLineIds = useMemo(() => {
    if (runsLineIdsFromUrl === null) return allProductionLineIds(linesForFactory);
    return runsLineIdsFromUrl.filter((id) => linesForFactory.some((l) => l.id === id));
  }, [runsLineIdsFromUrl, linesForFactory]);

  const handleRunsLineIdsChange = useCallback(
    (lineIds: number[]) => {
      setRunsLineIds(lineIds, allProductionLineIds(linesForFactory));
    },
    [linesForFactory, setRunsLineIds],
  );

  useEffect(() => {
    setLineActionTarget((prev) => {
      if (!prev) return prev;
      return linesForFactory.find((l) => l.id === prev.id) ?? prev;
    });
  }, [linesForFactory]);

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
      status: undefined,
    },
    { skip: false }
  );

  useEffect(() => {
    if (lineId == null || runsLineIdsFromUrl !== null || linesForFactory.length === 0) return;
    setRunsLineIds([lineId], allProductionLineIds(linesForFactory));
    setLineId(null);
  }, [lineId, runsLineIdsFromUrl, linesForFactory, setRunsLineIds, setLineId]);

  const batches = useMemo(() => {
    let rows = batchesRaw;
    if (factoryId != null) {
      const lineIds = new Set(linesForFactory.map((l) => l.id));
      rows = rows.filter((b) => lineIds.has(b.production_line_id));
    }
    return batchesInLineScope(rows, linesForFactory, effectiveRunsLineIds);
  }, [batchesRaw, factoryId, linesForFactory, effectiveRunsLineIds]);

  const selectedBatchFromList = useMemo(
    () => (selectedBatchId != null ? batches.find((b) => b.id === selectedBatchId) ?? null : null),
    [batches, selectedBatchId],
  );
  const { data: selectedBatchById, isError: selectedBatchByIdError } = useGetProductionBatchByIdQuery(
    selectedBatchId!,
    { skip: selectedBatchId == null || selectedBatchFromList != null },
  );
  const deepLinkBatch = selectedBatchFromList ?? selectedBatchById ?? null;

  const [schedulePlannedStartLocal, setSchedulePlannedStartLocal] = useState('');
  useEffect(() => {
    if (selectedBatchId == null) {
      setSchedulePlannedStartLocal('');
      return;
    }
    setSchedulePlannedStartLocal(plannedStartLocalFromIso(deepLinkBatch?.planned_start_at));
  }, [selectedBatchId, deepLinkBatch?.planned_start_at]);

  const scheduleFactoryId = useMemo(
    () =>
      resolveScheduleFactoryId({
        batchProductionLineId: deepLinkBatch?.production_line_id,
        lines: linesForFactory,
        pageFactoryId: factoryId,
      }),
    [deepLinkBatch?.production_line_id, linesForFactory, factoryId],
  );

  const factoryScheduleBatches = useFactoryProductionSchedule({
    factoryId: selectedBatchId != null ? scheduleFactoryId : null,
    plannedStartLocal: schedulePlannedStartLocal,
  });

  const handleSchedulePlannedStartChange = useCallback((plannedStartLocal: string) => {
    setSchedulePlannedStartLocal(plannedStartLocal);
  }, []);

  useEffect(() => {
    if (selectedBatchId == null || selectedBatchFromList != null || !selectedBatchByIdError) return;
    setSelectedBatchId(null);
  }, [selectedBatchId, selectedBatchFromList, selectedBatchByIdError, setSelectedBatchId]);

  useEffect(() => {
    if (!deepLinkBatch) return;
    const line = lines.find((l) => l.id === deepLinkBatch.production_line_id);
    const batchFactoryId = line?.factory_id;
    if (batchFactoryId == null || batchFactoryId === factoryId) return;
    setFactoryId(batchFactoryId);
  }, [deepLinkBatch, factoryId, lines, setFactoryId]);

  /** Calendar deep link: align runs week/day when batch is not on the current grid. */
  useEffect(() => {
    if (selectedBatchId == null || !deepLinkBatch || selectedBatchFromList) return;
    const anchor = deepLinkBatch.planned_start_at
      ? format(parseISO(deepLinkBatch.planned_start_at), 'yyyy-MM-dd')
      : deepLinkBatch.batch_date.slice(0, 10);
    if (runsDateViewMode === 'day') {
      if (runsDayIso !== anchor) pickRunsDay(anchor);
      return;
    }
    if (runsDateViewMode === 'week') {
      const currentWeek = normalizeProductionScheduleWeekAnchor(runsWeekAnchorIso);
      const targetWeek = normalizeProductionScheduleWeekAnchor(anchor);
      if (currentWeek !== targetWeek) pickRunsWeek(anchor);
    }
  }, [
    selectedBatchId,
    deepLinkBatch,
    selectedBatchFromList,
    runsDateViewMode,
    runsDayIso,
    runsWeekAnchorIso,
    pickRunsDay,
    pickRunsWeek,
  ]);

  const [createLine, { isLoading: isCreatingLine }] = useCreateProductionLineMutation();
  const [updateLine, { isLoading: isUpdatingLine }] = useUpdateProductionLineMutation();
  const [deleteLine, { isLoading: isDeletingLine }] = useDeleteProductionLineMutation();
  const [createFormula, { isLoading: isCreatingFormula }] = useCreateProductionFormulaMutation();
  const [copyFormula, { isLoading: isCopyingFormula }] = useCopyProductionFormulaMutation();
  const [updateFormula, { isLoading: isUpdatingFormula }] = useUpdateProductionFormulaMutation();
  const [deleteFormula, { isLoading: isDeletingFormula }] = useDeleteProductionFormulaMutation();
  const [createBatch, { isLoading: isCreatingBatch }] = useCreateProductionBatchMutation();
  const [startBatch, { isLoading: isStartingBatch }] = useStartBatchMutation();
  const [completeBatch] = useCompleteBatchMutation();
  const [cancelBatch] = useCancelBatchMutation();
  const [updateProductionBatch, { isLoading: isUpdatingBatch }] = useUpdateProductionBatchMutation();
  const [deleteProductionBatch, { isLoading: isDeletingBatch }] = useDeleteProductionBatchMutation();

  const setupLinesInScope = useMemo(
    () => linesInLineScope(linesForFactory, effectiveRunsLineIds),
    [linesForFactory, effectiveRunsLineIds],
  );

  const filteredLines = useMemo(() => {
    if (!setupSearchQuery.trim()) return setupLinesInScope;
    const q = setupSearchQuery.toLowerCase();
    return setupLinesInScope.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
    );
  }, [setupLinesInScope, setupSearchQuery]);

  const filteredFormulas = useMemo(() => {
    if (!setupSearchQuery.trim()) return formulas;
    const q = setupSearchQuery.toLowerCase();
    return formulas.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.formula_code.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [formulas, setupSearchQuery]);

  /** Setup lists only active recipes; delete is a soft deactivate (is_active=false). */
  const setupFormulas = useMemo(
    () => filteredFormulas.filter((f) => f.is_active),
    [filteredFormulas],
  );

  const batchStatusViewMode = activeTab === 'batches' ? runsDateViewMode : 'all';

  const effectiveBatchStatusFilter = useMemo(
    () => resolveEffectiveBatchStatusFilter(batchStatusFilter, batchStatusViewMode),
    [batchStatusFilter, batchStatusViewMode],
  );

  const filteredBatches = useMemo(() => {
    const statusFiltered = filterBatchesByStatusForList(
      batches,
      showCompletedBatches,
      effectiveBatchStatusFilter,
    );
    const dateFiltered = statusFiltered.filter((b) =>
      batchMatchesDateRange(b, batchDateFrom, batchDateTo),
    );
    if (!batchSearchQuery.trim()) return dateFiltered;
    const q = batchSearchQuery.toLowerCase();
    return dateFiltered.filter(
      (b) =>
        b.batch_number.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q)),
    );
  }, [
    batches,
    batchSearchQuery,
    effectiveBatchStatusFilter,
    showCompletedBatches,
    batchDateFrom,
    batchDateTo,
  ]);

  const batchesMatchingRunsToolbar = useMemo(() => {
    const statusFiltered = filterBatchesByStatusForList(
      batches,
      showCompletedBatches,
      effectiveBatchStatusFilter,
    );
    let rows = statusFiltered;
    if (runsMachine !== 'all') {
      const machineId = Number(runsMachine);
      if (!Number.isNaN(machineId)) {
        rows = rows.filter((b) => b.machine_id === machineId);
      }
    }
    if (!batchSearchQuery.trim()) return rows;
    const q = batchSearchQuery.toLowerCase();
    return rows.filter(
      (b) =>
        b.batch_number.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q)),
    );
  }, [
    batches,
    batchSearchQuery,
    effectiveBatchStatusFilter,
    showCompletedBatches,
    runsMachine,
  ]);

  /** Week board line filter is per step; batch header line can differ. */
  const batchesForScheduleEligibility = batchesMatchingRunsToolbar;

  const batchesForRunsTab = useMemo(() => {
    let rows = batchesMatchingRunsToolbar;
    if (
      effectiveRunsLineIds.length > 0 &&
      !isAllProductionLinesSelected(effectiveRunsLineIds, linesForFactory)
    ) {
      const lineSet = new Set(effectiveRunsLineIds);
      rows = rows.filter((b) => lineSet.has(b.production_line_id));
    } else if (effectiveRunsLineIds.length === 0 && linesForFactory.length > 0) {
      rows = [];
    }
    return rows;
  }, [batchesMatchingRunsToolbar, effectiveRunsLineIds, linesForFactory]);

  const runsLinesForGrid = useMemo(() => {
    if (isAllProductionLinesSelected(effectiveRunsLineIds, linesForFactory)) return linesForFactory;
    if (effectiveRunsLineIds.length === 0) return [];
    const allowed = new Set(effectiveRunsLineIds);
    return linesForFactory.filter((l) => allowed.has(l.id));
  }, [linesForFactory, effectiveRunsLineIds]);

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

  const overviewStatsQueryArgs = useMemo(() => {
    const allStatusesSelected = isDefaultBatchStatusFilter(batchStatusFilter);
    return {
      factory_id: factoryId ?? undefined,
      date_from: batchDateFrom ?? undefined,
      date_to: batchDateTo ?? undefined,
      statuses: allStatusesSelected ? undefined : batchStatusFilter.join(','),
    };
  }, [factoryId, batchStatusFilter, batchDateFrom, batchDateTo]);

  const { data: overviewStatsRaw, isLoading: loadingOverviewStats } = useGetProductionOverviewStatsQuery(
    overviewStatsQueryArgs,
    { refetchOnMountOrArgChange: true },
  );

  const overviewStats = useMemo(() => {
    if (!overviewStatsRaw) return undefined;
    if (isAllProductionLinesSelected(effectiveRunsLineIds, linesForFactory)) {
      return overviewStatsRaw;
    }
    if (effectiveRunsLineIds.length === 0) {
      return { ...overviewStatsRaw, lines: [], outliers: [] };
    }
    const allowed = new Set(effectiveRunsLineIds);
    return {
      ...overviewStatsRaw,
      lines: overviewStatsRaw.lines.filter((row) => allowed.has(row.production_line_id)),
      outliers: overviewStatsRaw.outliers.filter((row) => allowed.has(row.production_line_id)),
    };
  }, [overviewStatsRaw, effectiveRunsLineIds, linesForFactory]);

  const effectiveActivityLineIds = useMemo(() => {
    if (linesForFactory.length === 0) return [];
    if (isAllProductionLinesSelected(effectiveRunsLineIds, linesForFactory)) return [];
    return effectiveRunsLineIds;
  }, [effectiveRunsLineIds, linesForFactory]);

  const activityFormulaQueryIds = useMemo(
    () => activityFormulaIdsForQuery(activityFormulaIds),
    [activityFormulaIds],
  );

  const skipActivityStatsQuery =
    isNoActivityRecipesSelected(activityFormulaIds) ||
    (linesForFactory.length > 0 &&
      !isAllProductionLinesSelected(effectiveRunsLineIds, linesForFactory) &&
      effectiveRunsLineIds.length === 0);

  const activityStatsQueryArgs = useMemo(() => {
    const allStatusesSelected = isDefaultBatchStatusFilter(batchStatusFilter);
    const formulaIds = activityFormulaQueryIds;
    return {
      factory_id: factoryId ?? undefined,
      production_line_ids: effectiveActivityLineIds.length ? effectiveActivityLineIds : undefined,
      formula_ids: formulaIds,
      statuses: allStatusesSelected ? undefined : batchStatusFilter.join(','),
    };
  }, [factoryId, effectiveActivityLineIds, activityFormulaQueryIds, batchStatusFilter]);

  const {
    data: activityStats,
    isLoading: loadingActivityStats,
    isError: activityStatsError,
    isFetching: fetchingActivityStats,
  } = useGetProductionBatchActivityQuery(activityStatsQueryArgs, {
    refetchOnMountOrArgChange: true,
    skip: skipActivityStatsQuery,
  });

  const activityHeatmapItemsFromApi = useMemo(
    () => activityStats?.days.map((d) => ({ date: d.date, count: d.count })) ?? [],
    [activityStats],
  );

  const activityHeatmapFallbackItems = useMemo(() => {
    if (isNoActivityRecipesSelected(activityFormulaIds)) return [];
    const allStatusesSelected = isDefaultBatchStatusFilter(batchStatusFilter);
    return buildActivityHeatmapItemsFromBatches(batches, {
      lineIds: effectiveActivityLineIds.length ? effectiveActivityLineIds : undefined,
      formulaIds: activityFormulaQueryIds,
      statuses: allStatusesSelected ? undefined : [...batchStatusFilter],
    });
  }, [batches, effectiveActivityLineIds, activityFormulaIds, activityFormulaQueryIds, batchStatusFilter]);

  const activityHeatmapItems = useMemo(() => {
    if (isNoActivityRecipesSelected(activityFormulaIds)) return [];
    if (activityStats && !activityStatsError) return activityHeatmapItemsFromApi;
    if (activityStatsError && activityHeatmapFallbackItems.length > 0) {
      return activityHeatmapFallbackItems;
    }
    if (!fetchingActivityStats && !activityStats && activityHeatmapFallbackItems.length > 0) {
      return activityHeatmapFallbackItems;
    }
    return activityHeatmapItemsFromApi;
  }, [
    activityStats,
    activityStatsError,
    activityHeatmapItemsFromApi,
    activityHeatmapFallbackItems,
    fetchingActivityStats,
  ]);

  const activityFilterSummary = useMemo(
    () =>
      productionActivityFilterSummary(
        linesForFactory,
        setupFormulas,
        effectiveActivityLineIds,
        activityFormulaIds,
        productionFilterCopy(t),
      ),
    [linesForFactory, setupFormulas, effectiveActivityLineIds, activityFormulaIds, t],
  );

  const factoryLocationValue = useMemo(() => singleFactoryToSlice(factoryId), [factoryId]);

  const handleFactoryLocationChange = (slice: Partial<MachinesLocationFilterSlice>) => {
    if (slice.factory_ids === undefined) return;
    setFactoryId(sliceToSingleFactoryId({ factory_ids: slice.factory_ids }));
    setFactoryPickerOpen(false);
  };

  const headerBatchStatusViewMode = activeTab === 'batches' ? runsDateViewMode : 'all';

  const handleBatchStatusFilterApply = useCallback(
    (filter: ProductionBatchStatus[], showCompleted: boolean) => {
      setBatchStatusFilter(filter);
      setShowCompletedBatches(showCompleted);
    },
    [setBatchStatusFilter, setShowCompletedBatches],
  );

  const batchSearchHeaderControl = (
    <ProductionBatchSearchBar
      searchQuery={batchSearchQuery}
      onSearchQueryChange={setBatchSearchQuery}
      className="min-w-[8.5rem] w-[min(11rem,22vw)] max-w-[220px] shrink"
    />
  );

  const productionHeaderFiltersControl = (
    <ProductionHeaderFilters
      activeTab={activeTab}
      lines={linesForFactory}
      selectedLineIds={effectiveRunsLineIds}
      onSelectedLineIdsChange={handleRunsLineIdsChange}
      batchDateFrom={batchDateFrom}
      batchDateTo={batchDateTo}
      onBatchDateRangeApply={setBatchDateRange}
      batchStatusFilter={batchStatusFilter}
      batchStatusViewMode={headerBatchStatusViewMode}
      showCompletedBatches={showCompletedBatches}
      onBatchStatusFilterApply={handleBatchStatusFilterApply}
      activityFormulaIds={activityFormulaIds}
      onActivityFormulaIdsChange={setActivityFormulaIds}
      formulas={formulas}
      runsMachine={runsMachine}
      onRunsMachineChange={setRunsMachine}
      machines={factoryMachines}
      factories={factories}
      sections={factorySections}
      factoryFilter={factoryId != null ? String(factoryId) : 'all'}
    />
  );

  const getItemName = (itemId: number) => items.find((i) => i.id === itemId)?.name ?? `Item #${itemId}`;
  const getMachineName = (machineId: number) =>
    factoryMachines.find((m) => m.id === machineId)?.name ?? `Machine #${machineId}`;
  const getLineName = (lineId: number) =>
    linesForFactory.find((l) => l.id === lineId)?.name ?? `Line #${lineId}`;

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      recurring: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
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
      appToast.success(t('lineDeactivated'));
      setLineActionTarget(null);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedDeactivate'));
    }
  };

  const handleDeactivateFormula = async (formula: ProductionFormula) => {
    if (
      !window.confirm(
        `Deactivate "${formula.name}"? It will be hidden from Setup and new batches. Existing batch history is kept.`,
      )
    ) {
      return;
    }
    try {
      await deleteFormula(formula.id).unwrap();
      appToast.success(t('recipeDeactivated'));
      setFormulaActionTarget(null);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedDeactivateRecipe'));
    }
  };

  const handleSaveLineDetail = async (payload: {
    name: string;
    description: string;
    machineIds: number[];
  }) => {
    if (!lineActionTarget) return;
    try {
      await updateLine({
        id: lineActionTarget.id,
        data: {
          name: payload.name,
          description: payload.description || undefined,
          machine_ids: payload.machineIds,
        },
      }).unwrap();
      appToast.success(t('lineUpdated'));
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedUpdateLine'));
    }
  };

  const handleSaveFormulaFromPopup = async () => {
    if (!formulaActionTarget) return;
    if (!formulaDraftName.trim()) {
      appToast.error(t('formulaNameRequired'));
      return;
    }
    if (!formulaDraftCode.trim()) {
      appToast.error(t('formulaCodeRequired'));
      return;
    }
    const duplicate = formulas.find(
      (f) =>
        f.id !== formulaActionTarget.id &&
        (f.formula_code.toLowerCase() === formulaDraftCode.trim().toLowerCase() ||
          f.name.toLowerCase() === formulaDraftName.trim().toLowerCase())
    );
    if (duplicate) {
      appToast.error(t('formulaCodeOrNameExists'));
      return;
    }
    try {
      await updateFormula({
        id: formulaActionTarget.id,
        data: {
          name: formulaDraftName.trim(),
          description: formulaDraftDescription.trim() || undefined,
        },
      }).unwrap();
      appToast.success(t('formulaUpdated'));
      setIsFormulaEditMode(false);
      setFormulaActionTarget((prev) =>
        prev
          ? {
              ...prev,
              formula_code: formulaDraftCode.trim(),
              name: formulaDraftName.trim(),
              description: formulaDraftDescription.trim() || null,
            }
          : prev
      );
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedUpdateFormula'));
    }
  };

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">{t('noFactoriesTitle')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            {t('noFactoriesBody')}
          </p>
          <Button 
            size="lg" 
            className="bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all"
            onClick={() => setIsAddFactoryOpen(true)}
          >
            {t('createFirstFactory')}
          </Button>

          <AddFactoryDialog
            open={isAddFactoryOpen}
            onOpenChange={setIsAddFactoryOpen}
            factories={factories}
          />
      </div>
    );
  }

  return (
    <>
      <EmphasisTabsProvider value={activeTab} layoutId="production-page-tabs">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ProductionPageTab)}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        >
          <AppShellHeaderCompactList
            sticky
            icon={FlaskConical}
            title={t('title')}
            headerNav={<ProductionPageHeaderTabList />}
            headerNavMobile={<ProductionPageHeaderTabList compact />}
            leftExtras={
              <>
                <MachinesInlineLocationFilters
                  which="factories"
                  variant="toolbar"
                  selectionMode="single"
                  showAllFactoriesOption
                  value={factoryLocationValue}
                  onChange={handleFactoryLocationChange}
                  factories={factories}
                  sections={[]}
                  open={factoryPickerOpen}
                  onOpenChange={setFactoryPickerOpen}
                  highlight={factoryPickerHighlight}
                  onHighlightDismiss={dismissFactoryPickerHighlight}
                />
              </>
            }
            desktopActions={
              activeTab === 'batches' ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {productionHeaderFiltersControl}
                  {batchSearchHeaderControl}
                  {runsHeaderControls}
                </div>
              ) : activeTab === 'setup' ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {productionHeaderFiltersControl}
                  <ProductionSetupSearchBar
                    searchQuery={setupSearchQuery}
                    onSearchQueryChange={setSetupSearchQuery}
                    className="min-w-[8.5rem] w-[min(11rem,22vw)] max-w-[220px] shrink"
                  />
                </div>
              ) : activeTab === 'overview' ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {productionHeaderFiltersControl}
                  {batchSearchHeaderControl}
                </div>
              ) : null
            }
            mobileActions={
              activeTab === 'setup' ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {productionHeaderFiltersControl}
                  <ProductionSetupSearchBar
                    searchQuery={setupSearchQuery}
                    onSearchQueryChange={setSetupSearchQuery}
                    className="w-[min(10rem,42vw)] max-w-[200px] shrink"
                  />
                </div>
              ) : activeTab === 'overview' || activeTab === 'batches' ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {productionHeaderFiltersControl}
                  {batchSearchHeaderControl}
                </div>
              ) : null
            }
            addAriaLabel={t('startNewRunAria')}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <TabsContent
              value="overview"
              className="mt-0 min-h-0 flex-1 overflow-y-auto p-6 data-[state=inactive]:hidden"
            >
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <Card className="border-border xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">{t('batchesByStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <BatchStatusPieChart batches={filteredBatches} />
              </CardContent>
            </Card>

            <Card className="border-border xl:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">{t('avgEfficiency')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('average')}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {metrics.avgEfficiency != null ? `${metrics.avgEfficiency.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-emerald-500/25 bg-emerald-500/[0.08] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      {t('aboveTarget')}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{metrics.aboveTargetCount}</p>
                  </div>
                  <div className="rounded-md border border-amber-500/25 bg-amber-500/[0.08] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      {t('belowTarget')}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{metrics.belowTargetCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border xl:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle className="text-base">{t('batchActivity')}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{activityFilterSummary}</p>
                </div>
              </CardHeader>
              <CardContent>
                {loadingActivityStats && activityHeatmapItems.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityStatsError ? (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        {t('activityLoadFailed')}
                        {activityHeatmapFallbackItems.length > 0
                          ? t('activityFallback')
                          : '.'}
                      </p>
                    ) : null}
                    <ContributionHeatmap items={activityHeatmapItems} itemLabel={t('heatmapItem')} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

              <ProductionOverviewByLine
                className="mt-6"
                stats={overviewStats}
                loading={loadingOverviewStats}
              />
            </TabsContent>

            <TabsContent
              value="setup"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden p-6 data-[state=inactive]:hidden"
            >
              <ProductionSetupPanel
                factoryId={factoryId}
                lines={filteredLines}
                formulas={setupFormulas}
                loadingLines={loadingLines}
                linesError={linesError}
                loadingFormulas={loadingFormulas}
                formulasError={formulasError}
                items={items}
                getItemName={getItemName}
                onAddStation={() => setIsAddLineOpen(true)}
                onSelectStation={setLineActionTarget}
                onAddRecipe={() => {
                  if (!requireFactory()) return;
                  setIsAddFormulaOpen(true);
                }}
                showFactoryScopeAll={factoryId == null}
                factoryNameById={factoryNameById}
                onEditRecipe={(formulaId) => {
                  const formula = formulas.find((f) => f.id === formulaId);
                  if (formula) setEditingFormula(formula);
                }}
                onDeleteRecipe={(formulaId) => {
                  const target =
                    setupFormulas.find((f) => f.id === formulaId) ??
                    formulas.find((f) => f.id === formulaId);
                  if (target) void handleDeactivateFormula(target);
                }}
                isDeletingRecipe={isDeletingFormula}
                focusFormulaId={setupFocusFormulaId}
                onFocusFormulaHandled={handleSetupFocusFormulaHandled}
              />
            </TabsContent>

            <TabsContent
              value="batches"
              className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0 data-[state=inactive]:hidden"
            >
              <ProductionRunsTab
                factoryId={factoryId}
                showFactoryScopeAll={factoryId == null}
                factoryNameById={factoryNameById}
                lines={runsLinesForGrid}
                batches={batchesForRunsTab}
                scheduleFilterBatches={batchesForScheduleEligibility}
                formulas={formulas}
                getItemName={getItemName}
                getStatusBadge={getStatusBadge}
                isLgScreen={isLgScreen}
                onNewRun={openRunsNewRun}
                onNewRecurring={openRunsRecurring}
                onHeaderControls={setRunsHeaderControls}
                allLines={linesForFactory}
                selectedLineIds={effectiveRunsLineIds}
                weekBatchGrid={runsWeekBatchGrid}
                onWeekBatchGridChange={setRunsWeekBatchGrid}
                dateViewMode={runsDateViewMode}
                weekAnchorIso={runsWeekAnchorIso}
                dayIso={runsDayIso}
                onDateViewModeChange={setRunsDateViewMode}
                onPickWeek={pickRunsWeek}
                onPickDay={pickRunsDay}
                onOpenDay={openRunsDay}
                selectedBatchId={selectedBatchId}
                onSelectedBatchChange={setSelectedBatchId}
                renderDetail={(batchId, close) => (
                  <>
                    <BatchDetailPanel
                      batchId={batchId}
                      lines={linesForFactory}
                      factoryScheduleBatches={factoryScheduleBatches}
                      onSchedulePlannedStartChange={handleSchedulePlannedStartChange}
                      formulas={formulas}
                      getItemName={getItemName}
                      getMachineName={getMachineName}
                      getStatusBadge={getStatusBadge}
                      onClose={close}
                      onRequestStart={() => setStartBatchId(batchId)}
                      onComplete={(b) => setCompletingBatch(b)}
                      onCancel={(b) => setCancellingBatch(b)}
                      onDeleted={() => {
                        close();
                        setStartBatchId(null);
                      }}
                      updateProductionBatch={updateProductionBatch}
                      isUpdatingBatch={isUpdatingBatch}
                      deleteProductionBatch={deleteProductionBatch}
                      isDeletingBatch={isDeletingBatch}
                    />
                    <BatchActivityPanel
                      batchId={batchId}
                      displayContext={{ getItemName, getMachineName, getLineName }}
                    />
                  </>
                )}
              />
            </TabsContent>
          </div>
        </Tabs>
      </EmphasisTabsProvider>

      <ProductionLineDetailDialog
        line={lineActionTarget}
        open={!!lineActionTarget}
        onOpenChange={(open) => {
          if (!open) setLineActionTarget(null);
        }}
        factoryId={factoryId}
        factoryMachineOptions={factoryMachineOptions}
        onSave={handleSaveLineDetail}
        onDeactivate={handleDeactivateLine}
        isSaving={isUpdatingLine}
        isDeleting={isDeletingLine}
      />

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
              {formulaActionTarget ? `${formulaActionTarget.name} (${formulaActionTarget.formula_code})` : t('formulaFallback')}
            </DialogTitle>
            <DialogDescription>
              {t('manageFormula')}
            </DialogDescription>
          </DialogHeader>
          {isFormulaEditMode ? (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>{t('formulaCode')}</Label>
                <Input value={formulaDraftCode} disabled />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('name')}</Label>
                <Input value={formulaDraftName} onChange={(e) => setFormulaDraftName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>{t('description')}</Label>
                <Textarea
                  value={formulaDraftDescription}
                  onChange={(e) => setFormulaDraftDescription(e.target.value)}
                  rows={3}
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
                  {t('noDescription')}
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
                  setIsFormulaEditMode(true);
                } else {
                  setIsFormulaEditMode(false);
                }
              }}
            >
              {isFormulaEditMode ? t('cancelEdit') : t('edit')}
            </Button>
            {isFormulaEditMode ? (
              <Button onClick={handleSaveFormulaFromPopup} disabled={isUpdatingFormula}>
                {isUpdatingFormula ? tc('saving') : t('save')}
              </Button>
            ) : null}
            <Button
              variant="destructive"
              onClick={() => formulaActionTarget && handleDeactivateFormula(formulaActionTarget)}
              disabled={isDeletingFormula}
            >
              {isDeletingFormula ? t('deactivating') : t('deactivateFormula')}
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
        factoryMachines={factoryMachineOptions}
        isCreating={isCreatingLine}
        isUpdating={isUpdatingLine}
        onSuccess={() => {
          setIsAddLineOpen(false);
        }}
      />

      {/* Add/Edit Formula Dialog */}
      <AddEditFormulaDialog
        open={isAddFormulaOpen || !!editingFormula}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddFormulaOpen(false);
            setEditingFormula(null);
            setCreateRecipeRouteId(null);
          }
        }}
        formula={editingFormula}
        formulas={formulas}
        factoryId={factoryId}
        createFormula={createFormula}
        copyFormula={copyFormula}
        updateFormula={updateFormula}
        isCreating={isCreatingFormula}
        isCopying={isCopyingFormula}
        isUpdating={isUpdatingFormula}
        onSuccess={(createdFormulaId) => {
          setIsAddFormulaOpen(false);
          setEditingFormula(null);
          setCreateRecipeRouteId(null);
          if (createdFormulaId != null) {
            setSetupFocusFormulaId(createdFormulaId);
          }
        }}
      />

      {/* Add Batch Dialog */}
      <AddBatchDialog
        open={isAddBatchOpen}
        onOpenChange={(open) => {
          setIsAddBatchOpen(open);
          if (!open) {
            setScheduleCreateSeed(null);
            setAddBatchInitialMode('recipe');
          }
        }}
        scheduleCreateSeed={scheduleCreateSeed}
        initialMode={addBatchInitialMode}
        lines={linesForFactory}
        formulas={formulas}
        factoryId={factoryId}
        items={items}
        createBatch={createBatch}
        isCreating={isCreatingBatch}
        onSuccess={(batchId) => {
          const fromSchedule = scheduleCreateSeed != null;
          setIsAddBatchOpen(false);
          setScheduleCreateSeed(null);
          if (!fromSchedule) {
            setSelectedBatchId(batchId);
          }
        }}
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

    </>
  );
};

// ─── Add/Edit Line Dialog ─────────────────────────────────────────────

interface AddEditLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factories: { id: number; name: string }[];
  factoryId: number | null;
  line: ProductionLine | null;
  factoryMachines: { id: number; name: string; is_running?: boolean }[];
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
  factoryMachines,
  createLine,
  updateLine,
  isCreating,
  isUpdating,
  onSuccess,
}) => {
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
  const [name, setName] = useState(line?.name ?? '');
  const [description, setDescription] = useState(line?.description ?? '');
  const [machineIds, setMachineIds] = useState<number[]>(line ? lineMachineIds(line) : []);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(
    (line?.factory_id ?? factoryId ?? factories[0]?.id)?.toString() ?? ''
  );

  React.useEffect(() => {
    if (open) {
      setName(line?.name ?? '');
      setDescription(line?.description ?? '');
      setMachineIds(line ? lineMachineIds(line) : []);
      setSelectedFactoryId(
        (line?.factory_id ?? factoryId ?? factories[0]?.id)?.toString() ?? ''
      );
    }
  }, [open, line, factoryId, factories]);

  const effectiveFactoryId =
    line?.factory_id ??
    (Number.parseInt(selectedFactoryId, 10) || factoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      appToast.error(t('nameRequired'));
      return;
    }
    const fid = parseInt(selectedFactoryId, 10);
    if (!fid) {
      appToast.error(t('factoryRequired'));
      return;
    }
    try {
      if (line) {
        await updateLine({
          id: line.id,
          data: { name: name.trim(), description: description.trim() || undefined, machine_ids: machineIds },
        }).unwrap();
        appToast.success(t('lineUpdated'));
      } else {
        await createLine({
          factory_id: fid,
          name: name.trim(),
          description: description.trim() || undefined,
          machine_ids: machineIds,
        }).unwrap();
        appToast.success(t('lineCreated'));
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedSave'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(32rem,94vw)] max-w-none flex-col overflow-hidden sm:max-w-none">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{line ? t('editLine') : t('addLine')}</DialogTitle>
            <DialogDescription>
              {line ? t('editLineHint') : t('addLineHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
            {!line && (
              <div className="grid gap-2">
                <Label>{t('factory')}</Label>
                <Select value={selectedFactoryId} onValueChange={setSelectedFactoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectFactory')} />
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
              <Label>{t('name')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('lineNamePh')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('descriptionOptional')}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('briefDescription')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('machines')}</Label>
              <ProductionLineMachinesSelector
                factoryId={effectiveFactoryId}
                machines={factoryMachines}
                selectedIds={machineIds}
                onChange={setMachineIds}
              />
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {line ? t('update') : t('create')}
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
  factoryId: number | null;
  createFormula: ReturnType<typeof useCreateProductionFormulaMutation>[0];
  copyFormula: ReturnType<typeof useCopyProductionFormulaMutation>[0];
  updateFormula: ReturnType<typeof useUpdateProductionFormulaMutation>[0];
  isCreating: boolean;
  isCopying: boolean;
  isUpdating: boolean;
  onSuccess: (createdFormulaId?: number) => void;
}

const AddEditFormulaDialog: React.FC<AddEditFormulaDialogProps> = ({
  open,
  onOpenChange,
  formula,
  formulas,
  factoryId,
  createFormula,
  copyFormula,
  updateFormula,
  isCreating,
  isCopying,
  isUpdating,
  onSuccess,
}) => {
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
  const [formulaCode, setFormulaCode] = useState(formula?.formula_code ?? '');
  const [name, setName] = useState(formula?.name ?? '');
  const [description, setDescription] = useState(formula?.description ?? '');
  const [copyFromId, setCopyFromId] = useState('__none__');

  React.useEffect(() => {
    if (open) {
      setFormulaCode(formula?.formula_code ?? '');
      setName(formula?.name ?? '');
      setDescription(formula?.description ?? '');
      setCopyFromId('__none__');
    }
  }, [open, formula]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      appToast.error(t('nameRequired'));
      return;
    }
    if (!formulaCode.trim()) {
      appToast.error(t('formulaCodeRequired'));
      return;
    }
    const dup = formulas.find(
      (f) =>
        f.id !== formula?.id &&
        (f.formula_code.toLowerCase() === formulaCode.trim().toLowerCase() ||
          f.name.toLowerCase() === name.trim().toLowerCase())
    );
    if (dup) {
      appToast.error(t('formulaDuplicate'));
      return;
    }
    try {
      if (formula) {
        await updateFormula({
          id: formula.id,
          data: {
            name: name.trim(),
            description: description.trim() || undefined,
          },
        }).unwrap();
        appToast.success(t('formulaUpdated'));
      } else {
        if (!factoryId) {
          appToast.error(t('selectFactoryFirst'));
          return;
        }
        const created =
          copyFromId !== '__none__'
            ? await copyFormula({
                sourceFormulaId: Number(copyFromId),
                data: {
                  formula_code: formulaCode.trim(),
                  name: name.trim(),
                  factory_id: factoryId,
                  description: description.trim() || undefined,
                },
              }).unwrap()
            : await createFormula({
                formula_code: formulaCode.trim(),
                name: name.trim(),
                description: description.trim() || undefined,
                factory_id: factoryId,
              }).unwrap();
        appToast.success(t('recipeCreated'));
        onSuccess(created.id);
        onOpenChange(false);
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedSave'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{formula ? t('editProductRecipe') : t('addProductRecipe')}</DialogTitle>
            <DialogDescription>
              {formula ? t('editRecipeHint') : t('addRecipeDialogHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('formulaCodeLabel')}</Label>
              <Input
                value={formulaCode}
                onChange={(e) => setFormulaCode(e.target.value)}
                placeholder={t('formulaCodePh')}
                disabled={!!formula}
              />
            </div>
            {!formula ? (
              <div className="grid gap-2">
                <Label>{t('copyFrom')}</Label>
                <Select value={copyFromId} onValueChange={setCopyFromId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('blankRecipe')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('blankRecipe')}</SelectItem>
                    {formulas.filter((f) => f.is_active).map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name} ({f.formula_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label>{t('name')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('recipeNamePh')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('descriptionOptional')}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('briefDescription')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isCreating || isCopying || isUpdating}>
              {(isCreating || isCopying || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formula ? t('update') : t('create')}
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
  const { t } = useTranslation('production');
  const byStatus = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of batches) {
      map[b.status] = (map[b.status] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({
      name: productionStatusLabel(name, t),
      value,
    }));
  }, [batches, t]);

  if (byStatus.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{t('noBatchData')}</p>;
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

// ─── Add Batch Dialog ────────────────────────────────────────────────

/** RTK `data = []` defaults are a new array every render — breaks useEffect dependency equality. */
const EMPTY_QUERY_LIST: never[] = [];

interface AddBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleCreateSeed?: ScheduleBatchCreateSeed | null;
  initialMode?: 'recipe' | 'recurring';
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  factoryId: number | null;
  items: { id: number; name: string }[];
  createBatch: ReturnType<typeof useCreateProductionBatchMutation>[0];
  isCreating: boolean;
  onSuccess: (batchId: number) => void;
}

const AddBatchDialog: React.FC<AddBatchDialogProps> = ({
  open,
  onOpenChange,
  scheduleCreateSeed,
  initialMode = 'recipe',
  lines,
  formulas,
  factoryId,
  items,
  createBatch,
  isCreating,
  onSuccess,
}) => {
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
  const millTimezone = useMillTimezone();
  const [batchMode, setBatchMode] = useState<'recipe' | 'simple' | 'recurring'>('recipe');
  const [lineId, setLineId] = useState('');
  const [formulaId, setFormulaId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [expectedOutput, setExpectedOutput] = useState('');
  const { data: workspaceShifts = [] } = useGetWorkspaceShiftsQuery(
    { activeOnly: true },
    { skip: !open },
  );
  const [notes, setNotes] = useState('');
  const [plannedStart, setPlannedStart] = useState('');
  const [recurrenceCadence, setRecurrenceCadence] =
    useState<ProductionRunRecurrenceCadence>(DEFAULT_RECURRENCE_CADENCE);
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [createProgram, { isLoading: isCreatingProgram }] = useCreateProductionBatchProgramMutation();
  const [salesOrderId, setSalesOrderId] = useState('');
  const [salesItemId, setSalesItemId] = useState('');
  const [overlapConflicts, setOverlapConflicts] = useState<ProductionScheduleConflict[]>([]);
  const activeFormulas = useMemo(() => formulas.filter((f) => f.is_active), [formulas]);
  const usesRecipe = batchMode === 'recipe' || batchMode === 'recurring';
  const selectedFormulaId =
    usesRecipe && formulaId ? parseInt(formulaId, 10) : null;
  const parsedExpectedOutput = parseProductionQuantity(expectedOutput);
  const { data: formulaStagesRaw } = useGetFormulaStagesQuery(selectedFormulaId ?? 0, {
    skip: !selectedFormulaId,
  });
  const formulaStages = formulaStagesRaw ?? EMPTY_QUERY_LIST;
  const selectedFormula = formulas.find((f) => f.id === selectedFormulaId) ?? null;
  const { data: routeStepsRaw } = useGetProductionRouteStepsQuery(selectedFormula?.route_id ?? 0, {
    skip: !selectedFormula?.route_id,
  });
  const routeSteps = routeStepsRaw ?? EMPTY_QUERY_LIST;
  const { data: formulaStageItemsRaw } = useGetAllFormulaStageItemsQuery(selectedFormulaId ?? 0, {
    skip: !selectedFormulaId,
  });
  const formulaStageItems = formulaStageItemsRaw ?? EMPTY_QUERY_LIST;
  const { data: formulaStageParametersRaw } = useGetAllFormulaStageParametersQuery(
    selectedFormulaId ?? 0,
    { skip: !selectedFormulaId },
  );
  const formulaStageParameters = formulaStageParametersRaw ?? EMPTY_QUERY_LIST;
  const [stageDrafts, setStageDrafts] = useState<
    Record<number, { include: boolean; lineId: string; minutes: string; machineId: string }>
  >({});
  const [itemQtyDrafts, setItemQtyDrafts] = useState<Record<number, string>>({});
  const [conditionPlannedDrafts, setConditionPlannedDrafts] = useState<Record<number, string>>({});
  const [selectedPathStageId, setSelectedPathStageId] = useState<number | null>(null);
  const [recipeMoreOpen, setRecipeMoreOpen] = useState(false);
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);
  const [runMachineId, setRunMachineId] = useState<number | null>(null);
  const { data: salesOrders = [] } = useGetSalesOrdersQuery({ limit: 100 }, { skip: !open });
  const { data: salesItems = [] } = useGetSalesOrderItemsQuery(Number(salesOrderId), { skip: !salesOrderId });
  const plannedDate = plannedStart ? new Date(plannedStart) : null;
  const { data: scheduleBatches = [] } = useGetProductionScheduleQuery(
    {
      factory_id: factoryId ?? 0,
      start: plannedDate ? new Date(plannedDate.getTime() - 7 * 86_400_000).toISOString() : '',
      end: plannedDate ? new Date(plannedDate.getTime() + 14 * 86_400_000).toISOString() : '',
    },
    { skip: !factoryId || !plannedDate || Number.isNaN(plannedDate.getTime()) },
  );

  const formulaDefaultOutput = useMemo(() => {
    if (!selectedFormulaId || formulaStages.length === 0) return 0;
    return finishedGoodOutputQuantity(formulaStages, formulaStageItems);
  }, [selectedFormulaId, formulaStages, formulaStageItems]);

  const recipeMaterialScale = useMemo(() => {
    const baseOutput = formulaDefaultOutput;
    const targetOutput =
      parsedExpectedOutput != null && parsedExpectedOutput > 0
        ? parsedExpectedOutput
        : baseOutput;
    if (baseOutput <= 0 || targetOutput <= 0) {
      return { multiplier: 1, baseOutput, targetOutput: baseOutput };
    }
    return {
      multiplier: targetOutput / baseOutput,
      baseOutput,
      targetOutput,
    };
  }, [formulaDefaultOutput, parsedExpectedOutput]);

  const lastStepOutputItemIds = useMemo(
    () => finishedGoodOutputItemIds(formulaStages, formulaStageItems),
    [formulaStages, formulaStageItems],
  );

  React.useEffect(() => {
    if (!open) return;
    setBatchMode(initialMode);
    setFormulaId('');
    setSelectedShiftId(null);
    setExpectedOutput('');
    setNotes('');
    setSalesOrderId('');
    setSalesItemId('');
    setOverlapConflicts([]);
    setStageDrafts({});
    setItemQtyDrafts({});
    setConditionPlannedDrafts({});
    setSelectedPathStageId(null);
    setRecipeMoreOpen(false);
    setRecipePickerOpen(false);
    setRunMachineId(null);
    setRecurrenceCadence('daily');
    setRecurrenceEnd('');
    if (scheduleCreateSeed) {
      setLineId('');
      setPlannedStart(plannedStartLocalAtEight(scheduleCreateSeed.day));
    } else {
      setLineId('');
      setPlannedStart('');
    }
  }, [open, scheduleCreateSeed?.day.getTime(), initialMode]);

  React.useEffect(() => {
    if (!open || !usesRecipe) return;
    if (formulaId) return;
    if (activeFormulas.length === 1) {
      setFormulaId(String(activeFormulas[0].id));
    }
  }, [open, usesRecipe, formulaId, activeFormulas]);

  React.useEffect(() => {
    if (!selectedFormulaId || formulaStages.length === 0) {
      setStageDrafts((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const next = buildStageDraftDefaults(formulaStages, routeSteps);
    setStageDrafts((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => {
          const id = Number(key);
          const a = prev[id];
          const b = next[id];
          return (
            a &&
            b &&
            a.include === b.include &&
            a.lineId === b.lineId &&
            a.minutes === b.minutes &&
            a.machineId === b.machineId
          );
        })
      ) {
        return prev;
      }
      return next;
    });
  }, [selectedFormulaId, formulaStages, routeSteps]);

  const includedFormulaStages = useMemo(
    () =>
      formulaStages.filter((stage) => stageDrafts[stage.id]?.include !== false),
    [formulaStages, stageDrafts],
  );
  const includedStageCount = includedFormulaStages.length;
  const showRailMachine =
    batchMode === 'simple' || (usesRecipe && includedStageCount === 1);
  const showStepMachine = usesRecipe && includedStageCount >= 2;

  const railMachineLine = useMemo(() => {
    if (batchMode === 'simple') {
      const id = parseInt(lineId, 10);
      if (Number.isNaN(id)) return undefined;
      return lines.find((l) => l.id === id);
    }
    if (usesRecipe && includedStageCount === 1) {
      const stage = includedFormulaStages[0];
      const draft = stageDrafts[stage.id];
      const lid =
        draft?.lineId && draft.lineId !== ''
          ? Number(draft.lineId)
          : stage.production_line_id ?? undefined;
      return lines.find((l) => l.id === lid);
    }
    return undefined;
  }, [batchMode, usesRecipe, lineId, lines, includedStageCount, includedFormulaStages, stageDrafts]);

  React.useEffect(() => {
    if (!selectedFormulaId || formulaStages.length === 0) {
      setSelectedPathStageId(null);
      return;
    }
    const sorted = [...formulaStages].sort((a, b) => a.stage_order - b.stage_order);
    const included = sorted.filter((stage) => stageDrafts[stage.id]?.include !== false);
    setSelectedPathStageId((prev) => {
      if (prev != null && included.some((stage) => stage.id === prev)) return prev;
      return included[0]?.id ?? null;
    });
  }, [selectedFormulaId, formulaStages, stageDrafts]);

  const selectedPathStage = useMemo(
    () => formulaStages.find((stage) => stage.id === selectedPathStageId) ?? null,
    [formulaStages, selectedPathStageId],
  );
  const selectedPathStageDraft =
    selectedPathStageId != null ? stageDrafts[selectedPathStageId] ?? null : null;

  React.useEffect(() => {
    if (!selectedFormulaId || formulaStageItems.length === 0) {
      setItemQtyDrafts((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const outputTotal = finishedGoodOutputQuantity(formulaStages, formulaStageItems);
    const target =
      parsedExpectedOutput != null && parsedExpectedOutput > 0
        ? parsedExpectedOutput
        : outputTotal > 0
          ? outputTotal
          : null;
    const multiplier = target != null && outputTotal > 0 ? target / outputTotal : 1;
    const next: Record<number, string> = {};
    for (const row of formulaStageItems) {
      next[row.id] = String(Math.max(0, Math.round(row.quantity * multiplier * 100) / 100));
    }
    setItemQtyDrafts((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[Number(key)] === next[Number(key)])
      ) {
        return prev;
      }
      return next;
    });
  }, [selectedFormulaId, formulaStages, formulaStageItems, expectedOutput]);

  React.useEffect(() => {
    if (!selectedFormulaId || formulaStageParameters.length === 0) {
      setConditionPlannedDrafts((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }
    const next: Record<number, string> = {};
    for (const row of formulaStageParameters) {
      next[row.id] = row.planned_value;
    }
    setConditionPlannedDrafts((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[Number(key)] === next[Number(key)])
      ) {
        return prev;
      }
      return next;
    });
  }, [selectedFormulaId, formulaStageParameters]);

  const resolveBatchProductionLineId = (): number | null => {
    if (batchMode === 'simple') {
      const simpleLine = parseInt(lineId, 10);
      return Number.isFinite(simpleLine) && simpleLine > 0 ? simpleLine : null;
    }
    if (selectedFormulaId && formulaStages.length > 0) {
      const sorted = [...formulaStages].sort((a, b) => a.stage_order - b.stage_order);
      for (const stage of sorted) {
        const draft = stageDrafts[stage.id];
        if (draft && !draft.include) continue;
        if (draft?.lineId) {
          const override = Number(draft.lineId);
          if (Number.isFinite(override) && override > 0) return override;
        }
        const step =
          routeSteps.find((row) => row.id === stage.route_step_id) ??
          routeSteps.find((row) => row.step_order === stage.stage_order);
        const defaultLine = step?.production_line_id ?? stage.production_line_id;
        if (defaultLine != null) return defaultLine;
      }
    }
    const fallback = parseInt(lineId, 10);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
  };

  const buildNewBatchScheduleSteps = () => {
    const lid = resolveBatchProductionLineId();
    if (!plannedStart.trim() || !lid) return [];
    return (formulaStages.length ? formulaStages : [null])
      .map((stage) => {
        const draft = stage ? stageDrafts[stage.id] : undefined;
        const stepLineId =
          draft?.lineId && draft.lineId !== ''
            ? Number(draft.lineId)
            : stage?.production_line_id ?? lid;
        const minutes =
          draft && draft.minutes?.trim() !== ''
            ? Number(draft.minutes)
            : stage?.expected_duration_minutes ?? 0;
        if (stage && draft && !draft.include) {
          return null;
        }
        const stepLine = lines.find((line) => line.id === stepLineId);
        let machineId: number | null = null;
        if (showStepMachine && stage && draft?.machineId?.trim()) {
          const parsed = Number(draft.machineId);
          machineId = Number.isNaN(parsed) ? null : parsed;
        } else if (showRailMachine) {
          machineId = runMachineId;
        }
        if (machineId == null) {
          machineId = resolveLineMachineIdForSchedule(stepLine, null);
        }
        return {
          productionLineId: stepLineId,
          machineId,
          expectedMinutes: Number.isNaN(minutes) ? 0 : minutes,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  };

  const newBatchPlannedWindows = useMemo(() => {
    const steps = buildNewBatchScheduleSteps();
    if (steps.length === 0) return [];
    const startIso = new Date(plannedStart).toISOString();
    if (!Number.isFinite(new Date(plannedStart).getTime())) return [];
    return sequentialStepWindows({
      batchId: 0,
      batchNumber: 'New batch',
      plannedStartAt: startIso,
      steps,
    });
  }, [
    plannedStart,
    batchMode,
    formulaStages,
    stageDrafts,
    lineId,
    lines,
    routeSteps,
    runMachineId,
    showRailMachine,
    showStepMachine,
    selectedFormulaId,
  ]);

  const railPlannedWindow = useMemo(() => {
    if (!showRailMachine || newBatchPlannedWindows.length === 0) return null;
    const w = newBatchPlannedWindows[0];
    return { plannedStartAt: w.plannedStartAt, plannedEndAt: w.plannedEndAt };
  }, [showRailMachine, newBatchPlannedWindows]);

  const selectedStepPlannedWindow = useMemo(() => {
    if (!showStepMachine || selectedPathStageId == null || newBatchPlannedWindows.length === 0) {
      return null;
    }
    const sorted = [...formulaStages].sort((a, b) => a.stage_order - b.stage_order);
    const included = sorted.filter((stage) => stageDrafts[stage.id]?.include !== false);
    const idx = included.findIndex((stage) => stage.id === selectedPathStageId);
    if (idx < 0 || idx >= newBatchPlannedWindows.length) return null;
    const w = newBatchPlannedWindows[idx];
    return { plannedStartAt: w.plannedStartAt, plannedEndAt: w.plannedEndAt };
  }, [showStepMachine, selectedPathStageId, formulaStages, stageDrafts, newBatchPlannedWindows]);

  const handleSubmit = async (e?: React.FormEvent, force = false) => {
    e?.preventDefault();
    if (batchMode === 'recurring') {
      if (!selectedFormulaId) {
        appToast.error(t('pickRecipe'));
        return;
      }
      if (factoryId == null) {
        appToast.error(t('pickFactory'));
        return;
      }
      if (!plannedStart.trim()) {
        appToast.error(t('setPlannedStart'));
        return;
      }
      const start = new Date(plannedStart);
      if (Number.isNaN(start.getTime())) {
        appToast.error(t('plannedStartInvalid'));
        return;
      }
      const startDate = plannedStart.slice(0, 10);
      const spanError = validateRecurrenceSpan(startDate, recurrenceEnd);
      if (spanError) {
        appToast.error(spanError);
        return;
      }
      try {
        await createProgram({
          factory_id: factoryId,
          formula_id: selectedFormulaId,
          first_start_at: start.toISOString(),
          cadence: recurrenceCadence.cadence,
          ...(recurrenceCadence.cadence === 'custom'
            ? { interval_days: recurrenceCadence.intervalDays }
            : {}),
          end_date: recurrenceEnd,
        }).unwrap();
        appToast.success(t('recurringCreated'));
        onOpenChange(false);
      } catch (error) {
        appToast.error(apiErrorDetail(error, t('failedCreateProgram')));
      }
      return;
    }
    if (usesRecipe && !selectedFormulaId) {
      appToast.error(t('pickRecipe'));
      return;
    }
    const lid = resolveBatchProductionLineId();
    if (!lid) {
      appToast.error(
        batchMode === 'simple'
          ? 'Production line is required'
          : 'Recipe path needs at least one included step with a production line',
      );
      return;
    }
    if (
      expectedOutput.trim() !== '' &&
      (parsedExpectedOutput == null || Number.isNaN(parsedExpectedOutput) || parsedExpectedOutput < 1)
    ) {
      appToast.error(t('targetQtyInvalid'));
      return;
    }

    const effectiveTargetOutput =
      batchMode === 'recipe' && selectedFormulaId && formulaStageItems.length > 0
        ? parsedExpectedOutput != null && !Number.isNaN(parsedExpectedOutput) && parsedExpectedOutput >= 1
          ? parsedExpectedOutput
          : formulaDefaultOutput > 0
            ? formulaDefaultOutput
            : undefined
        : batchMode === 'simple' &&
            parsedExpectedOutput != null &&
            !Number.isNaN(parsedExpectedOutput) &&
            parsedExpectedOutput >= 1
          ? parsedExpectedOutput
          : undefined;

    if (!force && plannedStart) {
      const steps = buildNewBatchScheduleSteps();
      const candidates = sequentialStepWindows({
        batchId: 0,
        batchNumber: 'New batch',
        plannedStartAt: new Date(plannedStart).toISOString(),
        steps,
      });
      const others = scheduleBatches.flatMap((row) =>
        row.steps.map((step) => ({
          batchId: row.batch_id,
          batchNumber: row.batch_number,
          productionLineId: step.production_line_id,
          machineId: step.machine_id,
          plannedStartAt: step.planned_start_at,
          plannedEndAt: step.planned_end_at,
        })),
      );
      const conflicts = candidates.flatMap((candidate) => findProductionScheduleConflicts(candidate, others));
      const unique = conflicts.filter(
        (conflict, index) =>
          conflicts.findIndex((row) => row.batchId === conflict.batchId && row.reason === conflict.reason) === index,
      );
      if (unique.length > 0) {
        setOverlapConflicts(unique);
        return;
      }
    }

    const stageSeeds =
      batchMode === 'recipe' && selectedFormulaId && formulaStages.length > 0
        ? formulaStages.map((stage) => {
            const draft = stageDrafts[stage.id];
            const minutes =
              draft?.minutes?.trim() === '' || draft?.minutes == null
                ? undefined
                : Number(draft.minutes);
            const outputRow = formulaStageItems.find(
              (row) => row.formula_stage_id === stage.id && row.item_role === 'output',
            );
            let expected_output_quantity: number | undefined;
            if (outputRow) {
              const raw = itemQtyDrafts[outputRow.id] ?? String(outputRow.quantity);
              const qty = Number(raw);
              if (!Number.isNaN(qty)) expected_output_quantity = Math.max(0, Math.round(qty * 100) / 100);
            }
            const machineRaw = draft?.machineId?.trim();
            let machine_id: number | undefined;
            if (showStepMachine && machineRaw) {
              const parsed = Number(machineRaw);
              if (!Number.isNaN(parsed)) machine_id = parsed;
            } else if (!showStepMachine && includedStageCount === 1 && runMachineId != null) {
              machine_id = runMachineId;
            }
            return {
              formula_stage_id: stage.id,
              include: draft?.include ?? true,
              production_line_id:
                draft?.lineId && draft.lineId !== '' ? Number(draft.lineId) : undefined,
              machine_id,
              expected_duration_minutes:
                minutes != null && !Number.isNaN(minutes) ? minutes : undefined,
              expected_output_quantity,
            };
          })
        : undefined;

    const itemSeeds =
      batchMode === 'recipe' && selectedFormulaId && formulaStageItems.length > 0
        ? formulaStageItems.map((row) => {
            const raw = itemQtyDrafts[row.id] ?? String(row.quantity);
            const qty = Number(raw);
            return {
              item_id: row.item_id,
              item_role: row.item_role,
              expected_quantity: Number.isNaN(qty) ? row.quantity : Math.max(0, Math.round(qty * 100) / 100),
              formula_stage_id: row.formula_stage_id,
            };
          })
        : undefined;

    const parameterSeeds =
      batchMode === 'recipe' && selectedFormulaId && formulaStageParameters.length > 0
        ? formulaStageParameters.map((row) => {
            const raw = (conditionPlannedDrafts[row.id] ?? row.planned_value).trim();
            return {
              source_parameter_id: row.id,
              planned_value: raw !== '' ? raw : row.planned_value,
            };
          })
        : undefined;

    try {
      const created = await createBatch({
        production_line_id: lid,
        formula_id: batchMode === 'recipe' ? selectedFormulaId ?? undefined : undefined,
        machine_id: showRailMachine && runMachineId != null ? runMachineId : undefined,
        planned_start_at: plannedStart ? new Date(plannedStart).toISOString() : undefined,
        sales_order_item_id: salesItemId ? Number(salesItemId) : undefined,
        batch_date: millBatchDate({ plannedLocal: plannedStart, timeZone: millTimezone }),
        shift_id: selectedShiftId ?? undefined,
        expected_output_quantity: effectiveTargetOutput,
        notes: notes.trim() || undefined,
        stage_seeds: stageSeeds,
        item_seeds: itemSeeds,
        parameter_seeds: parameterSeeds,
      }).unwrap();

      appToast.success(t('batchCreated'));
      onSuccess(created.id);
      onOpenChange(false);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedCreate'));
    }
  };

  const filteredLines = factoryId
    ? lines.filter((l) => l.factory_id === factoryId)
    : lines;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(76rem,96vw)] max-w-none flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle>{t('newRun')}</DialogTitle>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[22rem_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto border-border pr-1 md:border-r md:pr-4">
              <div
                className="grid grid-cols-3 gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5"
                role="group"
                aria-label={t('runModeAria')}
              >
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    batchMode === 'recipe'
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setBatchMode('recipe')}
                >
                  {t('recipe')}
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    batchMode === 'simple'
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => {
                    setBatchMode('simple');
                    setFormulaId('');
                  }}
                >
                  {t('simple')}
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                    batchMode === 'recurring'
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setBatchMode('recurring')}
                >
                  {t('recurring')}
                </button>
              </div>

              {usesRecipe ? (
                <>
                  <div className="grid gap-1.5">
                    <Label>{t('recipeRequired')}</Label>
                    <button
                      type="button"
                      className={cn(
                        'flex min-h-9 w-full flex-col justify-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      )}
                      onClick={() => setRecipePickerOpen(true)}
                    >
                      {selectedFormula ? (
                        <>
                          <span className="line-clamp-2 font-medium leading-snug">{selectedFormula.name}</span>
                          <span className="text-xs text-muted-foreground">{selectedFormula.formula_code}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t('selectRecipe')}</span>
                      )}
                    </button>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>{t('targetQty')}</Label>
                    <Input
                      className="h-9"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
                      placeholder={
                        formulaDefaultOutput > 0
                          ? t('defaultQty', { qty: formulaDefaultOutput })
                          : t('optional')
                      }
                    />
                    {recipeMaterialScale.baseOutput > 0 &&
                    Math.abs(recipeMaterialScale.multiplier - 1) > 0.000_1 ? (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {t('recipeScale', {
                          base: formatProductionQuantity(recipeMaterialScale.baseOutput),
                          target: formatProductionQuantity(recipeMaterialScale.targetOutput),
                          factor: formatProductionScaleFactor(recipeMaterialScale.multiplier),
                        })}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-1.5">
                    <Label>{t('lineRequired')}</Label>
                    <Select value={lineId} onValueChange={setLineId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t('selectLine')} />
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
                  <div className="grid gap-1.5">
                    <Label>{t('expectedQty')}</Label>
                    <Input
                      className="h-9"
                      type="text"
                      inputMode="numeric"
                      value={expectedOutput}
                      onChange={(e) => setExpectedOutput(e.target.value)}
                      placeholder={t('optional')}
                    />
                  </div>
                </>
              )}

              {showRailMachine ? (
                <ProductionLineMachineSelect
                  line={railMachineLine}
                  value={runMachineId}
                  onChange={setRunMachineId}
                  factoryId={factoryId ?? undefined}
                  scheduleBatches={scheduleBatches}
                  plannedWindow={railPlannedWindow}
                  id="batch-run-machine"
                />
              ) : null}

              <BatchShiftWhenRow
                groupedSection
                shifts={workspaceShifts}
                plannedStart={plannedStart}
                selectedShiftId={selectedShiftId}
                onPlannedStartChange={setPlannedStart}
                onSelectedShiftIdChange={setSelectedShiftId}
              />

              {batchMode === 'recurring' ? (
                <ProductionRunRecurrenceFields
                  cadence={recurrenceCadence}
                  onCadenceChange={setRecurrenceCadence}
                  endDate={recurrenceEnd}
                  onEndDateChange={setRecurrenceEnd}
                  plannedStart={plannedStart}
                />
              ) : null}

              <div className="grid gap-1.5">
                <Label>{t('notesOptional')}</Label>
                <Input
                  className="h-9"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notes')}
                />
              </div>

              {batchMode === 'recipe' ? (
                <Collapsible open={recipeMoreOpen} onOpenChange={setRecipeMoreOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start gap-1 px-2 text-muted-foreground"
                    >
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform ${recipeMoreOpen ? 'rotate-180' : ''}`}
                      />
                      {t('moreOptions')}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-1">
                    <div className="grid gap-1.5">
                      <Label>{t('salesOrder')}</Label>
                      <Select
                        value={salesOrderId || 'none'}
                        onValueChange={(value) => {
                          setSalesOrderId(value === 'none' ? '' : value);
                          setSalesItemId('');
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('makeToStock')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('makeToStock')}</SelectItem>
                          {salesOrders.filter((order) => !order.is_fully_delivered).map((order) => (
                            <SelectItem key={order.id} value={String(order.id)}>
                              {order.sales_order_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {salesOrderId ? (
                      <div className="grid gap-1.5">
                        <Label>{t('orderLine')}</Label>
                        <Select
                          value={salesItemId || 'none'}
                          onValueChange={(value) => setSalesItemId(value === 'none' ? '' : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('pickALine')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('pickALine')}</SelectItem>
                            {salesItems
                              .filter((item) => {
                                if (lastStepOutputItemIds.length === 0) return true;
                                return item.item_id != null && lastStepOutputItemIds.includes(item.item_id);
                              })
                              .map((item) => (
                                <SelectItem key={item.id} value={String(item.id)}>
                                  {item.item_name || item.description || t('lineItemFallback', { id: item.id })}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </aside>

            <div className="min-h-0 overflow-y-auto md:pl-1">
              {batchMode === 'simple' ? (
                <div className="flex min-h-[12rem] items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('simpleRunHint')}
                </div>
              ) : usesRecipe && selectedFormulaId && formulaStages.length > 0 ? (
                <div className="space-y-4 pb-2">
                  <section>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t('pathForRun')}
                    </p>
                    <AddBatchRecipePathList
                      stages={formulaStages}
                      routeSteps={routeSteps}
                      lines={filteredLines}
                      stageDrafts={stageDrafts}
                      selectedStageId={selectedPathStageId}
                      onSelect={setSelectedPathStageId}
                      onPatch={(stageId, patch) =>
                        setStageDrafts((prev) => ({
                          ...prev,
                          [stageId]: { ...prev[stageId], ...patch },
                        }))
                      }
                    />
                  </section>
                  <AddBatchRecipePathStepEditor
                    stage={selectedPathStage}
                    draft={selectedPathStageDraft}
                    lines={filteredLines}
                    routeSteps={routeSteps}
                    showMachine={showStepMachine}
                    factoryId={factoryId ?? undefined}
                    scheduleBatches={scheduleBatches}
                    plannedWindow={selectedStepPlannedWindow}
                    onPatch={(patch) => {
                      if (selectedPathStageId == null) return;
                      setStageDrafts((prev) => ({
                        ...prev,
                        [selectedPathStageId]: { ...prev[selectedPathStageId], ...patch },
                      }));
                    }}
                  >
                    <AddBatchRecipeStepMaterials
                      embedded
                      stage={selectedPathStage}
                      stageItems={formulaStageItems}
                      stageParameters={formulaStageParameters}
                      items={items}
                      itemQtyDrafts={itemQtyDrafts}
                      materialScaleMultiplier={recipeMaterialScale.multiplier}
                      materialScaleBaseOutput={recipeMaterialScale.baseOutput}
                      materialScaleTargetOutput={recipeMaterialScale.targetOutput}
                      onQtyChange={(stageItemId, value) =>
                        setItemQtyDrafts((prev) => ({ ...prev, [stageItemId]: value }))
                      }
                      conditionPlannedDrafts={conditionPlannedDrafts}
                      onConditionPlannedChange={(parameterId, value) =>
                        setConditionPlannedDrafts((prev) => ({ ...prev, [parameterId]: value }))
                      }
                    />
                  </AddBatchRecipePathStepEditor>
                </div>
              ) : (
                <div className="flex min-h-[12rem] items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
                  {t('selectRecipePreview')}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isCreating || isCreatingProgram}>
              {(isCreating || isCreatingProgram) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {batchMode === 'recurring' ? t('createProgram') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <RecipePickerDialog
      open={recipePickerOpen}
      onOpenChange={setRecipePickerOpen}
      formulas={activeFormulas}
      lines={filteredLines}
      items={items}
      selectedFormulaId={selectedFormulaId}
      onConfirm={(id) => setFormulaId(String(id))}
    />
    <ProductionScheduleConflictDialog
      open={overlapConflicts.length > 0}
      conflicts={overlapConflicts}
      onCancel={() => setOverlapConflicts([])}
      onSaveAnyway={() => {
        setOverlapConflicts([]);
        void handleSubmit(undefined, true);
      }}
    />
    </>
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
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
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
          actual_output_quantity: actualOutput ? parseProductionQuantity(actualOutput) ?? undefined : undefined,
          actual_duration_minutes: actualDuration ? parseInt(actualDuration, 10) : undefined,
          notes: notes.trim() || undefined,
        },
      }).unwrap();
      appToast.success(t('batchCompleted'));
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedComplete'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('completeBatch', { number: batch.batch_number })}</DialogTitle>
            <DialogDescription>
              {t('completeHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('actualOutput')}</Label>
              <Input
                type="number"
                min={0}
                value={actualOutput}
                onChange={(e) => setActualOutput(e.target.value)}
                placeholder={batch.expected_output_quantity?.toString() ?? ''}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('actualDuration')}</Label>
              <Input
                type="number"
                min={0}
                value={actualDuration}
                onChange={(e) => setActualDuration(e.target.value)}
                placeholder={t('durationPh')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('notes')}</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('completionNotes')}
              />
            </div>
            <p className="text-xs text-muted-foreground rounded-lg border border-border/60 bg-muted/20 p-3">
              {t('completePostHint')}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('complete')}
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
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
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
      appToast.success(t('batchCancelled'));
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || t('failedCancel'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('cancelBatch', { number: batch.batch_number })}</DialogTitle>
            <DialogDescription>
              {t('cancelHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('reasonOptional')}</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('cancelReasonPh')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('cancelBatchBtn')}
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
  const { t } = useTranslation('production');
  const { t: tc } = useTranslation('common');
  const { data: batch, isLoading: loadingBatch, error: batchErr } = useGetProductionBatchByIdQuery(batchId);
  const line = batch ? lines.find((l) => l.id === batch.production_line_id) : undefined;

  const storagePreview = useBatchInputStoragePreview({
    batchId,
    lineFactoryId: line?.factory_id,
    enabled: !!batchId,
    highlightStepInputs: false,
  });

  const { noItems, stockCheckLoading, loadingItems, rows, shortages, canStartBatch, storageRows } =
    storagePreview;
  const [shortStockSeed, setShortStockSeed] = useState<ShortStockSeed | null>(null);
  const [shortPurchaseSeed, setShortPurchaseSeed] = useState<ShortStockSeed | null>(null);

  const openShortStock = (
    row: { itemId: number; factoryId: number; required: number; onHand: number },
    action: 'stock' | 'purchase',
  ) => {
    const quantity = storageGapQty(row.required, row.onHand);
    if (quantity <= 0) return;
    const seed: ShortStockSeed = {
      itemId: row.itemId,
      itemName: getItemName(row.itemId),
      factoryId: row.factoryId,
      quantity,
      existing: existingStorageForShort(storageRows, row.itemId, row.factoryId),
    };
    if (action === 'stock') setShortStockSeed(seed);
    else setShortPurchaseSeed(seed);
  };

  const [startedEarlier, setStartedEarlier] = useState(false);
  const [startedAtLocal, setStartedAtLocal] = useState(defaultLocalDatetimeNow);

  const startEarlierError = validateStartedEarlier(startedEarlier, startedAtLocal);

  const canSubmit =
    !!batch &&
    (batch.status === 'draft' || batch.status === 'recurring') &&
    canStartBatch &&
    !loadingBatch &&
    !startEarlierError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !canSubmit) return;
    const err = validateStartedEarlier(startedEarlier, startedAtLocal);
    if (err) {
      appToast.error(err);
      return;
    }
    try {
      const started_at = startedAtForApi(startedEarlier, startedAtLocal);
      await startBatch({
        id: batch.id,
        data: started_at ? { started_at } : {},
      }).unwrap();
      appToast.success(t('batchStarted'));
      onClose();
    } catch (err: unknown) {
      const e2 = err as { data?: { detail?: string } };
      appToast.error(e2?.data?.detail || t('failedStart'));
    }
  };

  return (
    <>
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('startBatch')}</DialogTitle>
            <DialogDescription>
              {t('startHint')}
            </DialogDescription>
          </DialogHeader>

          {(loadingBatch || loadingItems) && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          )}

          {batchErr && (
            <p className="text-sm text-destructive py-4">{t('couldNotLoadBatch')}</p>
          )}

          {batch && !loadingBatch && !loadingItems && (
            <div className="grid gap-4 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{batch.batch_number}</span>
                {line && ` · ${line.name}`}
              </p>

              <BatchStartStoragePreview
                rows={rows}
                loading={stockCheckLoading}
                loadingItems={loadingItems}
                noItems={noItems}
                noInputs={storagePreview.noInputs}
                shortages={shortages}
                getItemName={getItemName}
                onReplenish={openShortStock}
              />

              {batch.status !== 'draft' && batch.status !== 'recurring' && (
                <p className="text-sm text-destructive">{t('cannotStart')}</p>
              )}

              {canSubmit || (!noItems && (batch.status === 'draft' || batch.status === 'recurring')) ? (
                <ProductionStartEarlierFields
                  idPrefix="start-batch"
                  enabled={startedEarlier}
                  onEnabledChange={setStartedEarlier}
                  value={startedAtLocal}
                  onChange={setStartedAtLocal}
                  disabled={isStarting}
                />
              ) : null}
              {startEarlierError ? (
                <p className="text-sm text-destructive">{startEarlierError}</p>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              {tc('back')}
            </Button>
            <Button type="submit" disabled={!canSubmit || isStarting}>
              {isStarting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('start')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <BatchShortStockDialogs
      stockSeed={shortStockSeed}
      purchaseSeed={shortPurchaseSeed}
      onStockOpenChange={(open) => {
        if (!open) setShortStockSeed(null);
      }}
      onPurchaseOpenChange={(open) => {
        if (!open) setShortPurchaseSeed(null);
      }}
    />
    </>
  );
};

export default ProductionPage;
