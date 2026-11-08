import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TopItemRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel from './OrdersLeaderboardPanel';
import { formatOverviewNumber } from './ordersOverviewConstants';

interface OrdersTopItemsPanelProps {
  items: TopItemRow[];
  isLoading?: boolean;
}

const OrdersTopItemsPanel: React.FC<OrdersTopItemsPanelProps> = ({ items, isLoading }) => {
  const { t } = useTranslation('orders');
  return (
    <OrdersLeaderboardPanel
      title={t('mostOrderedItems')}
    isLoading={isLoading}
    valueMode="number"
    rows={items.map((item) => ({
      id: item.item_id,
      label: item.item_name,
      secondary: item.item_unit ? t('overviewItemUnit', { unit: item.item_unit }) : undefined,
      value: Number(item.total_quantity),
      primary: `PO ${formatOverviewNumber(Number(item.purchase_qty))} · TR ${formatOverviewNumber(Number(item.transfer_qty))}`,
    }))}
    />
  );
};

export default OrdersTopItemsPanel;
