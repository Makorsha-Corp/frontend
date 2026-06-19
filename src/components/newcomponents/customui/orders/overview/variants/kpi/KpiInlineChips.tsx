import React from 'react';
import { Loader2 } from 'lucide-react';
import { buildKpiSummaryParts } from './kpiMetricsText';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

const KpiInlineChips: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => {
  const parts = buildKpiSummaryParts(stats, totalOrdersCount);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((part) => (
        <div
          key={part.label}
          className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <span className="font-semibold tabular-nums">{part.value}</span>
          <span className="text-muted-foreground text-xs">{part.label}</span>
        </div>
      ))}
    </div>
  );
};

export default KpiInlineChips;
