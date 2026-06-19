import React from 'react';
import type {
  OrdersOverviewKpiStyle,
  OrdersOverviewPageStructure,
  OrdersOverviewStatusDisplayStyle,
} from './ordersOverviewLayoutModes';
import OrdersTopItemsPanel from './OrdersTopItemsPanel';
import OrdersTopAccountsPanel from './OrdersTopAccountsPanel';
import OrdersExpenseCategoriesPanel from './OrdersExpenseCategoriesPanel';
import OrdersTopFactoriesPanel from './OrdersTopFactoriesPanel';
import OrdersOverviewCompactInsightsPanel from './OrdersOverviewCompactInsightsPanel';
import OrdersOverviewCharts from './OrdersOverviewCharts';
import OrdersOverviewStatusPipeline from './OrdersOverviewStatusPipeline';
import OrdersRecentActivityTable from './OrdersRecentActivityTable';
import OrdersOverviewAboutMetrics from './OrdersOverviewAboutMetrics';
import type {
  CountsByTypeRow,
  ExtendedOverviewStats,
  OrdersOverTimeRow,
  OverviewOrder,
  StatusSlice,
} from '@/pages/newpages/orders/ordersOverviewData';
import type { OrdersOverviewStats } from '@/types/ordersOverview';
import {
  formatKpiShortSummary,
  formatKpiStatusContext,
  formatKpiTrendContext,
} from './variants/kpi/kpiMetricsText';

interface OrdersOverviewPageBodyProps {
  pageStructure: OrdersOverviewPageStructure;
  kpiStyle: OrdersOverviewKpiStyle;
  statusDisplayStyle: OrdersOverviewStatusDisplayStyle;
  showFactoryPanel: boolean;
  onFactorySelect?: (factoryId: string) => void;
  stats: ExtendedOverviewStats;
  isLoading: boolean;
  loadStats: boolean;
  salesMayTruncate?: boolean;
  countsByType: CountsByTypeRow[];
  statusBreakdown: StatusSlice[];
  ordersOverTime: OrdersOverTimeRow[];
  totalOrdersCount: number;
  filteredRecentOrders: OverviewOrder[];
  apiStats: OrdersOverviewStats;
}

const OrdersOverviewPageBody: React.FC<OrdersOverviewPageBodyProps> = ({
  pageStructure,
  kpiStyle,
  statusDisplayStyle,
  showFactoryPanel,
  onFactorySelect,
  stats,
  isLoading,
  loadStats,
  salesMayTruncate,
  countsByType,
  statusBreakdown,
  ordersOverTime,
  totalOrdersCount,
  filteredRecentOrders,
  apiStats,
}) => {
  const chartContextActive = kpiStyle === 'chart-context';
  const tableContextActive = kpiStyle === 'table-context';
  const showStatusPipeline = statusDisplayStyle === 'card';

  const trendSubtitle = chartContextActive
    ? formatKpiTrendContext(stats, totalOrdersCount)
    : undefined;
  const statusSubtitle =
    chartContextActive && showStatusPipeline ? formatKpiStatusContext(stats) : undefined;
  const tableContextSummary = tableContextActive
    ? formatKpiShortSummary(stats, totalOrdersCount)
    : undefined;

  const chartProps = {
    countsByType,
    ordersOverTime,
    statusBreakdown,
    totalOrdersCount,
    isLoading,
    trendSubtitle,
    statusSubtitle,
    showStatusPipeline,
  };

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

  const chartsDefault = <OrdersOverviewCharts {...chartProps} />;
  const chartsCompact = <OrdersOverviewCharts {...chartProps} variant="compact" />;

  const recentTable = (
    <OrdersRecentActivityTable
      orders={filteredRecentOrders}
      isLoading={isLoading}
      contextSummary={tableContextSummary}
    />
  );
  const about = <OrdersOverviewAboutMetrics salesMayTruncate={salesMayTruncate} />;

  switch (pageStructure) {
    case 'analytics-first':
      return (
        <>
          {chartsDefault}
          {insightsRow}
          {recentTable}
          {about}
        </>
      );

    case 'operations':
      return (
        <>
          {recentTable}
          {insightsRow}
          {chartsDefault}
          {about}
        </>
      );

    case 'split-insights':
      return (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <OrdersTopItemsPanel items={apiStats.top_items} isLoading={loadStats} />
              <OrdersTopAccountsPanel
                vendors={apiStats.top_vendors}
                customers={apiStats.top_customers}
                isLoading={loadStats}
              />
            </div>
            <div className="space-y-6">
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
              {showStatusPipeline ? (
                <OrdersOverviewStatusPipeline
                  statusBreakdown={statusBreakdown}
                  isLoading={isLoading}
                  subtitle={statusSubtitle}
                />
              ) : null}
            </div>
          </div>
          {chartsCompact}
          {recentTable}
          {about}
        </>
      );

    case 'compact-insights':
      return (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <OrdersTopItemsPanel items={apiStats.top_items} isLoading={loadStats} />
            <OrdersOverviewCompactInsightsPanel
              vendors={apiStats.top_vendors}
              customers={apiStats.top_customers}
              categories={apiStats.top_expense_categories}
              isLoading={loadStats}
            />
          </div>
          {showFactoryPanel ? (
            <OrdersTopFactoriesPanel
              factories={apiStats.top_factories}
              isLoading={loadStats}
              onFactorySelect={onFactorySelect}
            />
          ) : null}
          {chartsCompact}
          {recentTable}
          {about}
        </>
      );

    case 'stacked':
    default:
      return (
        <>
          {insightsRow}
          {chartsDefault}
          {recentTable}
          {about}
        </>
      );
  }
};

export default OrdersOverviewPageBody;
