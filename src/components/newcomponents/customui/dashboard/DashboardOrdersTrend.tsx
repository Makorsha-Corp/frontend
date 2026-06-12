import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { OrdersOverTimeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { PASTEL_CHART_FILLS } from './dashboardConstants';

interface DashboardOrdersTrendProps {
  data: OrdersOverTimeRow[];
  isLoading?: boolean;
}

const DashboardOrdersTrend: React.FC<DashboardOrdersTrendProps> = ({ data, isLoading }) => {
  const hasData = data.some((row) => row.count > 0);

  return (
    <Card className="lg:col-span-2 border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">Order activity</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : !hasData ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No orders in the last 30 days
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={32} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.map((row, index) => (
                    <Cell
                      key={`${index}-${row.date}`}
                      fill={PASTEL_CHART_FILLS[index % PASTEL_CHART_FILLS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardOrdersTrend;
