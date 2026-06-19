import React from 'react';
import DashboardOrdersMixPie from '@/components/newcomponents/customui/dashboard/DashboardOrdersMixPie';
import OrdersTrendChart from '@/components/newcomponents/customui/orders/OrdersTrendChart';
import type { CountsByTypeRow, OrdersOverTimeRow, StatusSlice } from '@/pages/newpages/orders/ordersOverviewData';
import OrdersOverviewStatusPipeline from './OrdersOverviewStatusPipeline';

interface OrdersOverviewChartsProps {
  countsByType: CountsByTypeRow[];
  ordersOverTime: OrdersOverTimeRow[];
  statusBreakdown: StatusSlice[];
  totalOrdersCount: number;
  isLoading?: boolean;
  variant?: 'default' | 'compact';
  trendSubtitle?: string;
  statusSubtitle?: string;
  showStatusPipeline?: boolean;
}

const OrdersOverviewCharts: React.FC<OrdersOverviewChartsProps> = ({
  countsByType,
  ordersOverTime,
  statusBreakdown,
  totalOrdersCount,
  isLoading,
  variant = 'default',
  trendSubtitle,
  statusSubtitle,
  showStatusPipeline = false,
}) => {
  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <OrdersTrendChart
          data={ordersOverTime}
          isLoading={isLoading}
          className="lg:col-span-3"
          subtitle={trendSubtitle}
        />
        <DashboardOrdersMixPie data={countsByType} totalCount={totalOrdersCount} isLoading={isLoading} />
      </div>
    );
  }

  if (showStatusPipeline) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <OrdersTrendChart
          data={ordersOverTime}
          isLoading={isLoading}
          className="lg:col-span-2"
          subtitle={trendSubtitle}
        />
        <DashboardOrdersMixPie data={countsByType} totalCount={totalOrdersCount} isLoading={isLoading} />
        <OrdersOverviewStatusPipeline
          statusBreakdown={statusBreakdown}
          isLoading={isLoading}
          className="lg:col-span-1"
          subtitle={statusSubtitle}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <OrdersTrendChart
        data={ordersOverTime}
        isLoading={isLoading}
        className="lg:col-span-2"
        subtitle={trendSubtitle}
      />
      <DashboardOrdersMixPie data={countsByType} totalCount={totalOrdersCount} isLoading={isLoading} />
    </div>
  );
};

export default OrdersOverviewCharts;
