import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearFactory, setFactory } from '@/features/auth/authSlice';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetMachinesQuery, useGetUpcomingMachineWorkQuery } from '@/features/machines/machinesApi';
import { useGetInventoryListQuery } from '@/features/inventory/inventoryApi';
import {
  useGetProductionBatchesQuery,
  useGetProductionLinesQuery,
} from '@/features/production/productionApi';
import { useGetInventoryLedgerQuery } from '@/features/ledgers/ledgersApi';
import { API_LIMITS } from '@/constants/apiLimits';
import type { Factory } from '@/types/factory';
import { splitUpcomingWorkByDueWindow } from '@/lib/machineUpcomingWork';
import {
  buildFactoryActivityFeed,
  buildFactoryAttentionItems,
  buildFactoryCardSnapshots,
  buildProductionCardSnapshot,
  buildStorageCardSnapshot,
  countMachineStatus,
} from './factoriesOverviewData';

export function useFactoriesOverviewPage() {
  const dispatch = useAppDispatch();
  const authFactory = useAppSelector((s) => s.auth.factory);

  const [factoryFilter, setFactoryFilterState] = useState<string>(() =>
    authFactory ? String(authFactory.id) : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setFactoryFilterState(authFactory ? String(authFactory.id) : 'all');
  }, [authFactory?.id]);

  const setFactoryFilter = useCallback(
    (next: string) => {
      setFactoryFilterState(next);
      if (next === 'all') {
        dispatch(clearFactory());
        return;
      }
      const id = Number(next);
      if (!Number.isFinite(id)) return;
    },
    [dispatch]
  );

  const selectFactory = useCallback(
    (factory: Factory) => {
      dispatch(setFactory(factory));
      setFactoryFilterState(String(factory.id));
    },
    [dispatch]
  );

  const clearFactorySelection = useCallback(() => {
    dispatch(clearFactory());
    setFactoryFilterState('all');
  }, [dispatch]);

  const { data: factories = [], isLoading: loadFactories, isError: errFactories } =
    useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });

  useEffect(() => {
    if (factoryFilter === 'all') return;
    const id = Number(factoryFilter);
    if (!Number.isFinite(id)) return;
    const match = factories.find((f) => f.id === id);
    if (match && authFactory?.id !== match.id) {
      dispatch(setFactory(match));
    }
  }, [factoryFilter, factories, authFactory?.id, dispatch]);

  const scopedFactoryId =
    factoryFilter !== 'all' && Number.isFinite(Number(factoryFilter))
      ? Number(factoryFilter)
      : undefined;

  const { data: allSections = [], isLoading: loadSections } = useGetFactorySectionsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    factory_id: scopedFactoryId,
  });

  const { data: allMachines = [], isLoading: loadMachines, isError: errMachines } =
    useGetMachinesQuery({
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    });

  const { data: allInventory = [], isLoading: loadInventory } = useGetInventoryListQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    inventory_type: 'STORAGE',
  });

  const { data: allProductionLines = [], isLoading: loadLines } = useGetProductionLinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const { data: productionBatchesRaw = [], isLoading: loadBatches } = useGetProductionBatchesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const ledgerStart = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const ledgerEnd = format(new Date(), 'yyyy-MM-dd');

  const { data: upcomingMachineWorkAll = [], isLoading: loadUpcomingWork } =
    useGetUpcomingMachineWorkQuery({
      within_days: 7,
      include_overdue: true,
    });

  const { data: factoryLedgerEntries = [], isLoading: loadFactoryLedger } = useGetInventoryLedgerQuery(
    {
      skip: 0,
      limit: 50,
      factory_id: scopedFactoryId,
      start_date: ledgerStart,
      end_date: ledgerEnd,
      inventory_type: 'STORAGE',
    },
    { skip: scopedFactoryId == null }
  );

  const machines = useMemo(() => {
    if (scopedFactoryId == null) return allMachines;
    return allMachines.filter((machine) => machine.factory_id === scopedFactoryId);
  }, [allMachines, scopedFactoryId]);

  const inventory = useMemo(() => {
    if (scopedFactoryId == null) return allInventory;
    return allInventory.filter((row) => row.factory_id === scopedFactoryId);
  }, [allInventory, scopedFactoryId]);

  const productionLines = useMemo(() => {
    if (scopedFactoryId == null) return allProductionLines;
    return allProductionLines.filter((line) => line.factory_id === scopedFactoryId);
  }, [allProductionLines, scopedFactoryId]);

  const productionBatches = useMemo(() => {
    const lineIds = new Set(productionLines.map((line) => line.id));
    return productionBatchesRaw.filter((batch) => lineIds.has(batch.production_line_id));
  }, [productionBatchesRaw, productionLines]);

  const factoryById = useMemo(
    () => new Map(factories.map((f) => [f.id, f])),
    [factories]
  );

  const sectionById = useMemo(
    () => new Map(allSections.map((s) => [s.id, s])),
    [allSections]
  );

  const filteredFactories = useMemo(() => {
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase();
    return factories.filter(
      (f) => f.name.toLowerCase().includes(q) || f.abbreviation.toLowerCase().includes(q)
    );
  }, [factories, searchQuery]);

  const factoryCardSnapshots = useMemo(
    () =>
      buildFactoryCardSnapshots(
        factories,
        allMachines,
        allInventory,
        productionBatchesRaw,
        allProductionLines,
        upcomingMachineWorkAll
      ),
    [
      factories,
      allMachines,
      allInventory,
      productionBatchesRaw,
      allProductionLines,
      upcomingMachineWorkAll,
    ]
  );

  const activeFactory = useMemo(() => {
    if (factoryFilter === 'all') return null;
    const id = Number(factoryFilter);
    if (!Number.isFinite(id)) return null;
    return factoryById.get(id) ?? null;
  }, [factoryFilter, factoryById]);

  const bottomPanelMode = factoryFilter === 'all' ? ('grid' as const) : ('detail' as const);

  const machineStatus = useMemo(() => countMachineStatus(machines), [machines]);

  const scopedUpcomingWork = useMemo(() => {
    if (scopedFactoryId == null) return upcomingMachineWorkAll;
    return upcomingMachineWorkAll.filter((row) => row.factory_id === scopedFactoryId);
  }, [upcomingMachineWorkAll, scopedFactoryId]);

  const factoryAbbrev =
    scopedFactoryId != null ? factoryById.get(scopedFactoryId)?.abbreviation : undefined;

  const splitMaintenanceWork = useMemo(
    () => splitUpcomingWorkByDueWindow(scopedUpcomingWork, sectionById, 7, factoryAbbrev),
    [scopedUpcomingWork, sectionById, factoryAbbrev]
  );

  const maintenanceDueRows = useMemo(
    () => [...splitMaintenanceWork.overdueRows, ...splitMaintenanceWork.upcomingRows],
    [splitMaintenanceWork]
  );

  const storageSnapshot = useMemo(
    () => buildStorageCardSnapshot(inventory),
    [inventory]
  );

  const productionSnapshot = useMemo(
    () => buildProductionCardSnapshot(productionBatches, productionLines),
    [productionBatches, productionLines]
  );

  const factoryAttention = useMemo(() => {
    if (activeFactory == null) return null;
    return buildFactoryAttentionItems(
      activeFactory.id,
      machines,
      maintenanceDueRows,
      productionBatches,
      productionLines,
      sectionById
    );
  }, [
    activeFactory,
    machines,
    maintenanceDueRows,
    productionBatches,
    productionLines,
    sectionById,
  ]);

  const factoryActivity = useMemo(() => {
    if (activeFactory == null) return [];
    return buildFactoryActivityFeed(
      activeFactory.id,
      machines,
      factoryLedgerEntries,
      productionBatches,
      productionLines,
      inventory,
      sectionById
    );
  }, [
    activeFactory,
    machines,
    factoryLedgerEntries,
    productionBatches,
    productionLines,
    inventory,
    sectionById,
  ]);

  const isLoading =
    loadFactories ||
    loadSections ||
    loadMachines ||
    loadInventory ||
    loadLines ||
    loadBatches ||
    loadUpcomingWork;

  const loadMaintenanceDue = loadUpcomingWork;

  const loadError = errFactories || errMachines;

  const scopeLabel =
    factoryFilter === 'all'
      ? 'All factories'
      : (factoryById.get(Number(factoryFilter))?.name ?? 'Selected factory');

  return {
    factoryFilter,
    setFactoryFilter,
    selectFactory,
    clearFactorySelection,
    bottomPanelMode,
    activeFactory,
    searchQuery,
    setSearchQuery,
    factories,
    machines,
    allSections,
    filteredFactories,
    allFactoriesForManage: filteredFactories,
    factoryById,
    factoryCardSnapshots,
    machineStatus,
    maintenanceDueRows,
    overdueRows: splitMaintenanceWork.overdueRows,
    upcomingRows: splitMaintenanceWork.upcomingRows,
    overdueCount: splitMaintenanceWork.overdueCount,
    upcomingCount: splitMaintenanceWork.upcomingCount,
    maintenanceDueCount: splitMaintenanceWork.overdueCount + splitMaintenanceWork.upcomingCount,
    storageSnapshot,
    productionSnapshot,
    factoryAttention,
    factoryActivity,
    scopeLabel,
    loadInventory,
    loadBatches,
    loadFactoryActivity: loadFactoryLedger,
    isLoading,
    loadMachines,
    loadMaintenanceDue,
    loadError,
  };
}

export type UseFactoriesOverviewPageReturn = ReturnType<typeof useFactoriesOverviewPage>;
