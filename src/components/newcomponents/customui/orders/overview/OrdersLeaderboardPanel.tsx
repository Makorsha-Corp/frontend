import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatOverviewCurrency, formatOverviewNumber } from './ordersOverviewConstants';

export interface LeaderboardRow {
  id: string | number;
  label: string;
  primary: string;
  secondary?: string;
  value: number;
}

interface OrdersLeaderboardPanelProps {
  title: string;
  rows: LeaderboardRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  valueMode?: 'currency' | 'number';
  embedded?: boolean;
  onRowClick?: (id: string | number) => void;
}

const OrdersLeaderboardPanel: React.FC<OrdersLeaderboardPanelProps> = ({
  title,
  rows,
  isLoading,
  emptyMessage = 'No data in this range',
  valueMode = 'currency',
  embedded = false,
  onRowClick,
}) => {
  const maxValue = rows.length > 0 ? Math.max(...rows.map((r) => r.value), 1) : 1;

  const body = isLoading ? (
          <div className="flex py-10 items-center justify-center text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => {
              const pct = Math.max(8, (row.value / maxValue) * 100);
              const display =
                valueMode === 'currency'
                  ? formatOverviewCurrency(row.value)
                  : formatOverviewNumber(row.value, row.value % 1 !== 0 ? 1 : 0);
              return (
                <div key={row.id} className="space-y-1">
                  <div className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0 flex items-baseline gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-4 shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        {onRowClick ? (
                          <button
                            type="button"
                            onClick={() => onRowClick(row.id)}
                            className="font-medium truncate text-left hover:text-brand-primary transition-colors"
                          >
                            {row.label}
                          </button>
                        ) : (
                          <p className="font-medium truncate">{row.label}</p>
                        )}
                        {row.secondary ? (
                          <p className="text-xs text-muted-foreground truncate">{row.secondary}</p>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">{display}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-brand-primary/70')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {row.primary ? (
                    <p className="text-[11px] text-muted-foreground pl-6">{row.primary}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        );

  if (embedded) return <div className="h-full">{body}</div>;

  return (
    <Card className="border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};

export default OrdersLeaderboardPanel;
