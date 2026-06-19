import React from 'react';
import { Link } from 'react-router-dom';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import { ORDER_TYPE_HUB } from '../../ordersOverviewConstants';

interface HubIconRailProps {
  countsByType: CountsByTypeRow[];
}

const HubIconRail: React.FC<HubIconRailProps> = ({ countsByType }) => {
  const countMap = new Map(countsByType.map((r) => [r.type, r]));

  return (
    <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6 py-1">
      {ORDER_TYPE_HUB.map((hub) => {
        const row = countMap.get(hub.label) ?? { type: hub.label, count: 0, value: 0, openCount: 0 };
        const Icon = hub.icon;
        return (
          <Link
            key={hub.id}
            to={hub.path}
            className="flex flex-col items-center gap-1 min-w-[56px] text-center hover:opacity-80 transition-opacity"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background">
              <Icon className="h-4 w-4 text-brand-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground leading-tight">{hub.label}</span>
            <span className="text-sm font-bold tabular-nums">{row.count}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default HubIconRail;
