import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatKpiSummaryLine } from './kpiMetricsText';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

const KpiHubFooter: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => (
  <div className="border-t border-border bg-muted/20 px-4 py-3 rounded-b-lg">
    {isLoading ? (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
        <span className="text-sm">Loading metrics…</span>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {formatKpiSummaryLine(stats, totalOrdersCount)}
      </p>
    )}
  </div>
);

export default KpiHubFooter;
