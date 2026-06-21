import React from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import OrdersOverviewTable from '@/components/newcomponents/customui/orders/OrdersOverviewTable';
import type { OverviewOrder } from '@/pages/newpages/orders/ordersOverviewData';
import { ORDER_TYPE_HUB, formatOverviewCurrency } from './ordersOverviewConstants';

interface OrdersRecentActivityTableProps {
  orders: OverviewOrder[];
  isLoading?: boolean;
}

const OrdersRecentActivityTable: React.FC<OrdersRecentActivityTableProps> = ({
  orders,
  isLoading,
}) => {
  const navigate = useNavigate();
  const pathByKind = Object.fromEntries(ORDER_TYPE_HUB.map((h) => [h.id, h.path]));

  return (
    <>
      {isLoading ? (
        <div className="flex py-16 items-center justify-center text-muted-foreground border border-border rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <OrdersOverviewTable
          title="Recent activity"
          subtitle="Latest orders matching your filters"
          rows={orders.map((o) => ({ ...o, id: `${o.kind}-${o.id}` }))}
          emptyMessage="No orders match your filters"
          onRowClick={(row) => navigate(pathByKind[row.kind] ?? '/orders/purchase')}
          columns={[
        {
          id: 'ref',
          header: 'Order',
          cell: (row) => <span className="font-medium">{row.ref}</span>,
        },
        {
          id: 'type',
          header: 'Type',
          cell: (row) => {
            const label = ORDER_TYPE_HUB.find((h) => h.id === row.kind)?.label ?? row.kind;
            return (
              <Badge variant="outline" className="text-[10px] font-normal">
                {label}
              </Badge>
            );
          },
        },
        {
          id: 'status',
          header: 'Status',
          cell: (row) => <span className="text-muted-foreground">{row.statusLabel}</span>,
        },
        {
          id: 'date',
          header: 'Date',
          cell: (row) => row.displayDate,
        },
        {
          id: 'amount',
          header: 'Amount',
          align: 'right',
          cell: (row) => (
            <span className="font-medium tabular-nums">
              {row.amount > 0 ? formatOverviewCurrency(row.amount) : '—'}
            </span>
          ),
          },
        ]}
        />
      )}
    </>
  );
};

export default OrdersRecentActivityTable;
