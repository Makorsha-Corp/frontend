import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDateFromApi } from '@/hooks/useFormatDateFromApi';
import { useSearchParams } from 'react-router-dom';
import {
  parsePageFactoryFilterParam,
  usePageFactoryScope,
} from '@/hooks/usePageFactoryScope';
import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';
import TransferOrderHeaderFilters from '@/components/newcomponents/customui/orders/TransferOrderHeaderFilters';
import {
  useGetTransferOrdersPageQuery,
  useGetTransferOrderHubStatsQuery,
  useGetTransferOrderByIdQuery,
  useDeleteTransferOrderMutation,
} from '@/features/transferOrders/transferOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { TransferOrder } from '@/types/transferOrder';
import { ArrowLeftRight } from 'lucide-react';
import { appToast } from '@/lib/appToast';
import TransferOrderDetailPanel from '@/components/newcomponents/customui/orders/TransferOrderDetailPanel';
import { TransferRouteDisplay } from '@/components/newcomponents/customui/orders/TransferRouteDisplay';
import TransferOrdersOverviewPanel from '@/components/newcomponents/customui/orders/TransferOrdersOverviewPanel';
import TransferOrderNavigatorPanel from '@/components/newcomponents/customui/orders/TransferOrderNavigatorPanel';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import AddTransferOrderDialog from '@/components/newcomponents/customui/orders/AddTransferOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import { type TransferOrderSummaryStats } from './transferOrdersOverviewData';
import {
  type TransferLocationLabelContext,
  transferRouteLabel,
} from './transferOrderLocationLabels';
import { statusesForTrWorkflowFilter } from '@/components/newcomponents/customui/orders/transferOrderMilestones';
import { HELP_GUIDE_TOUR_ID } from '@/features/helpGuides/helpGuideTourIds';
import { useAutoHelpGuide } from '@/features/helpGuides/useAutoHelpGuide';
import {
  useCloseFiltersOnTourEvent,
  useOpenFiltersOnTourEvent,
  useResetSelectionWhenTourStarts,
  useTourSampleDetail,
} from '@/features/helpGuides/useTourPreview';
import TransferOrderTourSampleDetail from '@/components/newcomponents/customui/helpGuides/TransferOrderTourSampleDetail';
import {
  clearTransferOrderFilterParams,
  hasActiveListFilters,
  parseTransferOrderParams,
  writeTransferOrderParams,
  type TransferOrderUrlFilters,
} from './orderListUrlParams';
import {
  ORDER_HUB_PAGE_PARAMS,
  parseOrderHubPage,
} from './orderHubApiParams';
import {
  buildTransferOrderHubFilterParams,
  buildTransferOrderHubListParams,
} from './transferOrderHubApiParams';
import { useOrderHubPageClamp } from './useOrderHubPageClamp';
import OrderHubOffPageSelectionBanner from '@/components/newcomponents/customui/orders/OrderHubOffPageSelectionBanner';
import { isOrderSelectedOffFilteredPage } from './orderHubSelection';

const TransferOrdersPage: React.FC = () => {
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
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'transfer'),
  );
  const [searchInput, setSearchInput] = useState('');
  const isLgScreen = useIsLgScreen();
  const { data: statuses = [] } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: factories = [] } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: machines = [] } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projects = [] } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const [deleteOrder] = useDeleteTransferOrderMutation();

  const trStatusOptions = useMemo(() => statusesForTrWorkflowFilter(statuses), [statuses]);

  const urlFilters = useMemo(
    () => parseTransferOrderParams(searchParams, trStatusOptions),
    [searchParams, trStatusOptions],
  );

  const listPage = parseOrderHubPage(searchParams.get(ORDER_HUB_PAGE_PARAMS.transfer));

  const {
    dateRange,
    statusFilters,
    sourceTypeFilter,
    destinationTypeFilter,
    searchQuery,
    showCompleteOrders,
  } = urlFilters;

  const commitTransferFilters = useCallback(
    (patch: Partial<TransferOrderUrlFilters & { page?: number }>) => {
      if (patch.factoryFilter !== undefined) {
        setPageFactory(patch.factoryFilter);
      }
      const { factoryFilter: _factoryPatch, page: pagePatch, ...urlPatch } = patch;
      setSearchParams(
        (prev) => {
          const next = writeTransferOrderParams(
            prev,
            { ...urlFilters, factoryFilter: 'all', ...urlPatch },
            trStatusOptions,
          );
          if (pagePatch != null) {
            if (pagePatch > 1) next.set(ORDER_HUB_PAGE_PARAMS.transfer, String(pagePatch));
            else next.delete(ORDER_HUB_PAGE_PARAMS.transfer);
          } else if (Object.keys(urlPatch).length > 0 || patch.factoryFilter !== undefined) {
            next.delete(ORDER_HUB_PAGE_PARAMS.transfer);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, urlFilters, setPageFactory, trStatusOptions],
  );

  useEffect(() => {
    setSearchInput(urlFilters.searchQuery);
  }, [urlFilters.searchQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === urlFilters.searchQuery.trim()) return;
      commitTransferFilters({ searchQuery: trimmed });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput, urlFilters.searchQuery, commitTransferFilters]);

  const hubFilterParams = useMemo(
    () => buildTransferOrderHubFilterParams(urlFilters, factoryFilter),
    [urlFilters, factoryFilter],
  );

  const listQueryParams = useMemo(
    () => buildTransferOrderHubListParams(urlFilters, factoryFilter, listPage),
    [urlFilters, factoryFilter, listPage],
  );

  const {
    data: pageData,
    isLoading,
    isFetching,
  } = useGetTransferOrdersPageQuery(listQueryParams);
  const { data: hubStats, isLoading: statsLoading } = useGetTransferOrderHubStatsQuery(hubFilterParams);

  const orders = useMemo(() => pageData?.items ?? [], [pageData]);
  const ordersTotal = pageData?.total ?? 0;

  useOrderHubPageClamp(listPage, pageData?.total, ORDER_HUB_PAGE_PARAMS.transfer, setSearchParams);

  const labelCtx: TransferLocationLabelContext = useMemo(
    () => ({ factories, machines, projects }),
    [factories, machines, projects],
  );

  const overviewStats = useMemo((): TransferOrderSummaryStats => {
    if (!hubStats) {
      return {
        totalCount: 0,
        openCount: 0,
        completedCount: 0,
        machineInvolvedCount: 0,
      };
    }
    return {
      totalCount: hubStats.total_count,
      openCount: hubStats.open_count,
      completedCount: hubStats.completed_count,
      machineInvolvedCount: hubStats.machine_involved_count ?? 0,
    };
  }, [hubStats]);

  const selectedFromList = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );
  const { data: selectedById, isError: selectedByIdError } = useGetTransferOrderByIdQuery(selectedOrderId!, {
    skip: selectedOrderId == null || selectedFromList != null,
  });
  const selectedOrder = selectedFromList ?? selectedById ?? null;
  const isOffFilteredPage = isOrderSelectedOffFilteredPage({
    selectedOrderId,
    selectedFromList,
    selectedById,
    selectedByIdError,
  });

  useAutoHelpGuide({
    tourId: HELP_GUIDE_TOUR_ID.transferOrders,
    when: !isLoading,
  });

  const tourSample = useTourSampleDetail([HELP_GUIDE_TOUR_ID.transferOrders]);
  useOpenFiltersOnTourEvent('tr-filters-bar', setFiltersPopoverOpen);
  useCloseFiltersOnTourEvent('tr-filters-bar', setFiltersPopoverOpen);

  const selectedOrderFromUrl = searchParams.get('orderId');

  useEffect(() => {
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
    setSelectedOrderId(parsed);
  }, [selectedOrderFromUrl, setSearchParams]);

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
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      });
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('orderId', String(orderId));
      return next;
    });
  };

  useResetSelectionWhenTourStarts(tourSample.tourActive, () => {
    tourSample.closeSample();
    setSelectedOrder(null);
  });

  const renderRouteLabel = (order: TransferOrder) => (
    <TransferRouteDisplay order={order} ctx={labelCtx} />
  );
  const formatDate = useFormatDateFromApi();

  const hasActiveFilters =
    dateRange.from != null ||
    dateRange.to != null ||
    statusFilters.length > 0 ||
    factoryFilter !== 'all' ||
    sourceTypeFilter !== 'all' ||
    destinationTypeFilter !== 'all' ||
    showCompleteOrders ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setPageFactory('all');
    setSelectedOrderId(null);
    setFiltersPopoverOpen(false);
    setSearchParams(
      (prev) => {
        const next = clearTransferOrderFilterParams(prev);
        next.delete('orderId');
        return next;
      },
      { replace: true },
    );
  };

  const handleDelete = async (o: TransferOrder) => {
    if (!window.confirm(`Delete transfer order ${o.transfer_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      appToast.success('Transfer order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <OrderHubShellHeader
          icon={ArrowLeftRight}
          title="Transfer Orders"
          selectedOrderLabel={selectedOrder?.transfer_number ?? null}
          onClearSelection={() => setSelectedOrder(null)}
          backAriaLabel="Back to transfer orders"
          closeSelectionAriaLabel="Close transfer order"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          searchPlaceholder="Search by TR# or route..."
          searchAriaLabel="Search transfer orders"
          onAdd={() => setIsAddOpen(true)}
          addButtonLabel="Add Transfer Order"
          addAriaLabel="Add transfer order"
          helpGuideKind="transfer"
          headerToolbarExtras={
            <TransferOrderHeaderFilters
              open={filtersPopoverOpen}
              onOpenChange={setFiltersPopoverOpen}
              dateRange={dateRange}
              onDateRangeChange={(next) => commitTransferFilters({ dateRange: next })}
              statusFilters={statusFilters}
              onStatusFiltersChange={(selectedIds) =>
                commitTransferFilters({ statusFilters: selectedIds })
              }
              trStatusOptions={trStatusOptions}
              factoryFilter={factoryFilter}
              onFactoryFilterChange={(value) => commitTransferFilters({ factoryFilter: value })}
              factories={factories}
              sourceTypeFilter={sourceTypeFilter}
              onSourceTypeFilterChange={(v) =>
                commitTransferFilters({ sourceTypeFilter: v })
              }
              destinationTypeFilter={destinationTypeFilter}
              onDestinationTypeFilterChange={(v) =>
                commitTransferFilters({ destinationTypeFilter: v })
              }
              showCompleteOrders={showCompleteOrders}
              onShowCompleteOrdersChange={(value) =>
                commitTransferFilters({ showCompleteOrders: value })
              }
              onClearFilters={clearFilters}
            />
          }
        />

        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          <TransferOrderNavigatorPanel
            className={cn(
              (selectedOrder || tourSample.sampleOpen) && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0',
            )}
            orders={orders}
            ordersTotal={ordersTotal}
            listPage={listPage}
            isFetching={isFetching}
            onPageChange={(page) => commitTransferFilters({ page })}
            selectedOrderId={selectedOrderId}
            offPageSelectedLabel={
              isOffFilteredPage && selectedOrder ? selectedOrder.transfer_number : null
            }
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={(value) =>
              commitTransferFilters({ showCompleteOrders: value })
            }
            emptyHintNoOpen={!showCompleteOrders && !hasActiveFilters}
            onSelectOrder={(id) => {
              tourSample.closeSample();
              setSelectedOrder(id);
            }}
            showSample={tourSample.tourActive}
            hideRealOrders={tourSample.tourActive}
            sampleSelected={tourSample.sampleOpen}
            onSelectSample={() => {
              setSelectedOrder(null);
              tourSample.openSample();
            }}
            onDeleteOrder={handleDelete}
            onAddOrder={() => setIsAddOpen(true)}
            routeLabel={renderRouteLabel}
            formatDate={formatDate}
          />

          <div
            className={cn(
              'flex-1 min-w-0 min-h-0 overflow-hidden',
              !selectedOrder && !tourSample.sampleOpen && 'max-lg:hidden',
            )}
          >
            {tourSample.sampleOpen ? (
              <TransferOrderTourSampleDetail />
            ) : selectedOrder ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                {isOffFilteredPage ? (
                  <OrderHubOffPageSelectionBanner orderLabel={selectedOrder.transfer_number} />
                ) : null}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <TransferOrderDetailPanel
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    skipOrderRefetch={selectedFromList != null}
                    showCompleteOrders={showCompleteOrders}
                  />
                </div>
              </div>
            ) : isLgScreen ? (
              <TransferOrdersOverviewPanel
                orders={orders}
                stats={overviewStats}
                hubStats={hubStats}
                isLoading={isLoading || statsLoading}
                routeSubtext={(o) => transferRouteLabel(o, labelCtx)}
                hideOrderLists={tourSample.tourActive}
                onSelectOrder={(id) => {
                  tourSample.closeSample();
                  setSelectedOrder(id);
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <AddTransferOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(createdOrder) => {
          setSelectedOrder(createdOrder.id);
          setIsAddOpen(false);
        }}
      />
    </>
  );
};

export default TransferOrdersPage;
