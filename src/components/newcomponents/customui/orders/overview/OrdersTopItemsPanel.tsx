import React from 'react';
import type { TopItemRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel from './OrdersLeaderboardPanel';
import { formatOverviewNumber } from './ordersOverviewConstants';

interface OrdersTopItemsPanelProps {
  items: TopItemRow[];
  isLoading?: boolean;
}

const OrdersTopItemsPanel: React.FC<OrdersTopItemsPanelProps> = ({ items, isLoading }) => (
  <OrdersLeaderboardPanel
    title="Most ordered items"
    isLoading={isLoading}
    valueMode="number"
    rows={items.map((item) => ({
      id: item.item_id,
      label: item.item_name,
      secondary: item.item_unit ? `Unit: ${item.item_unit}` : undefined,
      value: Number(item.total_quantity),
      primary: `PO ${formatOverviewNumber(Number(item.purchase_qty))} · TR ${formatOverviewNumber(Number(item.transfer_qty))} · SO ${formatOverviewNumber(Number(item.sales_qty))}`,
    }))}
  />
);

export default OrdersTopItemsPanel;
