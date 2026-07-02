import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetSalesOrdersQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { SalesOrder } from '@/types/salesOrder';
import {
  TrendingUp,
  Plus,
  Loader2,
  Search,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Calculator,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import SalesOrderListView from '@/components/newcomponents/customui/orders/SalesOrderListView';
import SalesOrderDetailModal from '@/components/newcomponents/customui/orders/SalesOrderDetailModal';
import AddSalesOrderDialog from '@/components/newcomponents/customui/orders/AddSalesOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import { getSalesOrderKanbanColumn, type SalesOrderKanbanColumn } from '@/components/newcomponents/customui/orders/salesOrderStatusConstants';

const SalesOverviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SalesOrderKanbanColumn | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: orders = [], isLoading, refetch } = useGetSalesOrdersQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: accounts = [] } = useGetAccountsQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: statuses = [] } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });

  // Handle URL param orderId for auto-opening details
  useEffect(() => {
    if (orderIdParam && orders.length > 0) {
      const found = orders.find((o) => o.id === Number(orderIdParam));
      if (found) {
        setSelectedOrder(found);
        setModalOpen(true);
      }
    }
  }, [orderIdParam, orders]);

  const handleOrderClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
    setSearchParams({ orderId: String(order.id) });
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setSelectedOrder(null);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('orderId');
      setSearchParams(newParams);
    }
  };

  // KPI calculations
  const totalAmount = useMemo(() => orders.reduce((sum, o) => sum + (o.total_amount || 0), 0), [orders]);
  const activeCount = useMemo(
    () => orders.filter((o) => getSalesOrderKanbanColumn(o.current_status_id, statuses) !== 'completed').length,
    [orders, statuses]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => getSalesOrderKanbanColumn(o.current_status_id, statuses) === 'completed').length,
    [orders, statuses]
  );
  const avgOrderValue = orders.length > 0 ? totalAmount / orders.length : 0;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">Sales Overview</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by SO# or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <Button
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover text-white`}
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Sales Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto px-6 py-6 space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pipeline Value</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{formatCurrency(totalAmount)}</div>
                <p className="text-xs text-muted-foreground mt-1">Sum of all sales opportunities</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Deals</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{activeCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Pending and in-progress orders</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Closed Won</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{completedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Orders successfully delivered/completed</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg. Order Value</CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Calculator className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{formatCurrency(avgOrderValue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Average value across {orders.length} orders</p>
              </CardContent>
            </Card>
          </div>

          {/* List View Card */}
          <Card className="border border-border bg-card/50 backdrop-blur-sm flex-1 min-h-[400px] flex flex-col overflow-hidden shadow-sm">
            <CardHeader className="pb-2 border-b border-border shrink-0">
              <CardTitle className="text-lg font-semibold text-card-foreground">All Sales Orders</CardTitle>
            </CardHeader>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center flex-1">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                </div>
              ) : (
                <SalesOrderListView
                  orders={orders}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  onOrderClick={handleOrderClick}
                  selectedOrderId={selectedOrder?.id ?? null}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      <SalesOrderDetailModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        order={selectedOrder}
        accounts={accounts}
        onUpdated={refetch}
      />

      <AddSalesOrderDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        accounts={accounts}
        onSuccess={(createdOrder) => {
          setSelectedOrder(createdOrder as unknown as SalesOrder);
          setModalOpen(true);
          setSearchParams({ orderId: String(createdOrder.id) });
        }}
      />
    </div>
  );
};

export default SalesOverviewPage;
