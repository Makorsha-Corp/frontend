import React, { useState, useMemo } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetWorkOrdersQuery,
  useUpdateWorkOrderMutation,
  useDeleteWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import type { WorkOrder } from '@/types/workOrder';
import type { WorkOrderStatus } from '@/types/workOrder';
import { Wrench, Plus, Loader2, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import WorkOrderDetailPanel from '@/components/newcomponents/customui/orders/WorkOrderDetailPanel';
import WorkOrderListRow from '@/components/newcomponents/customui/orders/WorkOrderListRow';
import AddWorkOrderDialog from '@/components/newcomponents/customui/orders/AddWorkOrderDialog';
import { ORDER_LIST_WIDTH } from '@/components/newcomponents/customui/orders/orderListConstants';

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const WorkOrdersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | ''>('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: orders = [], isLoading } = useGetWorkOrdersQuery({
    skip: 0,
    limit: 200,
    status: statusFilter || undefined,
  });
  const [deleteOrder] = useDeleteWorkOrderMutation();

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.work_order_number?.toLowerCase().includes(q) ||
        o.title?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  const handleDelete = async (o: WorkOrder) => {
    if (!window.confirm(`Delete work order ${o.work_order_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Work order deleted');
      if (selectedOrderId === o.id) setSelectedOrderId(null);
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
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <Wrench className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">Work Orders</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by WO# or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | '')}
                className={`${appShellHeaderControlClass} px-3 rounded-md border border-border bg-background text-sm`}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Work Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="flex-shrink-0 border-r border-border flex flex-col min-h-0 bg-card" style={{ width: ORDER_LIST_WIDTH }}>
            <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground font-medium">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Wrench className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {searchQuery || statusFilter ? 'No orders match.' : 'No work orders yet.'}
                  </p>
                  {!searchQuery && !statusFilter && (
                    <Button type="button" onClick={() => setIsAddOpen(true)} className="mt-4 bg-brand-primary hover:bg-brand-primary-hover">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Work Order
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredOrders.map((o) => (
                    <WorkOrderListRow
                      key={o.id}
                      order={o}
                      isSelected={selectedOrderId === o.id}
                      onClick={() => setSelectedOrderId(o.id)}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-background">
            {selectedOrder ? (
              <WorkOrderDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrderId(null)}
                onDelete={() => handleDelete(selectedOrder)}
                onStatusUpdated={() => setSelectedOrderId(selectedOrder.id)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Wrench className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-sm">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddWorkOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(order) => {
          setSelectedOrderId(order.id);
          setIsAddOpen(false);
        }}
      />
    </div>
  );
};

export default WorkOrdersPage;
