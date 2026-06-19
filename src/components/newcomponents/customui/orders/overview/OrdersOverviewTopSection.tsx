import React from 'react';
import { cn } from '@/lib/utils';
import type { CountsByTypeRow, StatusSlice } from '@/pages/newpages/orders/ordersOverviewData';
import type { TopFactoryRow } from '@/types/ordersOverview';
import {
  isHubAdjacentKpiStyle,
  type OrdersOverviewFactoryDisplayStyle,
  type OrdersOverviewKpiStyle,
  type OrdersOverviewStatusDisplayStyle,
  type OrdersOverviewTypeNavStyle,
} from './ordersOverviewLayoutModes';
import OrdersOverviewTypeNavSection from './OrdersOverviewTypeNavSection';
import OrdersOverviewStatusChips from './OrdersOverviewStatusChips';
import OrdersOverviewFactoryChips from './OrdersOverviewFactoryChips';
import KpiHubFooter from './variants/kpi/KpiHubFooter';
import KpiActionStrip from './variants/kpi/KpiActionStrip';
import type { OrdersOverviewKpiProps } from './variants/kpi/kpiSectionTypes';

interface OrdersOverviewTopSectionProps extends OrdersOverviewKpiProps {
  kpiStyle: OrdersOverviewKpiStyle;
  typeNavStyle: OrdersOverviewTypeNavStyle;
  statusDisplayStyle: OrdersOverviewStatusDisplayStyle;
  factoryDisplayStyle: OrdersOverviewFactoryDisplayStyle;
  countsByType: CountsByTypeRow[];
  statusBreakdown: StatusSlice[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  topFactories: TopFactoryRow[];
  factoryFilter: string;
  onFactoryFilterChange: (factoryId: string) => void;
  showFactoryHighlight: boolean;
}

const OrdersOverviewTopSection: React.FC<OrdersOverviewTopSectionProps> = ({
  kpiStyle,
  typeNavStyle,
  statusDisplayStyle,
  factoryDisplayStyle,
  countsByType,
  statusBreakdown,
  statusFilter,
  onStatusFilterChange,
  topFactories,
  factoryFilter,
  onFactoryFilterChange,
  showFactoryHighlight,
  ...kpiProps
}) => {
  const showHubFooter = kpiStyle === 'hub-footer';
  const showActionStrip = kpiStyle === 'action-strip';
  const showStatusChips = statusDisplayStyle === 'chips';
  const showFactoryChips = factoryDisplayStyle === 'hub-highlight' && showFactoryHighlight;
  const wrapWithBorder =
    typeNavStyle === 'cards' && (showHubFooter || showStatusChips || showFactoryChips);

  return (
    <div
      className={cn(
        wrapWithBorder && 'rounded-lg border border-border overflow-hidden',
        wrapWithBorder && 'bg-card'
      )}
    >
      <div className={cn(wrapWithBorder && 'p-3 pt-3')}>
        <OrdersOverviewTypeNavSection typeNavStyle={typeNavStyle} countsByType={countsByType} />
      </div>
      {isHubAdjacentKpiStyle(kpiStyle) ? (
        <div className={cn(!wrapWithBorder && 'mt-2')}>
          {showHubFooter ? <KpiHubFooter {...kpiProps} /> : null}
          {showActionStrip ? (
            <div className={cn(!wrapWithBorder && 'px-0')}>
              <KpiActionStrip {...kpiProps} />
            </div>
          ) : null}
        </div>
      ) : null}
      {showStatusChips ? (
        <OrdersOverviewStatusChips
          statusBreakdown={statusBreakdown}
          activeStatus={statusFilter}
          onStatusChange={onStatusFilterChange}
          isLoading={kpiProps.isLoading}
        />
      ) : null}
      {showFactoryChips ? (
        <OrdersOverviewFactoryChips
          factories={topFactories}
          factoryFilter={factoryFilter}
          onFactoryFilterChange={onFactoryFilterChange}
          isLoading={kpiProps.isLoading}
        />
      ) : null}
    </div>
  );
};

export default OrdersOverviewTopSection;
