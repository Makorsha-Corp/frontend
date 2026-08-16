import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDateFromApi } from '@/hooks/useFormatDateFromApi';
import { useSearchParams } from 'react-router-dom';
import {
  parsePageFactoryFilterParam,
  usePageFactoryScope,
} from '@/hooks/usePageFactoryScope';
import { format } from 'date-fns';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { ArrowLeftRight, CalendarIcon, X } from 'lucide-react';
import { appToast } from '@/lib/appToast';
import TransferOrderDetailPanel from '@/components/newcomponents/customui/orders/TransferOrderDetailPanel';
import { TransferRouteDisplay } from '@/components/newcomponents/customui/orders/TransferRouteDisplay';
import TransferOrdersOverviewPanel from '@/components/newcomponents/customui/orders/TransferOrdersOverviewPanel';
import TransferOrderNavigatorPanel from '@/components/newcomponents/customui/orders/TransferOrderNavigatorPanel';
import { ShowCompleteOrdersSwitchControl } from '@/components/newcomponents/customui/orders/ShowCompleteOrdersSwitch';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import AddTransferOrderDialog from '@/components/newcomponents/customui/orders/AddTransferOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  type TransferLocationTypeFilter,
  type TransferOrderSummaryStats,
} from './transferOrdersOverviewData';
import {
  type TransferLocationLabelContext,
  transferRouteLabel,
} from './transferOrderLocationLabels';
import { statusesForTrWorkflowFilter } from '@/components/newcomponents/customui/orders/transferOrderMilestones';
import OrderStatusMultiFilter from '@/components/newcomponents/customui/orders/OrderStatusMultiFilter';
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

const LOCATION_TYPE_OPTIONS: { value: TransferLocationTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'storage', label: 'Storage' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged' },
];

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
  const [filtersBarOpen, setFiltersBarOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'transfer')
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
    [searchParams, trStatusOptions]
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
    [factories, machines, projects]
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
    searchQuery.trim().length > 0;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange.from != null || dateRange.to != null) count += 1;
    if (statusFilters.length > 0) count += 1;
    if (factoryFilter !== 'all') count += 1;
    if (sourceTypeFilter !== 'all') count += 1;
    if (destinationTypeFilter !== 'all') count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    return count;
  }, [
    dateRange.from,
    dateRange.to,
    statusFilters,
    factoryFilter,
    sourceTypeFilter,
    destinationTypeFilter,
    searchQuery,
  ]);

  const clearFilters = () => {
    setPageFactory('all');
    setSelectedOrderId(null);
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
        />

        {filtersBarOpen ? (
          <div
            id="tr-filters-bar"
            className="shrink-0 border-b border-border bg-card/50 px-4 py-3 flex flex-wrap items-center gap-2"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`min-w-[200px] justify-start border-border bg-background ${appShellHeaderControlClass}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                    ) : (
                      format(dateRange.from, 'MMM d')
                    )
                  ) : (
                    'All dates'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(r) =>
                    commitTransferFilters({ dateRange: { from: r?.from, to: r?.to } })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">Filters by created date</span>

            <OrderStatusMultiFilter
              options={trStatusOptions}
              selectedIds={statusFilters}
              onChange={(selectedIds) => commitTransferFilters({ statusFilters: selectedIds })}
              triggerClassName="w-[160px]"
            />

            <Select
              value={factoryFilter}
              onValueChange={(value) => commitTransferFilters({ factoryFilter: value })}
            >
              <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
                <SelectValue placeholder="Factory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All factories</SelectItem>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sourceTypeFilter}
              onValueChange={(v) =>
                commitTransferFilters({ sourceTypeFilter: v as TransferLocationTypeFilter })
              }
            >
              <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={`src-${opt.value}`} value={opt.value}>
                    {opt.value === 'all' ? 'All sources' : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={destinationTypeFilter}
              onValueChange={(v) =>
                commitTransferFilters({ destinationTypeFilter: v as TransferLocationTypeFilter })
              }
            >
              <SelectTrigger className="w-[150px] h-9 border-border bg-background text-sm">
                <SelectValue placeholder="All destinations">
                  {destinationTypeFilter === 'all'
                    ? 'All destinations'
                    : LOCATION_TYPE_OPTIONS.find((o) => o.value === destinationTypeFilter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={`dst-${opt.value}`} value={opt.value}>
                    {opt.value === 'all' ? 'All destinations' : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <ShowCompleteOrdersSwitchControl
                checked={showCompleteOrders}
                onCheckedChange={(value) =>
                  commitTransferFilters({ showCompleteOrders: value })
                }
                context="list"
              />
              {activeFilterCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={clearFilters}
                  aria-label="Clear filters"
                  title="Clear filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          <TransferOrderNavigatorPanel
            className={cn(
              selectedOrder && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0'
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
            activeFilterCount={activeFilterCount}
            filtersOpen={filtersBarOpen}
            onToggleFilters={() => setFiltersBarOpen((open) => !open)}
            emptyHintNoOpen={!showCompleteOrders && !hasActiveFilters}
            onSelectOrder={(id) => setSelectedOrder(id)}
            onDeleteOrder={handleDelete}
            onAddOrder={() => setIsAddOpen(true)}
            routeLabel={renderRouteLabel}
            formatDate={formatDate}
          />

          <div
            className={cn(
              'flex-1 min-w-0 min-h-0 overflow-hidden',
              !selectedOrder && 'max-lg:hidden'
            )}
          >
            {selectedOrder ? (
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
                onSelectOrder={(id) => setSelectedOrder(id)}
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
