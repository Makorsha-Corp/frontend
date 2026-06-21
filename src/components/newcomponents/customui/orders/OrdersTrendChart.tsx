import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
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
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={36}
                  tickMargin={6}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.25 }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
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
