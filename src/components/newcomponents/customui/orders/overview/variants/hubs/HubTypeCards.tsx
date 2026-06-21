import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { ORDER_TYPE_HUB, formatOverviewCurrency } from '../../ordersOverviewConstants';
import { purchaseOrdersOpenHubSearch } from '@/pages/newpages/orders/orderListUrlParams';

interface HubTypeCardsProps {
  countsByType: CountsByTypeRow[];
}

const emptyRow = (label: string): CountsByTypeRow => ({
  type: label,
  count: 0,
  value: 0,
  openCount: 0,
});

const HubTypeCards: React.FC<HubTypeCardsProps> = ({ countsByType }) => {
  const countMap = new Map(countsByType.map((r) => [r.type, r]));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {ORDER_TYPE_HUB.map((hub) => {
        const row = countMap.get(hub.label) ?? emptyRow(hub.label);
        const Icon = hub.icon;
        const hasOpen = row.openCount > 0;
        const openSearch =
          hub.id === 'purchase' ? purchaseOrdersOpenHubSearch() : 'scope=open';
        const href = hasOpen ? `${hub.path}?${openSearch}` : hub.path;
        return (
          <Link key={hub.id} to={href} className="group block min-w-0">
            <Card
              className={cn(
                'border-border transition-colors hover:border-brand-primary/40 hover:bg-muted/30',
                hasOpen && 'border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400/40'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    hasOpen ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-brand-primary/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      hasOpen ? 'text-amber-600 dark:text-amber-400' : 'text-brand-primary'
                    )}
                  />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <CardTitle className="text-sm font-medium text-card-foreground">{hub.label}</CardTitle>
                <p className="mt-1 text-2xl font-bold tabular-nums">{row.count}</p>
                {hasOpen ? (
                  <p className="mt-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {row.openCount} open
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">No open orders</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.value > 0 ? formatOverviewCurrency(row.value) : 'No value tracked'}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default HubTypeCards;
