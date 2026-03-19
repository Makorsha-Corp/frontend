import React, { useMemo } from 'react';
import { useGetSalesOrdersQuery, useGetSalesOrderItemsQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { SalesOrder } from '@/types/salesOrder';
import { getSalesOrderKanbanColumn, type SalesOrderKanbanColumn } from './salesOrderStatusConstants';
import SalesOrderListRow from './SalesOrderListRow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'working', label: 'Working' },
  { value: 'completed', label: 'Completed' },
];

interface SalesOrderListViewProps {
  orders: SalesOrder[];
  searchQuery: string;
  statusFilter: SalesOrderKanbanColumn | 'all';
  onStatusFilterChange: (value: SalesOrderKanbanColumn | 'all') => void;
  onOrderClick: (order: SalesOrder) => void;
  selectedOrderId: number | null;
}

const SalesOrderListView: React.FC<SalesOrderListViewProps> = ({
  orders,
  searchQuery,
  statusFilter,
  onStatusFilterChange,
  onOrderClick,
  selectedOrderId,
}) => {
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: 100 });
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: 100 });

  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? `#${id}`;
  const statusLabel = (id: number) => statuses.find((s) => s.id === id)?.name ?? `#${id}`;
  const formatCurrency = (v: number | null | undefined) =>
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v) : '—';
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = q
      ? orders.filter((o) => {
          const soNum = o.sales_order_number?.toLowerCase() ?? '';
          const cust = (accounts.find((a) => a.id === o.account_id)?.name ?? '').toLowerCase();
          return soNum.includes(q) || cust.includes(q);
        })
      : orders;

    if (statusFilter !== 'all') {
      result = result.filter((o) => getSalesOrderKanbanColumn(o.current_status_id, statuses) === statusFilter);
    }
    return result;
  }, [orders, searchQuery, statusFilter, accounts, statuses]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as SalesOrderKanbanColumn | 'all')}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-2">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-muted-foreground">
            <List className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm text-center">
              {searchQuery || statusFilter !== 'all'
                ? 'No orders match your filters.'
                : 'No sales orders yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredOrders.map((o) => (
            <SalesOrderListRow
              key={o.id}
              order={o}
              isSelected={selectedOrderId === o.id}
              onClick={() => onOrderClick(o)}
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
  );
};

export default SalesOrderListView;
