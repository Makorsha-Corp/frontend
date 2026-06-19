import React from 'react';
import type { TopFactoryRow } from '@/types/ordersOverview';
import OrdersLeaderboardPanel from './OrdersLeaderboardPanel';
import { formatOverviewCurrency } from './ordersOverviewConstants';

interface OrdersTopFactoriesPanelProps {
  factories: TopFactoryRow[];
  isLoading?: boolean;
  onFactorySelect?: (factoryId: string) => void;
}

const OrdersTopFactoriesPanel: React.FC<OrdersTopFactoriesPanelProps> = ({
  factories,
  isLoading,
  onFactorySelect,
}) => (
  <OrdersLeaderboardPanel
    title="Top factories"
    isLoading={isLoading}
    valueMode="number"
    onRowClick={onFactorySelect ? (id) => onFactorySelect(String(id)) : undefined}
    rows={factories.map((factory) => ({
      id: factory.factory_id,
      label: factory.factory_name,
      value: factory.order_count,
      secondary:
        factory.total_value > 0 ? formatOverviewCurrency(factory.total_value) : undefined,
      primary: `PO ${factory.purchase_count} · TR ${factory.transfer_count} · SO ${factory.sales_count} · WO ${factory.work_count}`,
    }))}
    emptyMessage="No factory-attributed orders in range"
  />
);

export default OrdersTopFactoriesPanel;
