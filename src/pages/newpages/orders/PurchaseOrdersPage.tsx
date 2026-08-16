import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDateFromApi } from '@/hooks/useFormatDateFromApi';
import { useSearchParams } from 'react-router-dom';
import {
  parsePageFactoryFilterParam,
  usePageFactoryScope,
} from '@/hooks/usePageFactoryScope';
import { format } from 'date-fns';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import PurchaseOrdersPageHeader from '@/components/newcomponents/customui/orders/PurchaseOrdersPageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  useGetPurchaseOrdersPageQuery,
  useGetPurchaseOrderHubStatsQuery,
  useGetPurchaseOrderByIdQuery,
  useDeletePurchaseOrderMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetProjectComponentsQuery } from '@/features/projectComponents/projectComponentsApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { CalendarIcon, X } from 'lucide-react';
import { appToast } from '@/lib/appToast';
import AddPurchaseOrderDialog from '@/components/newcomponents/customui/orders/AddPurchaseOrderDialog';
import PurchaseOrderDetailPanel from '@/components/newcomponents/customui/orders/PurchaseOrderDetailPanel';
import PurchaseOrdersOverviewPanel from '@/components/newcomponents/customui/orders/PurchaseOrdersOverviewPanel';
import PurchaseOrderNavigatorPanel from '@/components/newcomponents/customui/orders/PurchaseOrderNavigatorPanel';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import {
  type DestinationTypeFilter,
  type InvoiceFilter,
  type PurchaseOrderSummaryStats,
} from './purchaseOrdersOverviewData';
import { statusesForPoWorkflowFilter } from '@/components/newcomponents/customui/orders/purchaseOrderMilestones';
import OrderStatusMultiFilter from '@/components/newcomponents/customui/orders/OrderStatusMultiFilter';
import {
  clearPurchaseOrderFilterParams,
  hasActiveListFilters,
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

const DESTINATION_FILTER_LABELS: Record<DestinationTypeFilter, string> = {
  all: 'All destinations',
  storage: 'Storage',
  machine: 'Machine',
  project: 'Project',
};

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
  const [filtersBarOpen, setFiltersBarOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'purchase')
  );
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
  const selectedOrder = selectedFromList ?? selectedById ?? null;
  const isOffFilteredPage = isOrderSelectedOffFilteredPage({
    selectedOrderId,
    selectedFromList,
    selectedById,
    selectedByIdError,
  });

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange.from != null || dateRange.to != null) count += 1;
    if (statusFilters.length > 0) count += 1;
    if (accountFilter !== 'all') count += 1;
    if (factoryFilter !== 'all') count += 1;
    if (destinationFilter !== 'all') count += 1;
    if (invoiceFilter !== 'all') count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    if (showVoidedOrders) count += 1;
    return count;
  }, [
    dateRange.from,
    dateRange.to,
    statusFilters,
    accountFilter,
    factoryFilter,
    destinationFilter,
    invoiceFilter,
    searchQuery,
    showVoidedOrders,
  ]);

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
        />

        {/* Synced filters — affect navigator list + overview/detail */}
        {filtersBarOpen ? (
        <div
          id="po-filters-bar"
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
                  commitPurchaseFilters({ dateRange: { from: r?.from, to: r?.to } })
                }
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">Filters by created date</span>

          <OrderStatusMultiFilter
            options={poStatusOptions}
            selectedIds={statusFilters}
            onChange={(selectedIds) => commitPurchaseFilters({ statusFilters: selectedIds })}
            triggerClassName="w-[160px]"
          />

          <Select
            value={accountFilter}
            onValueChange={(value) => commitPurchaseFilters({ accountFilter: value })}
          >
            <SelectTrigger className={`w-[160px] h-9 border-border bg-background text-sm`}>
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All suppliers</SelectItem>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={factoryFilter}
            onValueChange={(value) => commitPurchaseFilters({ factoryFilter: value })}
          >
            <SelectTrigger className={`w-[140px] h-9 border-border bg-background text-sm`}>
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
            value={destinationFilter}
            onValueChange={(v) =>
              commitPurchaseFilters({ destinationFilter: v as DestinationTypeFilter })
            }
          >
            <SelectTrigger className={`w-[150px] h-9 border-border bg-background text-sm`}>
              <SelectValue placeholder="All destinations">
                {DESTINATION_FILTER_LABELS[destinationFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All destinations</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="machine">Machine</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={invoiceFilter}
            onValueChange={(v) => commitPurchaseFilters({ invoiceFilter: v as InvoiceFilter })}
          >
            <SelectTrigger className={`w-[130px] h-9 border-border bg-background text-sm`}>
              <SelectValue placeholder="Invoice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All invoices</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="not_invoiced">Not invoiced</SelectItem>
              <SelectItem value="outstanding_payment">Outstanding payment</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="po-show-voided-filters"
                checked={showVoidedOrders}
                onCheckedChange={(value) => commitPurchaseFilters({ showVoidedOrders: value })}
                aria-label="Show voided orders"
              />
              <Label
                htmlFor="po-show-voided-filters"
                className="cursor-pointer text-sm font-normal text-muted-foreground whitespace-nowrap"
              >
                Show voided
              </Label>
            </div>
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

        {/* Main content area: navigator (left) + content (right) */}
        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          {/* Navigator panel */}
          <PurchaseOrderNavigatorPanel
            className={cn(
              selectedOrder && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0'
            )}
            orders={orders}
            ordersTotal={ordersTotal}
            listPage={listPage}
            isFetching={isFetching}
            onPageChange={(page) => commitPurchaseFilters({ page })}
            selectedOrderId={selectedOrderId}
            offPageSelectedLabel={
              isOffFilteredPage && selectedOrder ? selectedOrder.po_number : null
            }
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            filtersOpen={filtersBarOpen}
            onToggleFilters={() => setFiltersBarOpen((open) => !open)}
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={(value) =>
              commitPurchaseFilters({ showCompleteOrders: value })
            }
            emptyHintNoOpen={!showCompleteOrders && !hasActiveFilters}
            onSelectOrder={(id) => setSelectedOrder(id)}
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
              !selectedOrder && 'max-lg:hidden'
            )}
          >
            {selectedOrder ? (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                {isOffFilteredPage ? (
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
                onSelectOrder={(id) => setSelectedOrder(id)}
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
