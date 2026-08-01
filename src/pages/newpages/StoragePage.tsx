import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { usePageFactoryScopeId } from '@/hooks/usePageFactoryScope';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetInventoryPageQuery,
  useGetInventoryStatsQuery,
  useGetInventoryListQuery,
  useGetIncomingSummaryQuery,
  useDeleteInventoryMutation,
} from '@/features/inventory/inventoryApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Inventory, InventoryType } from '@/types/inventory';
import { Archive, Search } from 'lucide-react';
import AddInventoryDialog from '@/components/newcomponents/customui/AddInventoryDialog';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditInventoryDialog from '@/components/newcomponents/customui/EditInventoryDialog';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import StorageKpiStrip from '@/components/newcomponents/customui/storage/StorageKpiStrip';
import StorageSection from '@/components/newcomponents/customui/storage/StorageSection';
import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';
import {
  computeStorageOverviewFromInventory,
  emptyStorageOverview,
  filterInventoryForStorageCatalog,
  storageOverviewFromStatsResponse,
} from '@/components/newcomponents/customui/storage/storageOverviewUtils';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { incomingSummaryKey } from '@/types/inventoryIncoming';
import {
  buildStorageListParams,
  buildStorageStatsParams,
  parseStorageCatalogFilters,
  parseStoragePage,
  STORAGE_PAGE_PARAM,
  STORAGE_PAGE_SIZE,
  STORAGE_SEARCH_PARAM,
} from '@/features/inventory/storageCatalogParams';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  singleFactoryToSlice,
  sliceToSingleFactoryId,
} from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import { useScrollTargetHighlight } from '@/lib/scrollTargetHighlight';
import { useOrderHubPageClamp } from '@/pages/newpages/orders/useOrderHubPageClamp';
import toast from 'react-hot-toast';

const VALID_INVENTORY_TYPES = new Set<InventoryType>(['STORAGE', 'DAMAGED', 'WASTE', 'SCRAP']);

function parseStorageDeepLink(params: URLSearchParams): {
  factoryId: number | null;
  itemId: number | null;
  inventoryType: InventoryType | null;
} {
  const factoryRaw = params.get('factoryId');
  const itemRaw = params.get('itemId');
  const typeRaw = params.get('inventoryType');

  const factoryId = factoryRaw ? parseInt(factoryRaw, 10) : null;
  const itemId = itemRaw ? parseInt(itemRaw, 10) : null;
  const inventoryType =
    typeRaw && VALID_INVENTORY_TYPES.has(typeRaw as InventoryType)
      ? (typeRaw as InventoryType)
      : null;

  return {
    factoryId: factoryId != null && Number.isFinite(factoryId) ? factoryId : null,
    itemId: itemId != null && Number.isFinite(itemId) ? itemId : null,
    inventoryType,
  };
}

const StoragePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLink = useMemo(() => parseStorageDeepLink(searchParams), [searchParams]);
  const catalogFiltersFromUrl = useMemo(() => parseStorageCatalogFilters(searchParams), [searchParams]);
  const catalogPage = parseStoragePage(searchParams.get(STORAGE_PAGE_PARAM));

  const { factoryId, setFactoryId } = usePageFactoryScopeId({
    initialOverride:
      deepLink.factoryId != null ? String(deepLink.factoryId) : undefined,
  });
  const [filterItemId, setFilterItemId] = useState<number | null>(() => deepLink.itemId);
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<InventoryType | 'all'>(
    () => deepLink.inventoryType ?? 'all',
  );
  const [searchInput, setSearchInput] = useState(catalogFiltersFromUrl.searchQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(catalogFiltersFromUrl.searchQuery);
  const [showZeroQty, setShowZeroQty] = useState(catalogFiltersFromUrl.includeZeroQty);
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [factoryPickerOpen, setFactoryPickerOpen] = useState(false);
  const {
    highlighted: factoryPickerHighlight,
    pulseHighlight: pulseFactoryPickerHighlight,
    dismissHighlight: dismissFactoryPickerHighlight,
  } = useScrollTargetHighlight();

  const promptFactorySelect = useCallback(() => {
    pulseFactoryPickerHighlight();
    setFactoryPickerOpen(true);
  }, [pulseFactoryPickerHighlight]);

  useEffect(() => {
    if (factoryId != null) {
      dismissFactoryPickerHighlight();
    }
  }, [factoryId, dismissFactoryPickerHighlight]);

  const handleAddInventory = useCallback(() => {
    setIsAddInventoryOpen(true);
  }, []);

  useEffect(() => {
    if (deepLink.factoryId != null) {
      setFactoryId(deepLink.factoryId);
    }
    if (deepLink.itemId != null) {
      setFilterItemId(deepLink.itemId);
    }
    if (deepLink.inventoryType != null) {
      setInventoryTypeFilter(deepLink.inventoryType);
    }
  }, [deepLink.factoryId, deepLink.itemId, deepLink.inventoryType, setFactoryId]);

  useEffect(() => {
    if (!searchParams.has('factoryId')) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('factoryId');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSearchInput(catalogFiltersFromUrl.searchQuery);
    setDebouncedSearch(catalogFiltersFromUrl.searchQuery);
    setShowZeroQty(catalogFiltersFromUrl.includeZeroQty);
  }, [catalogFiltersFromUrl.searchQuery, catalogFiltersFromUrl.includeZeroQty]);

  const patchStorageParams = useCallback(
    (
      patch: Partial<{ searchQuery: string; includeZeroQty: boolean; page: number }>,
      options?: { resetPage?: boolean },
    ) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const currentSearch = prev.get(STORAGE_SEARCH_PARAM)?.trim() ?? '';
          const currentEmpty = prev.get('storageEmpty') === '1';
          const currentPage = parseStoragePage(prev.get(STORAGE_PAGE_PARAM));

          const merged = {
            searchQuery: patch.searchQuery ?? currentSearch,
            includeZeroQty: patch.includeZeroQty ?? currentEmpty,
            page: patch.page ?? currentPage,
          };

          if (options?.resetPage !== false && patch.page == null) {
            merged.page = 1;
          }

          if (merged.searchQuery) next.set(STORAGE_SEARCH_PARAM, merged.searchQuery);
          else next.delete(STORAGE_SEARCH_PARAM);

          if (merged.includeZeroQty) next.set('storageEmpty', '1');
          else next.delete('storageEmpty');

          if (merged.page > 1) next.set(STORAGE_PAGE_PARAM, String(merged.page));
          else next.delete(STORAGE_PAGE_PARAM);

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (debouncedSearch === catalogFiltersFromUrl.searchQuery) return;
    patchStorageParams({ searchQuery: debouncedSearch });
  }, [debouncedSearch, catalogFiltersFromUrl.searchQuery, patchStorageParams]);

  const activeFilters = useMemo(
    () => ({
      searchQuery: catalogFiltersFromUrl.searchQuery,
      factoryId,
      inventoryTypeFilter,
      itemId: filterItemId,
      includeZeroQty: showZeroQty,
    }),
    [
      catalogFiltersFromUrl.searchQuery,
      factoryId,
      inventoryTypeFilter,
      filterItemId,
      showZeroQty,
    ],
  );

  const listQueryParams = useMemo(
    () => buildStorageListParams(activeFilters, catalogPage),
    [activeFilters, catalogPage],
  );

  const statsQueryParams = useMemo(
    () => buildStorageStatsParams(activeFilters),
    [activeFilters],
  );

  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({
    skip: 0,
    limit: 100,
  });

  const {
    data: inventoryPage,
    isLoading: loadingInventory,
    isFetching: fetchingInventory,
    error: inventoryError,
  } = useGetInventoryPageQuery(listQueryParams);

  const {
    data: inventoryStats,
    isLoading: loadingStats,
    isFetching: fetchingStats,
    isError: statsError,
  } = useGetInventoryStatsQuery(statsQueryParams);

  const fallbackBulkParams = useMemo(
    () => ({
      ...statsQueryParams,
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    }),
    [statsQueryParams],
  );

  const {
    data: fallbackInventory = [],
    isLoading: loadingFallbackInventory,
    isFetching: fetchingFallbackInventory,
  } = useGetInventoryListQuery(fallbackBulkParams, {
    skip: !statsError,
  });

  const inventoryList = inventoryPage?.items ?? [];
  const inventoryTotal = inventoryPage?.total ?? 0;

  useOrderHubPageClamp(
    catalogPage,
    inventoryPage?.total,
    STORAGE_PAGE_PARAM,
    setSearchParams,
    STORAGE_PAGE_SIZE,
  );

  const {
    data: incomingSummary = [],
    isError: incomingSummaryIsError,
    error: incomingSummaryError,
  } = useGetIncomingSummaryQuery(factoryId != null ? { factory_id: factoryId } : {});

  useEffect(() => {
    if (incomingSummaryIsError && import.meta.env.DEV) {
      console.warn('[Storage] incoming-summary request failed', incomingSummaryError);
    }
  }, [incomingSummaryIsError, incomingSummaryError]);

  const incomingSummaryErrorMessage = useMemo(() => {
    if (!incomingSummaryIsError || !incomingSummaryError) return null;
    const err = incomingSummaryError as FetchBaseQueryError;
    const status = err.status;
    if (status === 404 || status === 422) {
      return 'Incoming summary route not loaded — stop and restart your local backend (uvicorn), then hard-refresh this page.';
    }
    if (status === 500) {
      return 'Incoming summary failed on the server — check the backend terminal for the error traceback.';
    }
    if (typeof status === 'number') {
      return `Incoming summary request failed (HTTP ${status}). Check backend logs.`;
    }
    return 'Incoming summary request failed — is the backend running on localhost:8000?';
  }, [incomingSummaryIsError, incomingSummaryError]);

  const incomingByKey = useMemo(() => {
    const map = new Map<string, (typeof incomingSummary)[number]>();
    for (const row of incomingSummary) {
      map.set(incomingSummaryKey(row.factory_id, row.item_id), row);
    }
    return map;
  }, [incomingSummary]);

  const storageOverview = useMemo(() => {
    if (inventoryStats) {
      return storageOverviewFromStatsResponse(inventoryStats);
    }
    if (statsError) {
      const filtered = filterInventoryForStorageCatalog(fallbackInventory, activeFilters);
      return computeStorageOverviewFromInventory(filtered);
    }
    return emptyStorageOverview();
  }, [inventoryStats, statsError, fallbackInventory, activeFilters]);

  const kpiLoading =
    loadingStats ||
    fetchingStats ||
    (statsError && (loadingFallbackInventory || fetchingFallbackInventory));

  const [deleteInventory] = useDeleteInventoryMutation();

  const factoryLocationValue = useMemo(() => singleFactoryToSlice(factoryId), [factoryId]);

  const handleFactoryLocationChange = (slice: Partial<MachinesLocationFilterSlice>) => {
    if (slice.factory_ids === undefined) return;
    setFactoryId(sliceToSingleFactoryId({ factory_ids: slice.factory_ids }));
    patchStorageParams({});
  };

  const factoryLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const f of factories) {
      labels[f.id] = f.abbreviation ? `${f.name} (${f.abbreviation})` : f.name;
    }
    return labels;
  }, [factories]);

  const handleClearInventoryStock = async (inv: Inventory) => {
    if (
      !window.confirm(
        `Clear stock for "${inv.item_name ?? `Item #${inv.item_id}`}"? Quantity will be set to 0. Movement history is kept in the ledger.`,
      )
    )
      return;
    try {
      await deleteInventory(inv.id).unwrap();
      toast.success('Stock cleared');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to clear stock');
    }
  };

  const handleInventoryTypeFilterChange = (value: InventoryType | 'all') => {
    setInventoryTypeFilter(value);
    patchStorageParams({});
  };

  const handleShowZeroQtyChange = (value: boolean) => {
    setShowZeroQty(value);
    patchStorageParams({ includeZeroQty: value });
  };

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Archive className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No Factories Set Up</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            You need to create a factory before you can access storage. Set up a factory to start tracking your inventory.
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
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={`${appShellHeaderLeftGroupClass} min-w-0 flex-1`}>
              <div className={appShellHeaderIconTileClass} aria-hidden>
                <Archive className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Storage</h1>
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <MachinesInlineLocationFilters
                which="factories"
                variant="toolbar"
                selectionMode="single"
                value={factoryLocationValue}
                onChange={handleFactoryLocationChange}
                factories={factories}
                sections={[]}
                open={factoryPickerOpen}
                onOpenChange={setFactoryPickerOpen}
                highlight={factoryPickerHighlight}
                onHighlightDismiss={dismissFactoryPickerHighlight}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden bg-background p-8">
          <StorageKpiStrip
            factoryId={factoryId}
            factoryIds={factories.map((f) => f.id)}
            factoryLabels={factoryLabels}
            storageOverview={storageOverview}
            isLoading={kpiLoading}
          />
          <StorageSection
            factoryId={factoryId}
            factoryLabels={factoryLabels}
            overview={storageOverview}
            inventory={inventoryList}
            isLoading={loadingInventory}
            hasError={!!inventoryError}
            searchQuery={catalogFiltersFromUrl.searchQuery}
            showZeroQty={showZeroQty}
            onShowZeroQtyChange={handleShowZeroQtyChange}
            inventoryTypeFilter={inventoryTypeFilter}
            onInventoryTypeFilterChange={handleInventoryTypeFilterChange}
            onAdd={handleAddInventory}
            onRequireFactory={promptFactorySelect}
            onEdit={setEditingInventory}
            onClearStock={handleClearInventoryStock}
            incomingByKey={incomingByKey}
            incomingSummaryError={incomingSummaryIsError}
            incomingSummaryErrorMessage={incomingSummaryErrorMessage}
            paginationFooter={
              inventoryTotal > 0 ? (
                <ListPagePagination
                  page={catalogPage}
                  total={inventoryTotal}
                  pageSize={API_LIMITS.STORAGE_PAGE_SIZE}
                  isFetching={fetchingInventory}
                  onPageChange={(page) => patchStorageParams({ page }, { resetPage: false })}
                />
              ) : null
            }
            className="min-h-0 flex-1"
          />
        </div>
      </div>

      <AddInventoryDialog
        open={isAddInventoryOpen}
        onOpenChange={setIsAddInventoryOpen}
        factoryId={factoryId ?? 0}
        onSuccess={() => {}}
      />
      <EditInventoryDialog
        open={!!editingInventory}
        onOpenChange={(open) => !open && setEditingInventory(null)}
        inventory={editingInventory}
        onSuccess={() => setEditingInventory(null)}
      />
    </div>
  );
};

export default StoragePage;
