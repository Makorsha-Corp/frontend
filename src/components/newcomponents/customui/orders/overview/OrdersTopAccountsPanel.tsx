import React from 'react';
import type { TopAccountRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel, { type LeaderboardRow } from './OrdersLeaderboardPanel';

interface OrdersTopAccountsPanelProps {
  vendors: TopAccountRow[];
  isLoading?: boolean;
}

function toRows(accounts: TopAccountRow[]): LeaderboardRow[] {
  return accounts.map((a) => ({
    id: a.account_id,
    label: a.account_name,
    value: Number(a.total_spend),
    primary: `${a.order_count} order${a.order_count === 1 ? '' : 's'}`,
  }));
}

const OrdersTopAccountsPanel: React.FC<OrdersTopAccountsPanelProps> = ({ vendors, isLoading }) => (
  <OrdersLeaderboardPanel
    title="Top vendors"
    isLoading={isLoading}
    rows={toRows(vendors)}
    emptyMessage="No vendor spend in range"
  />
);

export default OrdersTopAccountsPanel;
