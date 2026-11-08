import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import {
  normalizeProductionScheduleWeekAnchor,
  productionScheduleTodayWeekAnchor,
} from '@/components/newcomponents/customui/production/productionScheduleWeek';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';

import type { ProductionPageTab } from '@/components/newcomponents/customui/production/ProductionPageHeaderTabs';
import {
  resolveEffectiveBatchStatusFilter,
  type ProductionBatchStatus,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import { persistedBatchStatusFilter } from '@/pages/newpages/production/productionBatchStatusDefaults';
import { parsePageFactoryFilterParam, usePageFactoryScopeId } from '@/hooks/usePageFactoryScope';

import {
  PRODUCTION_URL_PARAMS,
  deriveProductionBatchDateViewMode,
  parseProductionPageParams,
  type ProductionWeekBatchGrid,
  pruneProductionCatalogParams,
  resolveBatchStatusFilterFromSearchParams,
  retainProductionTabParams,
  stripInvalidProductionUrlParams,
  writeProductionPageParams,
} from './productionPageUrl';

const todayIso = () => format(new Date(), 'yyyy-MM-dd');

export interface UseProductionPageNavigationOptions {
  readStoredStatuses: () => ProductionBatchStatus[];
  persistStoredStatuses: (statuses: ProductionBatchStatus[]) => void;
  /** `null` while that catalog is still loading. */
  knownLineIds?: number[] | null;
  knownMachineIds?: number[] | null;
}

function batchStatusFiltersEqual(a: ProductionBatchStatus[], b: ProductionBatchStatus[]): boolean {
  return a.length === b.length && a.every((s, i) => s === b[i]);
}

export function useProductionPageNavigation({
  readStoredStatuses,
  persistStoredStatuses,
  knownLineIds = null,
  knownMachineIds = null,
}: UseProductionPageNavigationOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const factorySeed = parsePageFactoryFilterParam(searchParams.get(PRODUCTION_URL_PARAMS.factoryId));
  const { factoryId, setFactoryId } = usePageFactoryScopeId({
    initialOverride: factorySeed ?? 'all',
  });

  const parsed = useMemo(() => parseProductionPageParams(searchParams), [searchParams]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const stripped = stripInvalidProductionUrlParams(prev);
        let next = stripped ?? new URLSearchParams(prev);
        let changed = stripped != null;

        const desiredFactory = factoryId == null ? null : String(factoryId);
        if ((next.get(PRODUCTION_URL_PARAMS.factoryId) ?? null) !== desiredFactory) {
          if (desiredFactory == null) next.delete(PRODUCTION_URL_PARAMS.factoryId);
          else next.set(PRODUCTION_URL_PARAMS.factoryId, desiredFactory);
          changed = true;
        }

        const pruned = pruneProductionCatalogParams(next, {
          lineIds: knownLineIds,
          machineIds: knownMachineIds,
        });
        if (pruned) {
          next = pruned;
          changed = true;
        }

        const tab = next.get(PRODUCTION_URL_PARAMS.tab);
        const needsWeek =
          (tab === 'batches' || parseProductionPageParams(next).tab === 'batches') &&
          !next.get(PRODUCTION_URL_PARAMS.batchDate) &&
          !next.get(PRODUCTION_URL_PARAMS.batchDateScope);
        if (needsWeek || changed) {
          next = retainProductionTabParams(
            next,
            needsWeek ? productionScheduleTodayWeekAnchor() : undefined,
          );
          changed = true;
        }

        if (!changed || next.toString() === prev.toString()) return prev;
        return next;
      },
      { replace: true },
    );
  }, [factoryId, knownLineIds, knownMachineIds, searchParams, setSearchParams]);

  const [batchStatusFilter, setBatchStatusFilterState] = useState<ProductionBatchStatus[]>(() =>
    resolveBatchStatusFilterFromSearchParams(searchParams, readStoredStatuses),
  );

  /** Browser back/forward or shared link: URL wins; no URL → localStorage. */
  useEffect(() => {
    const next = resolveBatchStatusFilterFromSearchParams(searchParams, readStoredStatuses);
    setBatchStatusFilterState((prev) => (batchStatusFiltersEqual(prev, next) ? prev : next));
  }, [searchParams, readStoredStatuses]);

  const activeTab = parsed.tab;
  const selectedBatchId =
    activeTab === 'batches' || parsed.batchId != null ? parsed.batchId : null;
  const lineId = parsed.lineId;
  const batchSearchQuery = parsed.q;
  const setupSearchQuery = parsed.setupQ;
  const setupFocusFormulaId = parsed.formulaId;
  const showCompletedBatches = parsed.showCompletedBatches;
  const batchDateFrom = parsed.batchDateFrom;
  const batchDateTo = parsed.batchDateTo;
  const runsDateFromUrl = parsed.batchDate;
  const runsScope = parsed.batchDateScope;
  const runsLineIdsFromUrl = parsed.batchLineIds;
  const runsMachine = parsed.batchMachine;
  const runsWeekBatchGrid = parsed.batchGrid;

  const runsDateViewMode = useMemo(() => {
    // No date and no scope yet: batches tab is about to write this week's anchor.
    if (!runsDateFromUrl && runsScope == null && activeTab === 'batches') return 'week';
    return deriveProductionBatchDateViewMode(runsDateFromUrl, runsScope);
  }, [runsDateFromUrl, runsScope, activeTab]);

  const runsWeekAnchorIso = useMemo(() => {
    if (runsDateViewMode === 'week' && runsDateFromUrl) {
      return normalizeProductionScheduleWeekAnchor(runsDateFromUrl);
    }
    return productionScheduleTodayWeekAnchor();
  }, [runsDateViewMode, runsDateFromUrl]);

  const runsDayIso = useMemo(() => {
    if (runsDateViewMode === 'day' && runsDateFromUrl) return runsDateFromUrl;
    return todayIso();
  }, [runsDateViewMode, runsDateFromUrl]);

  const patchParams = useCallback(
    (patch: Parameters<typeof writeProductionPageParams>[1], replace = true) => {
      setSearchParams((prev) => writeProductionPageParams(prev, patch), { replace });
    },
    [setSearchParams],
  );

  const setActiveTab = useCallback(
    (tab: ProductionPageTab) => {
      setSearchParams(
        (prev) =>
          writeProductionPageParams(prev, {
            tab,
            batchWeekAnchor: tab === 'batches' ? productionScheduleTodayWeekAnchor() : undefined,
          }),
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setSelectedBatchId = useCallback(
    (id: number | null) => {
      if (id == null) {
        setSearchParams(
          (prev) => writeProductionPageParams(prev, { batchId: null }),
          { replace: false },
        );
        return;
      }
      setSearchParams(
        (prev) =>
          writeProductionPageParams(prev, {
            tab: 'batches',
            batchId: id,
          }),
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setLineId = useCallback(
    (id: number | null) => {
      patchParams({ lineId: id });
    },
    [patchParams],
  );

  const setBatchSearchQuery = useCallback(
    (q: string) => {
      patchParams({ q });
    },
    [patchParams],
  );

  const statusViewMode: WorkOrdersDateViewMode | undefined =
    activeTab === 'batches' ? runsDateViewMode : 'all';

  const setBatchStatusFilter = useCallback(
    (next: ProductionBatchStatus[] | ((prev: ProductionBatchStatus[]) => ProductionBatchStatus[])) => {
      const commit = (resolved: ProductionBatchStatus[]) => {
        const stored = persistedBatchStatusFilter(resolved, statusViewMode);
        setBatchStatusFilterState(stored);
        persistStoredStatuses(stored);
        patchParams({ statuses: stored });
      };
      if (typeof next === 'function') {
        setBatchStatusFilterState((prev) => {
          const stored = persistedBatchStatusFilter(next(prev), statusViewMode);
          persistStoredStatuses(stored);
          patchParams({ statuses: stored });
          return stored;
        });
        return;
      }
      commit(next);
    },
    [patchParams, persistStoredStatuses, statusViewMode],
  );

  const setSetupSearchQuery = useCallback(
    (setupQ: string) => {
      patchParams({ setupQ });
    },
    [patchParams],
  );

  const setSetupFocusFormulaId = useCallback(
    (formulaId: number | null) => {
      if (formulaId == null) {
        patchParams({ formulaId: null });
        return;
      }
      setSearchParams(
        (prev) =>
          writeProductionPageParams(prev, {
            tab: 'setup',
            formulaId,
          }),
        { replace: true },
      );
    },
    [patchParams, setSearchParams],
  );

  const handleSetupFocusFormulaHandled = useCallback(() => {
    patchParams({ formulaId: null });
  }, [patchParams]);

  const toggleBatchStatusFilter = useCallback(
    (status: ProductionBatchStatus) => {
      setBatchStatusFilter((prev) => {
        const base = [...resolveEffectiveBatchStatusFilter(prev, statusViewMode)];
        if (base.includes(status)) {
          return base.filter((s) => s !== status);
        }
        return [...base, status];
      });
    },
    [setBatchStatusFilter, statusViewMode],
  );

  const clearBatchStatusFilter = useCallback(() => {
    setBatchStatusFilter([]);
    patchParams({ showCompletedBatches: false });
  }, [setBatchStatusFilter, patchParams]);

  const setShowCompletedBatches = useCallback(
    (value: boolean) => {
      patchParams({ showCompletedBatches: value });
    },
    [patchParams],
  );

  const setBatchDateFrom = useCallback(
    (value: string) => {
      patchParams({ batchDateFrom: value || null });
    },
    [patchParams],
  );

  const setBatchDateTo = useCallback(
    (value: string) => {
      patchParams({ batchDateTo: value || null });
    },
    [patchParams],
  );

  const clearBatchDateRange = useCallback(() => {
    patchParams({ batchDateFrom: null, batchDateTo: null });
  }, [patchParams]);

  const setBatchDateRange = useCallback(
    (from: string | null, to: string | null) => {
      patchParams({ batchDateFrom: from, batchDateTo: to });
    },
    [patchParams],
  );

  const setRunsDateViewMode = useCallback(
    (mode: WorkOrdersDateViewMode) => {
      if (mode === 'all') {
        patchParams({ batchDate: null, batchDateScope: 'all' }, false);
        return;
      }
      if (mode === 'week') {
        patchParams(
          {
            batchDate: productionScheduleTodayWeekAnchor(),
            batchDateScope: null,
          },
          false,
        );
        return;
      }
      patchParams(
        {
          batchDate: runsDayIso,
          batchDateScope: 'day',
        },
        false,
      );
    },
    [patchParams, runsDayIso],
  );

  const pickRunsWeek = useCallback(
    (iso: string) => {
      patchParams(
        {
          batchDate: normalizeProductionScheduleWeekAnchor(iso),
          batchDateScope: null,
        },
        false,
      );
    },
    [patchParams],
  );

  const pickRunsDay = useCallback(
    (iso: string) => {
      patchParams({ batchDate: iso, batchDateScope: 'day' }, false);
    },
    [patchParams],
  );

  /** Day view + selected batch in one URL write. Two writes drop one of them. */
  const openRunsDay = useCallback(
    (iso: string, batchId: number | null) => {
      setSearchParams(
        (prev) =>
          writeProductionPageParams(prev, {
            tab: 'batches',
            batchDate: iso,
            batchDateScope: 'day',
            batchId,
          }),
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setRunsLineIds = useCallback(
    (lineIds: number[] | null, allLineIds?: number[]) => {
      if (lineIds === null) {
        patchParams({ batchLineIds: null });
        return;
      }
      patchParams({
        batchLineIds: lineIds,
        batchLinesAllLineIds: allLineIds,
      });
    },
    [patchParams],
  );

  const setRunsMachine = useCallback(
    (machineId: string) => {
      patchParams({ batchMachine: machineId === 'all' ? 'all' : machineId });
    },
    [patchParams],
  );

  const setRunsWeekBatchGrid = useCallback(
    (grid: ProductionWeekBatchGrid) => {
      patchParams({ batchGrid: grid === 'hours' ? 'hours' : null });
    },
    [patchParams],
  );

  return {
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
    toggleBatchStatusFilter,
    clearBatchStatusFilter,
    setupSearchQuery,
    setSetupSearchQuery,
    setupFocusFormulaId,
    setSetupFocusFormulaId,
    handleSetupFocusFormulaHandled,
    showCompletedBatches,
    setShowCompletedBatches,
    batchDateFrom,
    batchDateTo,
    setBatchDateFrom,
    setBatchDateTo,
    clearBatchDateRange,
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
  };
}
