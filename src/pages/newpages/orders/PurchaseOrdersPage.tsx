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
  useGetPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { ShoppingCart, Plus, Loader2, Search, CalendarIcon, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AddPurchaseOrderDialog from '@/components/newcomponents/customui/orders/AddPurchaseOrderDialog';
import PurchaseOrderDetailPanel from '@/components/newcomponents/customui/orders/PurchaseOrderDetailPanel';
import PurchaseOrdersOverviewPanel from '@/components/newcomponents/customui/orders/PurchaseOrdersOverviewPanel';
import PurchaseOrderNavigatorPanel from '@/components/newcomponents/customui/orders/PurchaseOrderNavigatorPanel';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  buildMachineIdToFactoryId,
  buildProjectIdToFactoryId,
} from './ordersOverviewData';
import {
  filterPurchaseOrders,
  isPurchaseOrderComplete,
  purchaseOrderSummaryStats,
  type DestinationTypeFilter,
  type InvoiceFilter,
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
const PO_LIST_LIMIT = API_LIMITS.FLEXIBLE_1000;

const DESTINATION_FILTER_LABELS: Record<DestinationTypeFilter, string> = {
  all: 'All destinations',
  storage: 'Storage',
  machine: 'Machine',
  project: 'Project',
};

const PurchaseOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filtersBarOpen, setFiltersBarOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'purchase')
  );
  const isLgScreen = useIsLgScreen();
  const { data: orders = [], isLoading } = useGetPurchaseOrdersQuery({
    skip: 0,
    limit: PO_LIST_LIMIT,
  });
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
  const { data: factorySections = [] } = useGetFactorySectionsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projects = [] } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const [deleteOrder] = useDeletePurchaseOrderMutation();

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

  const poStatusOptions = useMemo(() => statusesForPoWorkflowFilter(statuses), [statuses]);

  const urlFilters = useMemo(
    () => parsePurchaseOrderParams(searchParams, poStatusOptions),
    [searchParams, poStatusOptions]
  );

  const {
    dateRange,
    statusFilters,
    accountFilter,
    factoryFilter,
    destinationFilter,
    invoiceFilter,
    searchQuery,
    showCompleteOrders,
    showVoidedOrders,
  } = urlFilters;

  const commitPurchaseFilters = useCallback(
    (patch: Partial<PurchaseOrderUrlFilters>) => {
      setSearchParams(
        (prev) =>
          writePurchaseOrderParams(prev, { ...urlFilters, ...patch }, poStatusOptions),
        { replace: true }
      );
    },
    [setSearchParams, urlFilters, poStatusOptions]
  );

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines, factorySections),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, factorySections, projects]
  );

  const filterOpts = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      statusIds: statusFilters,
      accountId: accountFilter,
      factoryId: factoryFilter,
      destinationType: destinationFilter,
      invoice: invoiceFilter,
      searchQuery,
      showCompleteOrders,
      showVoidedOrders,
    }),
    [
      dateRange.from,
      dateRange.to,
      statusFilters,
      accountFilter,
      factoryFilter,
      destinationFilter,
      invoiceFilter,
      searchQuery,
      showCompleteOrders,
      showVoidedOrders,
    ]
  );

  const filteredOrders = useMemo(
    () => filterPurchaseOrders(orders, filterOpts, accounts, resolutionMaps),
    [orders, filterOpts, accounts, resolutionMaps]
  );

  const overviewStats = useMemo(
    () => purchaseOrderSummaryStats(filteredOrders, statusMap),
    [filteredOrders, statusMap]
  );

  const mayTruncate = orders.length >= PO_LIST_LIMIT;

  const selectedOrder = useMemo(
    () =>
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      orders.find((o) => o.id === selectedOrderId) ??
      null,
    [filteredOrders, orders, selectedOrderId]
  );

  const hasHiddenCompleteOrders = useMemo(
    () => !showCompleteOrders && orders.some(isPurchaseOrderComplete),
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
  const destinationLabel = (order: PurchaseOrder) => {
    if (order.destination_type === 'storage') {
      const factory = factories.find((f) => f.id === order.destination_id);
      return factory ? `Storage (${factory.name})` : 'Storage';
    }
    if (order.destination_type === 'machine') {
      const machine = machines.find((m) => m.id === order.destination_id);
      return machine ? `Machine (${machine.name})` : `Machine #${order.destination_id}`;
    }
    if (order.destination_type === 'project') {
      const project = projects.find((p) => p.id === order.destination_id);
      return project ? `Project (${project.name})` : `Project #${order.destination_id}`;
    }
    return `${order.destination_type} #${order.destination_id}`;
  };
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

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
    return count;
  }, [
    dateRange.from,
    dateRange.to,
    statusFilters,
    accountFilter,
    factoryFilter,
    destinationFilter,
    invoiceFilter,
  ]);

  const clearFilters = () => {
    setSearchParams((prev) => clearPurchaseOrderFilterParams(prev), { replace: true });
  };

  const handleDelete = async (o: PurchaseOrder) => {
    if (!window.confirm(`Delete purchase order ${o.po_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Purchase order deleted');
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
                  <ShoppingCart className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  Purchase Orders
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
                            {selectedOrder.po_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Close purchase order"
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
                  placeholder="Search by PO# or supplier..."
                  value={searchQuery}
                  onChange={(e) => commitPurchaseFilters({ searchQuery: e.target.value })}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Purchase Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

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
                id="po-show-complete-filters"
                checked={showCompleteOrders}
                onCheckedChange={(value) => commitPurchaseFilters({ showCompleteOrders: value })}
                aria-label="Show complete orders"
              />
              <Label
                htmlFor="po-show-complete-filters"
                className="cursor-pointer text-sm font-normal text-muted-foreground whitespace-nowrap"
              >
                Show complete
              </Label>
            </div>
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
            filteredOrders={filteredOrders}
            selectedOrderId={selectedOrderId}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            filtersOpen={filtersBarOpen}
            onToggleFilters={() => setFiltersBarOpen((open) => !open)}
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={(value) =>
              commitPurchaseFilters({ showCompleteOrders: value })
            }
            hasHiddenCompleteOrders={hasHiddenCompleteOrders}
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
              <PurchaseOrderDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                showCompleteOrders={showCompleteOrders}
              />
            ) : isLgScreen ? (
              <PurchaseOrdersOverviewPanel
                orders={filteredOrders}
                stats={overviewStats}
                isLoading={isLoading}
                mayTruncate={mayTruncate}
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
    </div>
  );
};

export default PurchaseOrdersPage;
