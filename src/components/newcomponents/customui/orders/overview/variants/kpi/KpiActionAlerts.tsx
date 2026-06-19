import React from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatKpiSummaryLine } from './kpiMetricsText';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

const KpiActionAlerts: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => {
  const alerts = [
    { label: 'Pending approvals', value: stats.pendingApprovalsCount, variant: 'secondary' as const },
    { label: 'Overdue', value: stats.overdueCount, variant: 'destructive' as const },
    { label: 'Not invoiced', value: stats.notInvoicedCount, variant: 'outline' as const },
  ].filter((a) => a.value > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{formatKpiSummaryLine(stats, totalOrdersCount)}</p>
      {alerts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <Badge key={alert.label} variant={alert.variant} className="gap-1.5 px-3 py-1">
              <span className="font-semibold tabular-nums">{alert.value}</span>
              {alert.label}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No pending actions in this range.</p>
      )}
    </div>
  );
};

export default KpiActionAlerts;
