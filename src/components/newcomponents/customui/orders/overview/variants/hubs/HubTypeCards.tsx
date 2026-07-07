import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { ORDER_TYPE_HUB, formatOverviewCurrency } from '../../ordersOverviewConstants';
import { hubDraftSearch, hubOpenSearch } from '@/pages/newpages/orders/orderListUrlParams';

interface HubTypeCardsProps {
  countsByType: CountsByTypeRow[];
}

const emptyRow = (label: string): CountsByTypeRow => ({
  type: label,
  count: 0,
  value: 0,
  draftCount: 0,
  openCount: 0,
});

const hubPillClass =
  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40';

// Work orders now live inside the Machine detail view as quick actions rather than
// through a standalone creation flow — drop the tile from the hub grid but keep 'work'
// in ORDER_TYPE_HUB itself so path/label lookups elsewhere (e.g. recent activity) still work.
const HUB_TILES = ORDER_TYPE_HUB.filter((h) => h.id !== 'work');

const HubTypeCards: React.FC<HubTypeCardsProps> = ({ countsByType }) => {
  const countMap = new Map(countsByType.map((r) => [r.type, r]));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {HUB_TILES.map((hub) => {
        const row = countMap.get(hub.label) ?? emptyRow(hub.label);
        const Icon = hub.icon;
        const hasDraftOrOpen = row.draftCount > 0 || row.openCount > 0;
        const draftSearch = hubDraftSearch(hub.id);
        const openSearch = hubOpenSearch(hub.id);

        return (
          <Card
            key={hub.id}
            className={cn(
              'border-border transition-colors',
              hasDraftOrOpen &&
                'border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400/40'
            )}
          >
            <Link to={hub.path} className="group block min-w-0 hover:no-underline">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    hasDraftOrOpen ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-brand-primary/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      hasDraftOrOpen ? 'text-amber-600 dark:text-amber-400' : 'text-brand-primary'
                    )}
                  />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardHeader>
              <CardContent className="px-4 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground group-hover:text-brand-primary">
                  {hub.label}
                </CardTitle>
                <p className="mt-1 text-2xl font-bold tabular-nums">{row.count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.value > 0 ? formatOverviewCurrency(row.value) : 'No value tracked'}
                </p>
              </CardContent>
            </Link>

            {hasDraftOrOpen ? (
              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4 pt-1">
                {row.draftCount > 0 ? (
                  draftSearch ? (
                    <Link
                      to={`${hub.path}?${draftSearch}`}
                      className={cn(
                        hubPillClass,
                        'border-amber-300/60 text-amber-700 dark:border-amber-700/50 dark:text-amber-400'
                      )}
                    >
                      {row.draftCount} draft
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        hubPillClass,
                        'border-border text-muted-foreground cursor-default'
                      )}
                    >
                      {row.draftCount} draft
                    </span>
                  )
                ) : null}
                {row.openCount > 0 ? (
                  openSearch ? (
                    <Link
                      to={`${hub.path}?${openSearch}`}
                      className={cn(
                        hubPillClass,
                        'border-amber-400/70 text-amber-800 dark:border-amber-600/50 dark:text-amber-300'
                      )}
                    >
                      {row.openCount} open
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        hubPillClass,
                        'border-border text-muted-foreground cursor-default'
                      )}
                    >
                      {row.openCount} open
                    </span>
                  )
                ) : null}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
};

export default HubTypeCards;
