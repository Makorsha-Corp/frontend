import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  useGetTransferOrdersQuery,
  useDeleteTransferOrderMutation,
} from '@/features/transferOrders/transferOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { TransferOrder } from '@/types/transferOrder';
import { ArrowLeftRight, Plus, Search, CalendarIcon, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import TransferOrderDetailPanel from '@/components/newcomponents/customui/orders/TransferOrderDetailPanel';
import TransferOrdersOverviewPanel from '@/components/newcomponents/customui/orders/TransferOrdersOverviewPanel';
import TransferOrderNavigatorPanel from '@/components/newcomponents/customui/orders/TransferOrderNavigatorPanel';
import AddTransferOrderDialog from '@/components/newcomponents/customui/orders/AddTransferOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  buildMachineIdToFactoryId,
  buildProjectIdToFactoryId,
} from './ordersOverviewData';
import {
  filterTransferOrders,
  isTransferOrderComplete,
  transferOrderSummaryStats,
  type TransferLocationTypeFilter,
} from './transferOrdersOverviewData';
import {
  transferRouteLabel,
  transferRouteTypeLabel,
  type TransferLocationLabelContext,
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

const TR_LIST_LIMIT = API_LIMITS.FLEXIBLE_1000;

const LOCATION_TYPE_OPTIONS: { value: TransferLocationTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'storage', label: 'Storage' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged' },
];

const TransferOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filtersBarOpen, setFiltersBarOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'transfer')
  );

  const { data: orders = [], isLoading } = useGetTransferOrdersQuery({
    skip: 0,
    limit: TR_LIST_LIMIT,
  });
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
  const { data: factorySections = [] } = useGetFactorySectionsQuery({
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

  const {
    dateRange,
    statusFilters,
    factoryFilter,
    sourceTypeFilter,
    destinationTypeFilter,
    searchQuery,
    showCompleteOrders,
  } = urlFilters;

  const commitTransferFilters = useCallback(
    (patch: Partial<TransferOrderUrlFilters>) => {
      setSearchParams(
        (prev) =>
          writeTransferOrderParams(prev, { ...urlFilters, ...patch }, trStatusOptions),
        { replace: true }
      );
    },
    [setSearchParams, urlFilters, trStatusOptions]
  );

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines, factorySections),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, factorySections, projects]
  );

  const labelCtx: TransferLocationLabelContext = useMemo(
    () => ({ factories, machines, projects }),
    [factories, machines, projects]
  );

  const filterOpts = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      statusIds: statusFilters,
      factoryId: factoryFilter,
      sourceType: sourceTypeFilter,
      destinationType: destinationTypeFilter,
      searchQuery,
      showCompleteOrders,
    }),
    [
      dateRange.from,
      dateRange.to,
      statusFilters,
      factoryFilter,
      sourceTypeFilter,
      destinationTypeFilter,
      searchQuery,
      showCompleteOrders,
    ]
  );

  const filteredOrders = useMemo(
    () => filterTransferOrders(orders, filterOpts, resolutionMaps, labelCtx),
    [orders, filterOpts, resolutionMaps, labelCtx]
  );

  const overviewStats = useMemo(
    () => transferOrderSummaryStats(filteredOrders),
    [filteredOrders]
  );

  const mayTruncate = orders.length >= TR_LIST_LIMIT;

  const selectedOrder = useMemo(
    () =>
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      orders.find((o) => o.id === selectedOrderId) ??
      null,
    [filteredOrders, orders, selectedOrderId]
  );

  const hasHiddenCompleteOrders = useMemo(
    () => !showCompleteOrders && orders.some((o) => isTransferOrderComplete(o)),
    [showCompleteOrders, orders]
  );

  const selectedOrderFromUrl = searchParams.get('orderId');

  useEffect(() => {
    if (!selectedOrderFromUrl) return;
    const parsed = Number(selectedOrderFromUrl);
    if (Number.isNaN(parsed)) return;
    setSelectedOrderId(parsed);
  }, [selectedOrderFromUrl]);

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

  const routeLabel = (order: TransferOrder) => transferRouteLabel(order, labelCtx);
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';

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
    return count;
  }, [
    dateRange.from,
    dateRange.to,
    statusFilters,
    factoryFilter,
    sourceTypeFilter,
    destinationTypeFilter,
  ]);

  const clearFilters = () => {
    setSearchParams((prev) => clearTransferOrderFilterParams(prev), { replace: true });
  };

  const handleDelete = async (o: TransferOrder) => {
    if (!window.confirm(`Delete transfer order ${o.transfer_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Transfer order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className="flex min-w-0 items-center gap-3 shrink-0">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35"
                  aria-hidden
                >
                  <ArrowLeftRight className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  Transfer Orders
                </h1>
              </div>
              {selectedOrder && (
                <>
                  <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
                  <Breadcrumb className="min-w-0 self-end">
                    <BreadcrumbList className="items-end text-card-foreground dark:text-foreground">
                      <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                        <span className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5">
                          <span className="truncate px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground">
                            {selectedOrder.transfer_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Close transfer order"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by TR# or route..."
                  value={searchQuery}
                  onChange={(e) => commitTransferFilters({ searchQuery: e.target.value })}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transfer Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

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
              <div className="flex items-center gap-2">
                <Switch
                  id="tr-show-complete-filters"
                  checked={showCompleteOrders}
                  onCheckedChange={(value) =>
                    commitTransferFilters({ showCompleteOrders: value })
                  }
                  aria-label="Show complete orders"
                />
                <Label
                  htmlFor="tr-show-complete-filters"
                  className="cursor-pointer text-sm font-normal text-muted-foreground whitespace-nowrap"
                >
                  Show complete orders
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

        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          <TransferOrderNavigatorPanel
            filteredOrders={filteredOrders}
            selectedOrderId={selectedOrderId}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            filtersOpen={filtersBarOpen}
            onToggleFilters={() => setFiltersBarOpen((open) => !open)}
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={(value) =>
              commitTransferFilters({ showCompleteOrders: value })
            }
            hasHiddenCompleteOrders={hasHiddenCompleteOrders}
            onSelectOrder={(id) => setSelectedOrder(id)}
            onDeleteOrder={handleDelete}
            onAddOrder={() => setIsAddOpen(true)}
            routeTypeLabel={(o) => transferRouteTypeLabel(o)}
            formatDate={formatDate}
          />

          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            {selectedOrder ? (
              <TransferOrderDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                showCompleteOrders={showCompleteOrders}
              />
            ) : (
              <TransferOrdersOverviewPanel
                orders={filteredOrders}
                stats={overviewStats}
                isLoading={isLoading}
                mayTruncate={mayTruncate}
                routeLabel={routeLabel}
                formatDate={formatDate}
                onSelectOrder={(id) => setSelectedOrder(id)}
              />
            )}
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
    </div>
  );
};

export default TransferOrdersPage;
