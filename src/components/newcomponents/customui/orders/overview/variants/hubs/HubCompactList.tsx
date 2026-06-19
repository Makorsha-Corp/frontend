import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { ORDER_TYPE_HUB, formatOverviewCurrency } from '../../ordersOverviewConstants';

interface HubCompactListProps {
  countsByType: CountsByTypeRow[];
}

const HubCompactList: React.FC<HubCompactListProps> = ({ countsByType }) => {
  const countMap = new Map(countsByType.map((r) => [r.type, r]));

  return (
    <Card className="border-border">
      <CardContent className="p-0 divide-y divide-border">
        {ORDER_TYPE_HUB.map((hub) => {
          const row = countMap.get(hub.label) ?? { type: hub.label, count: 0, value: 0, openCount: 0 };
          const Icon = hub.icon;
          return (
            <Link
              key={hub.id}
              to={hub.path}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary/10">
                <Icon className="h-4 w-4 text-brand-primary" />
              </div>
              <span className="flex-1 min-w-0 font-medium text-sm">{hub.label}</span>
              <span className="tabular-nums font-semibold text-sm">{row.count}</span>
              <span className="text-xs text-muted-foreground w-20 text-right hidden sm:block">
                {row.value > 0 ? formatOverviewCurrency(row.value) : '—'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default HubCompactList;
