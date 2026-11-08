import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFormatDateFromApi } from '@/hooks/useFormatDateFromApi';
import { useSearchParams } from 'react-router-dom';
import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';
import ExpenseOrderHeaderFilters from '@/components/newcomponents/customui/orders/ExpenseOrderHeaderFilters';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import {
  useGetExpenseOrdersPageQuery,
  useGetExpenseOrderHubStatsQuery,
  useGetExpenseOrderByIdQuery,
  useDeleteExpenseOrderMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import type { ExpenseOrder } from '@/types/expenseOrder';
import { Receipt, LayoutTemplate } from 'lucide-react';
import { appToast } from '@/lib/appToast';
import AddExpenseOrderDialog from '@/components/newcomponents/customui/orders/AddExpenseOrderDialog';
import ManageExpenseTemplatesDialog from '@/components/newcomponents/customui/orders/ManageExpenseTemplatesDialog';
import ExpenseOrderDetailPanel from '@/components/newcomponents/customui/orders/ExpenseOrderDetailPanel';
import ExpenseOrdersOverviewPanel from '@/components/newcomponents/customui/orders/ExpenseOrdersOverviewPanel';
import ExpenseOrderNavigatorPanel from '@/components/newcomponents/customui/orders/ExpenseOrderNavigatorPanel';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import { type ExpenseOrderSummaryStats } from './expenseOrdersOverviewData';
import { EO_STAGE_FILTER_OPTIONS } from '@/components/newcomponents/customui/orders/expenseOrderMilestones';
import { HELP_GUIDE_TOUR_ID } from '@/features/helpGuides/helpGuideTourIds';
import { useAutoHelpGuide } from '@/features/helpGuides/useAutoHelpGuide';
import {
  useCloseFiltersOnTourEvent,
  useOpenFiltersOnTourEvent,
  useResetSelectionWhenTourStarts,
  useTourSampleDetail,
} from '@/features/helpGuides/useTourPreview';
import ExpenseOrderTourSampleDetail from '@/components/newcomponents/customui/helpGuides/ExpenseOrderTourSampleDetail';
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
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(() =>
    hasActiveListFilters(new URLSearchParams(window.location.search), 'expense'),
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
    [searchParams, eoStatusOptions],
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

  const handleOverviewCategoryFilter = useCallback(
    (categoryKey: string) => {
      commitExpenseFilters({ categoryFilter: categoryKey });
    },
    [commitExpenseFilters],
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

  useAutoHelpGuide({
    tourId: HELP_GUIDE_TOUR_ID.expenseOrders,
    when: !isLoading,
  });

  const tourSample = useTourSampleDetail([HELP_GUIDE_TOUR_ID.expenseOrders]);
  useOpenFiltersOnTourEvent('eo-filters-bar', setFiltersPopoverOpen);
  useCloseFiltersOnTourEvent('eo-filters-bar', setFiltersPopoverOpen);

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
  const formatDate = useFormatDateFromApi();

  const hasActiveFilters =
    dateRange.from != null ||
    dateRange.to != null ||
    statusFilters.length > 0 ||
    accountFilter !== 'all' ||
    categoryFilter !== 'all' ||
    invoiceFilter !== 'all' ||
    showCompleteOrders ||
    searchQuery.trim().length > 0;

  const clearFilters = () => {
    setSelectedOrderId(null);
    setFiltersPopoverOpen(false);
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
      appToast.success('Expense order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  const manageTemplatesButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setManageTemplatesOpen(true)}
      title="Templates"
      aria-label="Templates"
      className={cn('shrink-0 gap-1.5 border-border bg-background', appShellHeaderControlClass)}
      data-help-tour="expense.manage-templates"
    >
      <LayoutTemplate className="h-4 w-4" />
      Templates
    </Button>
  );

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <OrderHubShellHeader
          icon={Receipt}
          title="Expense Orders"
          selectedOrderLabel={selectedOrder?.expense_number ?? null}
          onClearSelection={() => setSelectedOrder(null)}
          backAriaLabel="Back to expense orders"
          closeSelectionAriaLabel="Close expense order"
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          searchPlaceholder="Search by # or category..."
          searchAriaLabel="Search expense orders"
          onAdd={() => setIsAddOpen(true)}
          addButtonLabel="Add Expense Order"
          addAriaLabel="Add expense order"
          helpGuideKind="expense"
          headerToolbarLeading={manageTemplatesButton}
          headerToolbarExtras={
            <ExpenseOrderHeaderFilters
              open={filtersPopoverOpen}
              onOpenChange={setFiltersPopoverOpen}
              dateRange={dateRange}
              onDateRangeChange={(next) => commitExpenseFilters({ dateRange: next })}
              statusFilters={statusFilters}
              onStatusFiltersChange={(selectedIds) =>
                commitExpenseFilters({ statusFilters: selectedIds })
              }
              eoStatusOptions={eoStatusOptions}
              accountFilter={accountFilter}
              onAccountFilterChange={(value) => commitExpenseFilters({ accountFilter: value })}
              accounts={accounts}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(value) => commitExpenseFilters({ categoryFilter: value })}
              invoiceFilter={invoiceFilter}
              onInvoiceFilterChange={(value) => commitExpenseFilters({ invoiceFilter: value })}
              showCompleteOrders={showCompleteOrders}
              onShowCompleteOrdersChange={(value) =>
                commitExpenseFilters({ showCompleteOrders: value })
              }
              onClearFilters={clearFilters}
            />
          }
        />

        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          <ExpenseOrderNavigatorPanel
            className={cn(
              (selectedOrder || tourSample.sampleOpen) && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0',
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
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={(value) =>
              commitExpenseFilters({ showCompleteOrders: value })
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
            accountName={accountName}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          <div
            className={cn(
              'flex-1 min-w-0 min-h-0 overflow-hidden',
              !selectedOrder && !tourSample.sampleOpen && 'max-lg:hidden',
            )}
          >
            {tourSample.sampleOpen ? (
              <ExpenseOrderTourSampleDetail />
            ) : selectedOrder ? (
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
                stats={overviewStats}
                hubStats={hubStats}
                isLoading={isLoading || statsLoading}
                formatCurrency={formatCurrency}
                hideOrderLists={tourSample.tourActive}
                onSelectOrder={(id) => {
                  tourSample.closeSample();
                  setSelectedOrder(id);
                }}
                onCategoryFilter={handleOverviewCategoryFilter}
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
    </>
  );
};

export default ExpenseOrdersPage;
