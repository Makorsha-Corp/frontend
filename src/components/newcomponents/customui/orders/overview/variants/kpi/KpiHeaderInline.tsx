import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatKpiSummaryLine } from './kpiMetricsText';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

/** Renders in AppShellHeader; body KPI section returns null for header-inline mode. */
export const OrdersOverviewKpiHeaderInline: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-primary" />
        Loading metrics…
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
      {formatKpiSummaryLine(stats, totalOrdersCount)}
    </p>
  );
};

const KpiHeaderInline: React.FC<OrdersOverviewKpiProps> = () => null;

export default KpiHeaderInline;
