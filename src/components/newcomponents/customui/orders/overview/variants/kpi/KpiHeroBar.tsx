import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatKpiSummaryLine } from './kpiMetricsText';
import type { OrdersOverviewKpiProps } from './kpiSectionTypes';

const KpiHeroBar: React.FC<OrdersOverviewKpiProps> = ({
  stats,
  totalOrdersCount,
  isLoading,
}) => (
  <Card className="border-border bg-muted/30">
    <CardContent className="py-4 px-5">
      {isLoading ? (
        <div className="flex items-center justify-center py-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : (
        <p className="text-sm sm:text-base text-foreground leading-relaxed">
          {formatKpiSummaryLine(stats, totalOrdersCount)}
        </p>
      )}
    </CardContent>
  </Card>
);

export default KpiHeroBar;
