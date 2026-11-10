import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormatDateFromApi } from '@/hooks/useFormatDateFromApi';
import { useSearchParams } from 'react-router-dom';
import {
  parsePageFactoryFilterParam,
  usePageFactoryScope,
} from '@/hooks/usePageFactoryScope';
import PurchaseOrdersPageHeader from '@/components/newcomponents/customui/orders/PurchaseOrdersPageHeader';
import PurchaseOrderHeaderFilters from '@/components/newcomponents/customui/orders/PurchaseOrderHeaderFilters';
import {
  useGetPurchaseOrdersPageQuery,
  useGetPurchaseOrderHubStatsQuery,
  useGetPurchaseOrderByIdQuery,
  useGetPurchaseTourSampleQuery,
  useResetPurchaseTourSampleMutation,
  useDeletePurchaseOrderMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetProjectComponentsQuery } from '@/features/projectComponents/projectComponentsApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { appToast } from '@/lib/appToast';
import AddPurchaseOrderDialog from '@/components/newcomponents/customui/orders/AddPurchaseOrderDialog';
import PurchaseOrderDetailPanel from '@/components/newcomponents/customui/orders/PurchaseOrderDetailPanel';
import PurchaseOrdersOverviewPanel from '@/components/newcomponents/customui/orders/PurchaseOrdersOverviewPanel';
import PurchaseOrderNavigatorPanel from '@/components/newcomponents/customui/orders/PurchaseOrderNavigatorPanel';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import { type PurchaseOrderSummaryStats } from './purchaseOrdersOverviewData';
import { statusesForPoWorkflowFilter } from '@/components/newcomponents/customui/orders/purchaseOrderMilestones';
import { HELP_GUIDE_TOUR_ID } from '@/features/helpGuides/helpGuideTourIds';
import { useAutoHelpGuide } from '@/features/helpGuides/useAutoHelpGuide';
import {
  HELP_GUIDE_CLOSE_SAMPLE_EVENT,
  setPostTourSampleExplore,
} from '@/features/helpGuides/helpGuideSession';
import {
  useCloseFiltersOnTourEvent,
  useOpenFiltersOnTourEvent,
  useTourSampleDetail,
} from '@/features/helpGuides/useTourPreview';
import {
  clearPurchaseOrderFilterParams,
  parsePurchaseOrderParams,
  writePurchaseOrderParams,
  type PurchaseOrderUrlFilters,
} from './orderListUrlParams';
import {
  ORDER_HUB_PAGE_PARAMS,
  parseOrderHubPage,
} from './orderHubApiParams';
import {
  buildPurchaseOrderHubFilterParams,
  buildPurchaseOrderHubListParams,
} from './purchaseOrderHubApiParams';
import { API_LIMITS } from '@/constants/apiLimits';
import { useOrderHubPageClamp } from './useOrderHubPageClamp';
import OrderHubOffPageSelectionBanner from '@/components/newcomponents/customui/orders/OrderHubOffPageSelectionBanner';
import { isOrderSelectedOffFilteredPage } from './orderHubSelection';
import {
  resolvePurchaseOrderDestinationLabel,
  type PurchaseOrderDestinationLookups,
} from './resolvePurchaseOrderDestinationLabel';

const PurchaseOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const factorySeed = parsePageFactoryFilterParam(searchParams.get('factory'));
  const { factoryFilter, setPageFactory } = usePageFactoryScope({
    initialOverride: factorySeed,
  });

  useEffect(() => {
    if (!searchParams.has('factory')) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('factory');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const isLgScreen = useIsLgScreen();
  const { data: accounts = [] } = useGetAccountsQuery({
    skip: 0,
    limit: API_LIMITS.ACCOUNTS_LIST_MAX,
  });
  const { data: factories = [] } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: statuses = [] } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: machines = [] } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projects = [] } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projectComponents = [] } = useGetProjectComponentsQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const [deleteOrder] = useDeletePurchaseOrderMutation();

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

  const poStatusOptions = useMemo(() => statusesForPoWorkflowFilter(statuses), [statuses]);

  const urlFilters = useMemo(
    () => parsePurchaseOrderParams(searchParams, poStatusOptions),
    [searchParams, poStatusOptions]
  );

  const listPage = parseOrderHubPage(searchParams.get(ORDER_HUB_PAGE_PARAMS.purchase));

  const {
    dateRange,
    statusFilters,
    accountFilter,
    destinationFilter,
    invoiceFilter,
    searchQuery,
    showCompleteOrders,
    showVoidedOrders,
  } = urlFilters;

  const commitPurchaseFilters = useCallback(
    (patch: Partial<PurchaseOrderUrlFilters & { page?: number }>) => {
      if (patch.factoryFilter !== undefined) {
        setPageFactory(patch.factoryFilter);
      }
      const { factoryFilter: _factoryPatch, page: pagePatch, ...urlPatch } = patch;
      setSearchParams(
        (prev) => {
          const next = writePurchaseOrderParams(
            prev,
            { ...urlFilters, factoryFilter: 'all', ...urlPatch },
            poStatusOptions,
          );
          if (pagePatch != null) {
            if (pagePatch > 1) next.set(ORDER_HUB_PAGE_PARAMS.purchase, String(pagePatch));
            else next.delete(ORDER_HUB_PAGE_PARAMS.purchase);
          } else if (Object.keys(urlPatch).length > 0 || patch.factoryFilter !== undefined) {
            next.delete(ORDER_HUB_PAGE_PARAMS.purchase);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, urlFilters, setPageFactory, poStatusOptions],
  );

  useEffect(() => {
    setSearchInput(urlFilters.searchQuery);
  }, [urlFilters.searchQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === urlFilters.searchQuery.trim()) return;
      commitPurchaseFilters({ searchQuery: trimmed });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput, urlFilters.searchQuery, commitPurchaseFilters]);

  const hubFilterParams = useMemo(
    () => buildPurchaseOrderHubFilterParams(urlFilters, factoryFilter),
    [urlFilters, factoryFilter],
  );

  const listQueryParams = useMemo(
    () => buildPurchaseOrderHubListParams(urlFilters, factoryFilter, listPage),
    [urlFilters, factoryFilter, listPage],
  );

  const {
    data: pageData,
    isLoading,
    isFetching,
  } = useGetPurchaseOrdersPageQuery(listQueryParams);
  const { data: hubStats, isLoading: statsLoading } = useGetPurchaseOrderHubStatsQuery(hubFilterParams);

  const orders = useMemo(() => pageData?.items ?? [], [pageData]);
  const ordersTotal = pageData?.total ?? 0;

  useOrderHubPageClamp(listPage, pageData?.total, ORDER_HUB_PAGE_PARAMS.purchase, setSearchParams);

  const overviewStats = useMemo((): PurchaseOrderSummaryStats => {
    if (!hubStats) {
      return {
        totalCount: 0,
        totalValue: 0,
        openCount: 0,
        openValue: 0,
        notInvoicedCount: 0,
      };
    }
    return {
      totalCount: hubStats.total_count,
      totalValue: Number(hubStats.total_value),
      openCount: hubStats.open_count,
      openValue: Number(hubStats.open_value),
      notInvoicedCount: hubStats.not_invoiced_count,
    };
  }, [hubStats]);

  const selectedFromList = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const { data: selectedById, isError: selectedByIdError } = useGetPurchaseOrderByIdQuery(selectedOrderId!, {
    skip: selectedOrderId == null || selectedFromList != null,
  });
  const selectedOrder =
    selectedOrderId == null ? null : (selectedFromList ?? selectedById ?? null);
  const isOffFilteredPage = isOrderSelectedOffFilteredPage({
    selectedOrderId,
    selectedFromList,
    selectedById,
    selectedByIdError,
  });

  useAutoHelpGuide({
    tourId: HELP_GUIDE_TOUR_ID.purchaseOrders,
    when: !isLoading,
  });

  const tourSample = useTourSampleDetail([HELP_GUIDE_TOUR_ID.purchaseOrders]);
  const needTourSampleMeta =
    tourSample.tourActive || tourSample.postTourExplore || tourSample.sampleOpen;
  const { data: purchaseTourSample } = useGetPurchaseTourSampleQuery(undefined, {
    skip: !needTourSampleMeta,
  });
  const [resetPurchaseTourSample] = useResetPurchaseTourSampleMutation();
  const tourWasActiveRef = useRef(false);
  const sampleOpenWasRef = useRef(false);
  const purchaseTourSampleIdRef = useRef<number | null>(null);
  if (purchaseTourSample?.id != null) {
    purchaseTourSampleIdRef.current = purchaseTourSample.id;
  }
  useOpenFiltersOnTourEvent('po-filters-bar', setFiltersPopoverOpen);
  useCloseFiltersOnTourEvent('po-filters-bar', setFiltersPopoverOpen);
  useEffect(() => {
    if (!tourSample.tourActive) setFiltersPopoverOpen(false);
  }, [tourSample.tourActive]);

  const destinationLookups = useMemo((): PurchaseOrderDestinationLookups => {
    const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
    return {
      factories,
      machines,
      projectComponents: projectComponents.map((c) => ({
        id: c.id,
        name: c.name,
        project_id: c.project_id,
        project_name: projectNameById.get(c.project_id) ?? null,
      })),
    };
  }, [factories, machines, projectComponents, projects]);

  const selectedOrderFromUrl = searchParams.get('orderId');

  useEffect(() => {
    // Tour owns selection: start clears URL/state; sample step sets via setSelectedOrder only.
    // Skip hydrating from URL while tour runs so a lingering orderId cannot re-select before the tour effect runs.
    if (tourSample.tourActive) return;

    if (!selectedOrderFromUrl) return;
    const parsed = Number(selectedOrderFromUrl);
    if (Number.isNaN(parsed)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('orderId');
          return next;
        },
        { replace: true },
      );
      return;
    }
    if (
      !tourSample.tourActive &&
      !tourSample.postTourExplore &&
      purchaseTourSampleIdRef.current != null &&
      parsed === purchaseTourSampleIdRef.current
    ) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('orderId');
          return next;
        },
        { replace: true },
      );
      return;
    }
    setSelectedOrderId(parsed);
  }, [selectedOrderFromUrl, setSearchParams, tourSample.tourActive, tourSample.postTourExplore]);

  useEffect(() => {
    if (selectedOrderId == null || selectedFromList != null || !selectedByIdError) return;
    setSelectedOrderId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      },
      { replace: true },
    );
  }, [selectedOrderId, selectedFromList, selectedByIdError, setSearchParams]);

  const setSelectedOrder = (orderId: number | null) => {
    setSelectedOrderId(orderId);
    if (orderId == null) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('orderId');
          return next;
        },
        { replace: true },
      );
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('orderId', String(orderId));
      return next;
    });
  };

  const exitPostTourSampleExplore = useCallback(() => {
    setPostTourSampleExplore(false);
    tourSample.closeSample();
    const sampleId = purchaseTourSampleIdRef.current;
    if (sampleId != null && selectedOrderId === sampleId) {
      setSelectedOrderId(null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('orderId');
          return next;
        },
        { replace: true },
      );
    }
    void resetPurchaseTourSample()
      .unwrap()
      .catch(() => {
        appToast.error('Could not restore the sample order');
      });
  }, [
    resetPurchaseTourSample,
    selectedOrderId,
    setSearchParams,
    tourSample.closeSample,
  ]);

  const postTourExploreToastShownRef = useRef(false);

  useEffect(() => {
    if (!tourSample.postTourExplore) {
      postTourExploreToastShownRef.current = false;
      return;
    }
    if (postTourExploreToastShownRef.current) return;
    postTourExploreToastShownRef.current = true;
    appToast.success('Tour complete — explore the sample PO. Use Back when you are done.');
  }, [tourSample.postTourExplore]);

  useEffect(() => {
    const active = tourSample.tourActive;
    if (active === tourWasActiveRef.current) return;
    tourWasActiveRef.current = active;

    if (active) {
      setPostTourSampleExplore(false);
      tourSample.closeSample();
      sampleOpenWasRef.current = false;
      setSelectedOrderId(null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('orderId');
          return next;
        },
        { replace: true },
      );
      void resetPurchaseTourSample()
        .unwrap()
        .catch(() => {
          appToast.error('Could not restore the sample order');
        });
      return;
    }

    if (tourSample.postTourExplore) {
      if (typeof document !== 'undefined') {
        requestAnimationFrame(() => {
          const el = document.activeElement;
          if (el instanceof HTMLElement) el.blur();
        });
      }
      return;
    }

    tourSample.closeSample();
    sampleOpenWasRef.current = false;
    setSelectedOrderId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      },
      { replace: true },
    );
    void resetPurchaseTourSample()
      .unwrap()
      .catch(() => {
        appToast.error('Could not restore the sample order');
      });
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        const el = document.activeElement;
        if (el instanceof HTMLElement) el.blur();
      });
    }
  }, [
    tourSample.tourActive,
    tourSample.postTourExplore,
    tourSample.closeSample,
    resetPurchaseTourSample,
    setSearchParams,
  ]);

  /** Sample off overview while guide off — unless post-tour explore. */
  useEffect(() => {
    if (tourSample.tourActive || tourSample.postTourExplore) return;
    const sampleId = purchaseTourSampleIdRef.current;
    if (sampleId == null || selectedOrderId !== sampleId) return;
    setSelectedOrderId(null);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      },
      { replace: true },
    );
  }, [tourSample.tourActive, tourSample.postTourExplore, selectedOrderId, setSearchParams]);

  /** Back to overview or pick another PO — end explore and reset sample. */
  useEffect(() => {
    if (!tourSample.postTourExplore) return;
    const sampleId = purchaseTourSampleIdRef.current;
    if (sampleId == null) return;
    if (selectedOrderId === sampleId) return;
    exitPostTourSampleExplore();
  }, [tourSample.postTourExplore, selectedOrderId, exitPostTourSampleExplore]);

  useEffect(() => {
    const onCloseSample = () => {
      const sampleId = purchaseTourSampleIdRef.current;
      setSelectedOrderId((current) => {
        if (sampleId == null || current !== sampleId) return current;
        return null;
      });
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (sampleId == null || next.get('orderId') !== String(sampleId)) return prev;
          next.delete('orderId');
          return next;
        },
        { replace: true },
      );
    };
    window.addEventListener(HELP_GUIDE_CLOSE_SAMPLE_EVENT, onCloseSample);
    return () => window.removeEventListener(HELP_GUIDE_CLOSE_SAMPLE_EVENT, onCloseSample);
  }, [setSearchParams]);

  useEffect(() => {
    const open = tourSample.sampleOpen;
    if (!open) {
      sampleOpenWasRef.current = false;
      return;
    }
    // Wait for sample id — do not mark "was open" until then or Next on sample step never selects (RTK race).
    if (purchaseTourSample == null) return;

    const wasOpen = sampleOpenWasRef.current;
    sampleOpenWasRef.current = true;
    if (wasOpen) return;
    if (selectedOrderId === purchaseTourSample.id) return;
    setSelectedOrder(purchaseTourSample.id);
  }, [tourSample.sampleOpen, purchaseTourSample, selectedOrderId]);

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const accountName = (id: number | null) =>
    id == null ? 'No supplier' : accounts.find((a) => a.id === id)?.name ?? `Account #${id}`;
  const statusLabel = (id: number) => statusMap.get(id) ?? `#${id}`;
  const destinationLabel = (order: PurchaseOrder) =>
    resolvePurchaseOrderDestinationLabel(order, destinationLookups);
  const formatDate = useFormatDateFromApi();

  const hasActiveFilters =
    dateRange.from != null ||
    dateRange.to != null ||
    statusFilters.length > 0 ||
    accountFilter !== 'all' ||
    factoryFilter !== 'all' ||
    destinationFilter !== 'all' ||
    invoiceFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setPageFactory('all');
    setSelectedOrderId(null);
    setSearchParams(
      (prev) => {
        const next = clearPurchaseOrderFilterParams(prev);
        next.delete('orderId');
        return next;
      },
      { replace: true },
    );
  };

  const handleDelete = async (o: PurchaseOrder) => {
    if (!window.confirm(`Delete purchase order ${o.po_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      appToast.success('Purchase order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PurchaseOrdersPageHeader
          selectedOrderNumber={selectedOrder?.po_number ?? null}
          onClearSelection={() => setSelectedOrder(null)}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onAdd={() => setIsAddOpen(true)}
          headerToolbarExtras={
            <PurchaseOrderHeaderFilters
              open={filtersPopoverOpen}
              onOpenChange={setFiltersPopoverOpen}
              dateRange={dateRange}
              onDateRangeChange={(next) => commitPurchaseFilters({ dateRange: next })}
              statusFilters={statusFilters}
              onStatusFiltersChange={(selectedIds) =>
                commitPurchaseFilters({ statusFilters: selectedIds })
              }
              poStatusOptions={poStatusOptions}
              accountFilter={accountFilter}
              onAccountFilterChange={(value) => commitPurchaseFilters({ accountFilter: value })}
              accounts={accounts}
              factoryFilter={factoryFilter}
              onFactoryFilterChange={(value) => commitPurchaseFilters({ factoryFilter: value })}
              factories={factories}
              destinationFilter={destinationFilter}
              onDestinationFilterChange={(value) =>
                commitPurchaseFilters({ destinationFilter: value })
              }
              invoiceFilter={invoiceFilter}
              onInvoiceFilterChange={(value) => commitPurchaseFilters({ invoiceFilter: value })}
              showVoidedOrders={showVoidedOrders}
              onShowVoidedOrdersChange={(value) =>
                commitPurchaseFilters({ showVoidedOrders: value })
              }
              onClearFilters={clearFilters}
            />
          }
        />

        {/* Main content area: navigator (left) + content (right) */}
        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          {/* Navigator panel */}
          <PurchaseOrderNavigatorPanel
            className={cn(
              (selectedOrder || tourSample.sampleOpen) && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0'
            )}
            orders={orders}
            ordersTotal={ordersTotal}
            listPage={listPage}
            isFetching={isFetching}
            onPageChange={(page) => commitPurchaseFilters({ page })}
            selectedOrderId={selectedOrderId}
            offPageSelectedLabel={
              isOffFilteredPage && selectedOrder && !selectedOrder.is_tour_sample
                ? selectedOrder.po_number
                : null
            }
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={(value) =>
              commitPurchaseFilters({ showCompleteOrders: value })
            }
            emptyHintNoOpen={!showCompleteOrders && !hasActiveFilters}
            onSelectOrder={(id) => {
              if (tourSample.postTourExplore) exitPostTourSampleExplore();
              tourSample.closeSample();
              setSelectedOrder(id);
            }}
            showSample={tourSample.tourActive || tourSample.postTourExplore}
            hideRealOrders={tourSample.tourActive}
            sampleSelected={
              tourSample.sampleOpen || selectedOrderId === purchaseTourSample?.id
            }
            onSelectSample={() => {
              tourSample.openSample();
              if (purchaseTourSample) setSelectedOrder(purchaseTourSample.id);
            }}
            onDeleteOrder={handleDelete}
            onAddOrder={() => setIsAddOpen(true)}
            accountName={accountName}
            destinationLabel={destinationLabel}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          {/* Content panel (overview or detail) */}
          <div
            className={cn(
              'flex-1 min-w-0 min-h-0 overflow-hidden',
              !selectedOrder && !tourSample.sampleOpen && 'max-lg:hidden'
            )}
          >
            {selectedOrder ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                {isOffFilteredPage && !selectedOrder.is_tour_sample ? (
                  <OrderHubOffPageSelectionBanner orderLabel={selectedOrder.po_number} />
                ) : null}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <PurchaseOrderDetailPanel
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    skipOrderRefetch={selectedFromList != null}
                    showCompleteOrders={showCompleteOrders}
                  />
                </div>
              </div>
            ) : isLgScreen ? (
              <PurchaseOrdersOverviewPanel
                orders={orders}
                stats={overviewStats}
                hubStats={hubStats}
                isLoading={isLoading || statsLoading}
                accountName={accountName}
                statusLabel={statusLabel}
                hideOrderLists={tourSample.tourActive}
                onSelectOrder={(id) => {
                  if (tourSample.postTourExplore) exitPostTourSampleExplore();
                  tourSample.closeSample();
                  setSelectedOrder(id);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <AddPurchaseOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        accounts={accounts}
        factories={factories}
        onSuccess={(order) => {
          setSelectedOrder(order.id);
          setIsAddOpen(false);
        }}
      />
    </>
  );
};

export default PurchaseOrdersPage;
