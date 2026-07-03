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
  useGetExpenseOrdersQuery,
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
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import {
  ALLOCATION_TYPES,
} from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  filterExpenseOrders,
  expenseOrderSummaryStats,
  isExpenseOrderComplete,
  type InvoiceFilter,
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

const EO_LIST_LIMIT = API_LIMITS.FLEXIBLE_1000;

const ExpenseOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manageTemplatesOpen, setManageTemplatesOpen] = useState(false);
  const [filtersBarOpen, setFiltersBarOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'expense')
  );
  const isLgScreen = useIsLgScreen();

  const { data: orders = [], isLoading } = useGetExpenseOrdersQuery({
    skip: 0,
    limit: EO_LIST_LIMIT,
  });
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
    (patch: Partial<ExpenseOrderUrlFilters>) => {
      setSearchParams(
        (prev) =>
          writeExpenseOrderParams(prev, { ...urlFilters, ...patch }, eoStatusOptions),
        { replace: true }
      );
    },
    [setSearchParams, urlFilters, eoStatusOptions]
  );

  const filterOpts = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      statusIds: statusFilters,
      accountId: accountFilter,
      categoryFilter,
      invoice: invoiceFilter,
      searchQuery,
      showCompleteOrders,
    }),
    [
      dateRange.from,
      dateRange.to,
      statusFilters,
      accountFilter,
      categoryFilter,
      invoiceFilter,
      searchQuery,
      showCompleteOrders,
    ]
  );

  const filteredOrders = useMemo(
    () => filterExpenseOrders(orders, filterOpts, accounts),
    [orders, filterOpts, accounts]
  );

  const overviewStats = useMemo(
    () => expenseOrderSummaryStats(filteredOrders),
    [filteredOrders]
  );

  const mayTruncate = orders.length >= EO_LIST_LIMIT;

  const selectedOrder = useMemo(
    () =>
      filteredOrders.find((o) => o.id === selectedOrderId) ??
      orders.find((o) => o.id === selectedOrderId) ??
      null,
    [filteredOrders, orders, selectedOrderId]
  );

  const hasHiddenCompleteOrders = useMemo(
    () => !showCompleteOrders && orders.some(isExpenseOrderComplete),
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
    return count;
  }, [dateRange.from, dateRange.to, statusFilters, accountFilter, categoryFilter, invoiceFilter]);

  const clearFilters = () => {
    setSearchParams((prev) => clearExpenseOrderFilterParams(prev), { replace: true });
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
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className="flex min-w-0 items-center gap-3 shrink-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                  <Receipt className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className="truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  Expense Orders
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
                  value={searchQuery}
                  onChange={(e) => commitExpenseFilters({ searchQuery: e.target.value })}
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
              <div className="flex items-center gap-2">
                <Switch
                  id="eo-show-complete-filters"
                  checked={showCompleteOrders}
                  onCheckedChange={(value) =>
                    commitExpenseFilters({ showCompleteOrders: value })
                  }
                  aria-label="Show complete orders"
                />
                <Label
                  htmlFor="eo-show-complete-filters"
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
          <ExpenseOrderNavigatorPanel
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
              commitExpenseFilters({ showCompleteOrders: value })
            }
            hasHiddenCompleteOrders={hasHiddenCompleteOrders}
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
              <ExpenseOrderDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                showCompleteOrders={showCompleteOrders}
              />
            ) : isLgScreen ? (
              <ExpenseOrdersOverviewPanel
                orders={filteredOrders}
                stats={overviewStats}
                isLoading={isLoading}
                mayTruncate={mayTruncate}
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
