import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useGetExpenseOrdersQuery,
  useDeleteExpenseOrderMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { ExpenseOrder } from '@/types/expenseOrder';
import { Receipt, Plus, Loader2, Search } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AddExpenseOrderDialog from '@/components/newcomponents/customui/orders/AddExpenseOrderDialog';
import ExpenseOrderDetailPanel from '@/components/newcomponents/customui/orders/ExpenseOrderDetailPanel';
import ExpenseOrderListRow from '@/components/newcomponents/customui/orders/ExpenseOrderListRow';
import { ORDER_LIST_WIDTH } from '@/components/newcomponents/customui/orders/orderListConstants';

const ExpenseOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: orders = [], isLoading } = useGetExpenseOrdersQuery({ skip: 0, limit: 200 });
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: 100 });
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: 100 });
  const [deleteOrder] = useDeleteExpenseOrderMutation();
  const statusLabel = (id: number) => statuses.find((s) => s.id === id)?.name ?? `#${id}`;
  const accountName = (id: number | null) => (id ? accounts.find((a) => a.id === id)?.name ?? `#${id}` : '—');
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.expense_number?.toLowerCase().includes(q) ||
        o.expense_category?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
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
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v) : '—';

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
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <Receipt className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">Expense Orders</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by # or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <Receipt className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {searchQuery ? 'No orders match your search.' : 'No expense orders yet.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredOrders.map((o) => (
                    <ExpenseOrderListRow
                      key={o.id}
                      order={o}
                      isSelected={selectedOrderId === o.id}
                      onClick={() => setSelectedOrder(o.id)}
                      accountName={accountName(o.account_id)}
                      statusLabel={statusLabel(o.current_status_id)}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-background">
            {selectedOrder ? (
              <ExpenseOrderDetailPanel
                order={selectedOrder}
                accounts={accounts}
                onClose={() => setSelectedOrder(null)}
                onDelete={() => handleDelete(selectedOrder)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Receipt className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-sm">Select an order to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddExpenseOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(order) => setSelectedOrder(order.id)}
      />
    </div>
  );
};

export default ExpenseOrdersPage;
