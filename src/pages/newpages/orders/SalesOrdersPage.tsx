import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetSalesOrdersQuery, useGetSalesOrderByIdQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { ClipboardList, Plus, Search, X } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import AddSalesOrderDialog from '@/components/newcomponents/customui/orders/AddSalesOrderDialog';
import SalesOrderDetailPanel from '@/components/newcomponents/customui/orders/SalesOrderDetailPanel';
import SalesOrderNavigatorPanel from '@/components/newcomponents/customui/orders/SalesOrderNavigatorPanel';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';

const PAGE_SIZE = 100;

const SalesOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showCompleteOrders, setShowCompleteOrders] = useState(false);
  const [loadedPages, setLoadedPages] = useState(1);
  const isLgScreen = useIsLgScreen();

  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const {
    data: allOrders = [],
    isLoading,
    isFetching,
  } = useGetSalesOrdersQuery({ skip: 0, limit: loadedPages * PAGE_SIZE });

  const hasMore = allOrders.length === loadedPages * PAGE_SIZE;

  const filteredOrders = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return allOrders.filter((o) => {
      if (!showCompleteOrders && o.order_completed) return false;
      if (!q) return true;
      const accName = accounts.find((a) => a.id === o.account_id)?.name?.toLowerCase() ?? '';
      return o.sales_order_number.toLowerCase().includes(q) || accName.includes(q);
    });
  }, [allOrders, showCompleteOrders, searchInput, accounts]);

  const selectedFromList = useMemo(
    () => allOrders.find((o) => o.id === selectedOrderId) ?? null,
    [allOrders, selectedOrderId]
  );
  const { data: selectedById } = useGetSalesOrderByIdQuery(selectedOrderId!, {
    skip: selectedOrderId == null || selectedFromList != null,
  });
  const selectedOrder = selectedFromList ?? selectedById ?? null;

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
        { replace: true }
      );
      return;
    }
    setSelectedOrderId(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderFromUrl]);

  const setSelectedOrder = (orderId: number | null) => {
    setSelectedOrderId(orderId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (orderId == null) next.delete('orderId');
      else next.set('orderId', String(orderId));
      return next;
    });
  };

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
      : '—';
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');
  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? `Account #${id}`;

  const hasActiveFilters = searchInput.trim().length > 0;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
              <div className={appShellHeaderIconTileClass}>
                <ClipboardList className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Sales Orders</h1>
              {selectedOrder && (
                <>
                  <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
                  <Breadcrumb className="min-w-0">
                    <BreadcrumbList className="items-center text-card-foreground dark:text-foreground">
                      <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                        <span className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5">
                          <span className="truncate px-1.5 text-[15px] font-medium text-card-foreground dark:text-foreground">
                            {selectedOrder.sales_order_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(null)}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Close sales order"
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
                  placeholder="Search by SO# or customer..."
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
                Add Sales Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          <SalesOrderNavigatorPanel
            className={cn(selectedOrder && 'max-lg:hidden', !isLgScreen && 'flex-1 border-r-0')}
            orders={filteredOrders}
            ordersTotal={filteredOrders.length}
            isLoading={isLoading}
            isFetching={isFetching}
            hasMore={hasMore}
            onLoadMore={() => setLoadedPages((p) => p + 1)}
            selectedOrderId={selectedOrderId}
            hasActiveFilters={hasActiveFilters}
            showCompleteOrders={showCompleteOrders}
            onShowCompleteOrdersChange={setShowCompleteOrders}
            emptyHintNoOpen={!showCompleteOrders && !hasActiveFilters}
            onSelectOrder={(id) => setSelectedOrder(id)}
            onAddOrder={() => setIsAddOpen(true)}
            accountName={accountName}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />

          <div className={cn('flex-1 min-w-0 min-h-0 overflow-hidden', !selectedOrder && 'max-lg:hidden')}>
            {selectedOrder ? (
              <SalesOrderDetailPanel order={selectedOrder} skipOrderRefetch={selectedFromList != null} />
            ) : isLgScreen ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Select an order from the list to view details</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AddSalesOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        accounts={accounts}
        onSuccess={(order) => {
          setSelectedOrder(order.id);
          setIsAddOpen(false);
        }}
      />
    </div>
  );
};

export default SalesOrdersPage;
