import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { OrdersOverTimeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { PASTEL_CHART_FILLS } from '@/components/newcomponents/customui/orders/overview/ordersOverviewConstants';

export interface OrdersTrendChartProps {
  data: OrdersOverTimeRow[];
  isLoading?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
}

const OrdersTrendChart: React.FC<OrdersTrendChartProps> = ({
  data,
  isLoading,
  className,
  title = 'Orders over time',
  subtitle = 'Daily count in selected range',
  emptyMessage = 'Pick a date range to see the chart',
}) => {
  const hasData = data.some((row) => row.count > 0);

  return (
    <Card className={`border-border ${className ?? ''}`}>
      <CardHeader>
        <CardTitle className="text-card-foreground">{title}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : !hasData ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
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

export default OrdersTrendChart;
