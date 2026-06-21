import React from 'react';
import OrdersTopItemsPanel from './OrdersTopItemsPanel';
import OrdersTopAccountsPanel from './OrdersTopAccountsPanel';
import OrdersExpenseCategoriesPanel from './OrdersExpenseCategoriesPanel';
import OrdersTopFactoriesPanel from './OrdersTopFactoriesPanel';
import OrdersOverviewCharts from './OrdersOverviewCharts';
import OrdersRecentActivityTable from './OrdersRecentActivityTable';
import OrdersOverviewAboutMetrics from './OrdersOverviewAboutMetrics';
import type {
  CountsByTypeRow,
  OrdersOverTimeRow,
  OverviewOrder,
} from '@/pages/newpages/orders/ordersOverviewData';
import type { OrdersOverviewStats } from '@/types/ordersOverview';

interface OrdersOverviewPageBodyProps {
  showFactoryPanel: boolean;
  onFactorySelect?: (factoryId: string) => void;
  isLoading: boolean;
  loadStats: boolean;
  salesMayTruncate?: boolean;
  countsByType: CountsByTypeRow[];
  ordersOverTime: OrdersOverTimeRow[];
  totalOrdersCount: number;
  filteredRecentOrders: OverviewOrder[];
  apiStats: OrdersOverviewStats;
}

const OrdersOverviewPageBody: React.FC<OrdersOverviewPageBodyProps> = ({
  showFactoryPanel,
  onFactorySelect,
  isLoading,
  loadStats,
  salesMayTruncate,
  countsByType,
  ordersOverTime,
  totalOrdersCount,
  filteredRecentOrders,
  apiStats,
}) => {
  const insightsGridClass = showFactoryPanel
    ? 'grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4'
    : 'grid grid-cols-1 gap-6 lg:grid-cols-3';

  const insightsRow = (
    <div className={insightsGridClass}>
      <OrdersTopItemsPanel items={apiStats.top_items} isLoading={loadStats} />
      <OrdersTopAccountsPanel
        vendors={apiStats.top_vendors}
        customers={apiStats.top_customers}
        isLoading={loadStats}
      />
      <OrdersExpenseCategoriesPanel
        categories={apiStats.top_expense_categories}
        isLoading={loadStats}
      />
      {showFactoryPanel ? (
        <OrdersTopFactoriesPanel
          factories={apiStats.top_factories}
          isLoading={loadStats}
          onFactorySelect={onFactorySelect}
        />
      ) : null}
    </div>
  );

  return (
    <>
      <OrdersOverviewCharts
        countsByType={countsByType}
        ordersOverTime={ordersOverTime}
        totalOrdersCount={totalOrdersCount}
        isLoading={isLoading}
      />
      {insightsRow}
      <OrdersRecentActivityTable orders={filteredRecentOrders} isLoading={isLoading} />
      <OrdersOverviewAboutMetrics salesMayTruncate={salesMayTruncate} />
    </>
  );
};

export default OrdersOverviewPageBody;
