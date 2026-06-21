import React from 'react';
import DashboardOrdersMixPie from '@/components/newcomponents/customui/dashboard/DashboardOrdersMixPie';
import OrdersTrendChart from '@/components/newcomponents/customui/orders/OrdersTrendChart';
import type { CountsByTypeRow, OrdersOverTimeRow } from '@/pages/newpages/orders/ordersOverviewData';

interface OrdersOverviewChartsProps {
  countsByType: CountsByTypeRow[];
  ordersOverTime: OrdersOverTimeRow[];
  totalOrdersCount: number;
  isLoading?: boolean;
}

const OrdersOverviewCharts: React.FC<OrdersOverviewChartsProps> = ({
  countsByType,
  ordersOverTime,
  totalOrdersCount,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <OrdersTrendChart
        data={ordersOverTime}
        isLoading={isLoading}
        className="lg:col-span-2"
      />
      <DashboardOrdersMixPie data={countsByType} totalCount={totalOrdersCount} isLoading={isLoading} />
    </div>
  );
};

export default OrdersOverviewCharts;
