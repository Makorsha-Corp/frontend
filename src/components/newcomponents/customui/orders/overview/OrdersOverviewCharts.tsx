import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardOrdersMixPie from '@/components/newcomponents/customui/dashboard/DashboardOrdersMixPie';
import OrdersTrendChart from '@/components/newcomponents/customui/orders/OrdersTrendChart';
import type { CountsByTypeRow, OrdersOverTimeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { overviewAggregateTypeLabel } from './overviewOrderTypeLabels';

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
  const { t } = useTranslation('orders');

  const resolveTypeLabel = useCallback(
    (englishType: string) => overviewAggregateTypeLabel(englishType, t),
    [t],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <OrdersTrendChart
        data={ordersOverTime}
        isLoading={isLoading}
        className="lg:col-span-2"
        title={t('overviewChartOverTimeTitle')}
        subtitle={t('overviewChartOverTimeSubtitle')}
        emptyMessage={t('overviewChartPickDateRange')}
      />
      <DashboardOrdersMixPie
        data={countsByType}
        totalCount={totalOrdersCount}
        isLoading={isLoading}
        title={t('overviewChartByTypeTitle')}
        emptyMessage={t('overviewChartNoOrdersInScope')}
        centerCaption={t('overviewChartTotalCaption')}
        resolveTypeLabel={resolveTypeLabel}
      />
    </div>
  );
};

export default OrdersOverviewCharts;
