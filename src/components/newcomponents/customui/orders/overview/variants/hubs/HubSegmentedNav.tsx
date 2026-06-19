import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { ORDER_TYPE_HUB, formatOverviewCurrency } from '../../ordersOverviewConstants';

interface HubSegmentedNavProps {
  countsByType: CountsByTypeRow[];
}

const HubSegmentedNav: React.FC<HubSegmentedNavProps> = ({ countsByType }) => {
  const countMap = new Map(countsByType.map((r) => [r.type, r]));

  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/20 p-2">
      {ORDER_TYPE_HUB.map((hub) => {
        const row = countMap.get(hub.label) ?? { type: hub.label, count: 0, value: 0, openCount: 0 };
        const Icon = hub.icon;
        return (
          <Link
            key={hub.id}
            to={hub.path}
            title={row.value > 0 ? formatOverviewCurrency(row.value) : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border border-transparent bg-background px-3 py-2 text-sm',
              'hover:border-brand-primary/30 hover:bg-muted/50 transition-colors'
            )}
          >
            <Icon className="h-4 w-4 text-brand-primary shrink-0" />
            <span className="font-medium">{hub.label}</span>
            <Badge variant="secondary" className="tabular-nums px-1.5 py-0 text-xs">
              {row.count}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
};

export default HubSegmentedNav;
