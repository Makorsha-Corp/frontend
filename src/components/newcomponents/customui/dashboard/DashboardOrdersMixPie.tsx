import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { PASTEL_CHART_FILLS } from './dashboardConstants';

interface DashboardOrdersMixPieProps {
  data: CountsByTypeRow[];
  totalCount: number;
  isLoading?: boolean;
}

const DashboardOrdersMixPie: React.FC<DashboardOrdersMixPieProps> = ({
  data,
  totalCount,
  isLoading,
}) => {
  const pieData = useMemo(
    () => data.filter((row) => row.count > 0).map((row) => ({ name: row.type, value: row.count })),
    [data]
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Orders by type</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : pieData.length === 0 ? (
          <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No orders in scope
          </p>
        ) : (
          <>
            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PASTEL_CHART_FILLS[i % PASTEL_CHART_FILLS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-card-foreground">{totalCount}</div>
                  <div className="text-xs text-muted-foreground">ORDERS</div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {data.map((row, i) => (
                <div key={row.type} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: PASTEL_CHART_FILLS[i % PASTEL_CHART_FILLS.length] }}
                  />
                  <span className="truncate">
                    {row.type} ({row.count})
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardOrdersMixPie;
