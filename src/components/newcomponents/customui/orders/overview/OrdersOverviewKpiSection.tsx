import React from 'react';
import type { OrdersOverviewKpiStyle } from './ordersOverviewLayoutModes';
import KpiStatCards from './variants/kpi/KpiStatCards';
import KpiHeroBar from './variants/kpi/KpiHeroBar';
import KpiInlineChips from './variants/kpi/KpiInlineChips';
import KpiFocusedPair from './variants/kpi/KpiFocusedPair';
import KpiActionAlerts from './variants/kpi/KpiActionAlerts';
import KpiHeaderInline from './variants/kpi/KpiHeaderInline';
import KpiNone from './variants/kpi/KpiNone';
import type { OrdersOverviewKpiProps } from './variants/kpi/kpiSectionTypes';

interface OrdersOverviewKpiSectionProps extends OrdersOverviewKpiProps {
  kpiStyle: OrdersOverviewKpiStyle;
}

const OrdersOverviewKpiSection: React.FC<OrdersOverviewKpiSectionProps> = ({
  kpiStyle,
  ...props
}) => {
  switch (kpiStyle) {
    case 'hero-bar':
      return <KpiHeroBar {...props} />;
    case 'inline-chips':
      return <KpiInlineChips {...props} />;
    case 'focused-pair':
      return <KpiFocusedPair {...props} />;
    case 'action-alerts':
      return <KpiActionAlerts {...props} />;
    case 'header-inline':
    case 'hub-footer':
    case 'action-strip':
    case 'chart-context':
    case 'table-context':
      return <KpiNone {...props} />;
    case 'none':
      return null;
    case 'stat-cards':
    default:
      return <KpiStatCards {...props} />;
  }
};

export default OrdersOverviewKpiSection;
