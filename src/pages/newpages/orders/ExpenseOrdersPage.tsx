import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  useGetExpenseOrdersPageQuery,
  useGetExpenseOrderHubStatsQuery,
  useGetExpenseOrderByIdQuery,
  useDeleteExpenseOrderMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import type { ExpenseOrder } from '@/types/expenseOrder';
import { Receipt, Plus, Search, CalendarIcon, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AddExpenseOrderDialog from '@/components/newcomponents/customui/orders/AddExpenseOrderDialog';
import ManageExpenseTemplatesDialog from '@/components/newcomponents/customui/orders/ManageExpenseTemplatesDialog';
import ExpenseOrderDetailPanel from '@/components/newcomponents/customui/orders/ExpenseOrderDetailPanel';
import ExpenseOrdersOverviewPanel from '@/components/newcomponents/customui/orders/ExpenseOrdersOverviewPanel';
import ExpenseOrderNavigatorPanel from '@/components/newcomponents/customui/orders/ExpenseOrderNavigatorPanel';
import { ShowCompleteOrdersSwitchControl } from '@/components/newcomponents/customui/orders/ShowCompleteOrdersSwitch';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import {
  ALLOCATION_TYPES,
} from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  type InvoiceFilter,
  type ExpenseOrderSummaryStats,
} from './expenseOrdersOverviewData';
import { EO_STAGE_FILTER_OPTIONS } from '@/components/newcomponents/customui/orders/expenseOrderMilestones';
import OrderStatusMultiFilter from '@/components/newcomponents/customui/orders/OrderStatusMultiFilter';
import {
  clearExpenseOrderFilterParams,
  hasActiveListFilters,
  parseExpenseOrderParams,
  writeExpenseOrderParams,
  type ExpenseOrderUrlFilters,
} from './orderListUrlParams';
import {
  ORDER_HUB_PAGE_PARAMS,
  parseOrderHubPage,
} from './orderHubApiParams';
import {
  buildExpenseOrderHubFilterParams,
  buildExpenseOrderHubListParams,
} from './expenseOrderHubApiParams';
import { useOrderHubPageClamp } from './useOrderHubPageClamp';
import OrderHubOffPageSelectionBanner from '@/components/newcomponents/customui/orders/OrderHubOffPageSelectionBanner';
import { isOrderSelectedOffFilteredPage } from './orderHubSelection';

const ExpenseOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [filtersBarOpen, setFiltersBarOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'expense')
  );
  const [searchInput, setSearchInput] = useState('');
  const isLgScreen = useIsLgScreen();
  const { data: accounts = [] } = useGetAccountsQuery({
    skip: 0,
    limit: API_LIMITS.ACCOUNTS_LIST_MAX,
  });
  const [deleteOrder] = useDeleteExpenseOrderMutation();

  const eoStatusOptions = EO_STAGE_FILTER_OPTIONS;

  const urlFilters = useMemo(
    () => parseExpenseOrderParams(searchParams, eoStatusOptions),
    [searchParams, eoStatusOptions]
  );

  const listPage = parseOrderHubPage(searchParams.get(ORDER_HUB_PAGE_PARAMS.expense));

  const {
    dateRange,
    statusFilters,
    accountFilter,
    categoryFilter,
    invoiceFilter,
    searchQuery,
    showCompleteOrders,
  } = urlFilters;

  const commitExpenseFilters = useCallback(
    (patch: Partial<ExpenseOrderUrlFilters & { page?: number }>) => {
      const { page: pagePatch, ...urlPatch } = patch;
      setSearchParams(
        (prev) => {
          const next = writeExpenseOrderParams(
            prev,
            { ...urlFilters, ...urlPatch },
            eoStatusOptions,
          );
          if (pagePatch != null) {
            if (pagePatch > 1) next.set(ORDER_HUB_PAGE_PARAMS.expense, String(pagePatch));
            else next.delete(ORDER_HUB_PAGE_PARAMS.expense);
          } else if (Object.keys(urlPatch).length > 0) {
            next.delete(ORDER_HUB_PAGE_PARAMS.expense);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, urlFilters, eoStatusOptions],
  );

  useEffect(() => {
    setSearchInput(urlFilters.searchQuery);
  }, [urlFilters.searchQuery]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed === urlFilters.searchQuery.trim()) return;
      commitExpenseFilters({ searchQuery: trimmed });
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput, urlFilters.searchQuery, commitExpenseFilters]);

  const hubFilterParams = useMemo(
    () => buildExpenseOrderHubFilterParams(urlFilters),
    [urlFilters],
  );

  const listQueryParams = useMemo(
    () => buildExpenseOrderHubListParams(urlFilters, listPage),
    [urlFilters, listPage],
  );

  const {
    data: pageData,
    isLoading,
    isFetching,
  } = useGetExpenseOrdersPageQuery(listQueryParams);
  const { data: hubStats, isLoading: statsLoading } = useGetExpenseOrderHubStatsQuery(hubFilterParams);

  const orders = useMemo(() => pageData?.items ?? [], [pageData]);
  const ordersTotal = pageData?.total ?? 0;

  useOrderHubPageClamp(listPage, pageData?.total, ORDER_HUB_PAGE_PARAMS.expense, setSearchParams);

  const overviewStats = useMemo((): ExpenseOrderSummaryStats => {
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
  const { data: selectedById, isError: selectedByIdError } = useGetExpenseOrderByIdQuery(selectedOrderId!, {
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

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const accountName = (id: number | null) =>
    id ? accounts.find((a) => a.id === id)?.name ?? `#${id}` : '—';
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';

  const hasActiveFilters =
    dateRange.from != null ||
    dateRange.to != null ||
    statusFilters.length > 0 ||
    accountFilter !== 'all' ||
    categoryFilter !== 'all' ||
    invoiceFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateRange.from != null || dateRange.to != null) count += 1;
    if (statusFilters.length > 0) count += 1;
    if (accountFilter !== 'all') count += 1;
    if (categoryFilter !== 'all') count += 1;
    if (invoiceFilter !== 'all') count += 1;
    if (searchQuery.trim().length > 0) count += 1;
    return count;
  }, [
    dateRange.from,
    dateRange.to,
    statusFilters,
    accountFilter,
    categoryFilter,
    invoiceFilter,
    searchQuery,
  ]);

  const clearFilters = () => {
    setSelectedOrderId(null);
    setSearchParams(
      (prev) => {
        const next = clearExpenseOrderFilterParams(prev);
        next.delete('orderId');
        return next;
      },
      { replace: true },
    );
  };

  const handleDelete = async (o: ExpenseOrder) => {
    if (!window.confirm(`Delete expense order ${o.expense_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Expense order deleted');
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
            <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
              <div className={appShellHeaderIconTileClass}>
                <Receipt className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Expense Orders</h1>
              {selectedOrder && (
                <>
                  <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
                  <Breadcrumb className="min-w-0">
                    <BreadcrumbList className="items-center text-card-foreground dark:text-foreground">
                      <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                        <span className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5">
                          <span className="truncate px-1.5 text-[15px] font-medium text-card-foreground dark:text-foreground">
                            {selectedOrder.expense_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Close expense order"
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
                  placeholder="Search by # or category..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Expense Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

        {filtersBarOpen ? (
          <div
            id="eo-filters-bar"
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
                    commitExpenseFilters({ dateRange: { from: r?.from, to: r?.to } })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">Filters by expense date</span>

            <OrderStatusMultiFilter
              options={eoStatusOptions}
              selectedIds={statusFilters}
              onChange={(selectedIds) => commitExpenseFilters({ statusFilters: selectedIds })}
              triggerClassName="w-[160px]"
            />

            <Select
              value={accountFilter}
              onValueChange={(value) => commitExpenseFilters({ accountFilter: value })}
            >
              <SelectTrigger className="w-[160px] h-9 border-border bg-background text-sm">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value) => commitExpenseFilters({ categoryFilter: value })}
            >
              <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {ALLOCATION_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={invoiceFilter}
              onValueChange={(v) => commitExpenseFilters({ invoiceFilter: v as InvoiceFilter })}
            >
              <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
                <SelectValue placeholder="Invoice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All invoices</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="not_invoiced">Not invoiced</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <ShowCompleteOrdersSwitchControl
                checked={showCompleteOrders}
                onCheckedChange={(value) =>
                  commitExpenseFilters({ showCompleteOrders: value })
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
          <ExpenseOrderNavigatorPanel
            className={cn(
              selectedOrder && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0'
            )}
            orders={orders}
            ordersTotal={ordersTotal}
            listPage={listPage}
            isFetching={isFetching}
            onPageChange={(page) => commitExpenseFilters({ page })}
            selectedOrderId={selectedOrderId}
            offPageSelectedLabel={
              isOffFilteredPage && selectedOrder ? selectedOrder.expense_number : null
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
            onManageTemplates={() => setManageTemplatesOpen(true)}
            accountName={accountName}
            formatCurrency={formatCurrency}
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
                  <OrderHubOffPageSelectionBanner orderLabel={selectedOrder.expense_number} />
                ) : null}
                <div className="min-h-0 flex-1 overflow-hidden">
                  <ExpenseOrderDetailPanel
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    skipOrderRefetch={selectedFromList != null}
                    showCompleteOrders={showCompleteOrders}
                  />
                </div>
              </div>
            ) : isLgScreen ? (
              <ExpenseOrdersOverviewPanel
                orders={orders}
                stats={overviewStats}
                hubStats={hubStats}
                isLoading={isLoading || statsLoading}
                accountName={accountName}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onSelectOrder={(id) => setSelectedOrder(id)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <AddExpenseOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(order) => {
          setSelectedOrder(order.id);
          setIsAddOpen(false);
        }}
      />

      <ManageExpenseTemplatesDialog open={manageTemplatesOpen} onOpenChange={setManageTemplatesOpen} />
    </div>
  );
};

export default ExpenseOrdersPage;
