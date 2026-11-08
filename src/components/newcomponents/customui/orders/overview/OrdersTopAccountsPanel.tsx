import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TopAccountRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel, { type LeaderboardRow } from './OrdersLeaderboardPanel';

interface OrdersTopAccountsPanelProps {
  vendors: TopAccountRow[];
  isLoading?: boolean;
}

const OrdersTopAccountsPanel: React.FC<OrdersTopAccountsPanelProps> = ({ vendors, isLoading }) => {
  const { t } = useTranslation('orders');
  const rows: LeaderboardRow[] = vendors.map((a) => ({
    id: a.account_id,
    label: a.account_name,
    value: Number(a.total_spend),
    primary: t('overviewVendorOrderCount', { count: a.order_count }),
  }));
  return (
    <OrdersLeaderboardPanel
      title={t('topVendors')}
      isLoading={isLoading}
      rows={rows}
      emptyMessage={t('noVendorSpendInRange')}
    />
  );
};

export default OrdersTopAccountsPanel;
