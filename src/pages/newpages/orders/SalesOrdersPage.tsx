import React, { useState } from 'react';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useGetSalesOrdersQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import type { SalesOrder } from '@/types/salesOrder';
import { ShoppingBag, Plus, Loader2, Search, LayoutGrid, List } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import SalesOrderKanbanView from '@/components/newcomponents/customui/orders/SalesOrderKanbanView';
import SalesOrderListView from '@/components/newcomponents/customui/orders/SalesOrderListView';
import SalesOrderDetailModal from '@/components/newcomponents/customui/orders/SalesOrderDetailModal';
import AddSalesOrderDialog from '@/components/newcomponents/customui/orders/AddSalesOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import type { SalesOrderKanbanColumn } from '@/components/newcomponents/customui/orders/salesOrderStatusConstants';

const SalesOrdersPage: React.FC = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusFilter, setStatusFilter] = useState<SalesOrderKanbanColumn | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useGetSalesOrdersQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: accounts = [] } = useGetAccountsQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });

  const handleOrderClick = (order: SalesOrder) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) setSelectedOrder(null);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="flex-shrink-0 bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Sales Orders</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by SO# or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
                <TabsList className="h-9">
                  <TabsTrigger value="kanban" className="gap-1.5 px-3">
                    <LayoutGrid className="h-4 w-4" />
                    Kanban
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-1.5 px-3">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                className="bg-brand-primary hover:bg-brand-primary-hover h-9"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Sales Order
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center flex-1">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading orders...</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <SalesOrderKanbanView
              orders={orders}
              searchQuery={searchQuery}
              onOrderClick={handleOrderClick}
            />
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
      </div>

      <SalesOrderDetailModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        order={selectedOrder}
        accounts={accounts}
      />

      <AddSalesOrderDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        accounts={accounts}
        onSuccess={(createdOrder) => {
          setSelectedOrder(createdOrder as SalesOrder);
          setModalOpen(true);
        }}
      />
    </div>
  );
};

export default SalesOrdersPage;
