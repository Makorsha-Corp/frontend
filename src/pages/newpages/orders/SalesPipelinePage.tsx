import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetSalesOrdersQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import type { SalesOrder } from '@/types/salesOrder';
import { LayoutGrid, Plus, Loader2, Search } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import SalesOrderKanbanView from '@/components/newcomponents/customui/orders/SalesOrderKanbanView';
import SalesOrderDetailModal from '@/components/newcomponents/customui/orders/SalesOrderDetailModal';
import AddSalesOrderDialog from '@/components/newcomponents/customui/orders/AddSalesOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';

const SalesPipelinePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  const [searchQuery, setSearchQuery] = useState('');
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <LayoutGrid className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">Sales Pipeline</h1>
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

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading pipeline...</p>
            </div>
          ) : (
            <SalesOrderKanbanView
              orders={orders}
              searchQuery={searchQuery}
              onOrderClick={handleOrderClick}
            />
          )}
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

export default SalesPipelinePage;
