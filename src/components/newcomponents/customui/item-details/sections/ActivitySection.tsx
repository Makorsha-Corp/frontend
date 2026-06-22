import React from 'react';
import { Link } from 'react-router-dom';
import { badgeVariants } from '@/components/ui/badge';
import type { ItemSummary, ItemSummaryRecentActivity } from '@/types/itemSummary';
import {
  buildMachineHref,
  buildOrderHref,
  buildStorageHref,
} from '@/lib/entityLinks';
import { cn } from '@/lib/utils';
import { formatDateTime, formatMovementTitle } from '../itemDetailsFormatters';
import { EntityLink } from '../itemDetailsShared';

export function ActivityMovementRow({
  act,
  itemId,
  onNavigate,
  index,
}: {
  act: ItemSummaryRecentActivity;
  itemId: number;
  onNavigate: () => void;
  index: number;
}) {
  const orderHref =
    act.order_type && act.order_id ? buildOrderHref(act.order_type, act.order_id) : null;
  const machineHref = act.machine_id != null ? buildMachineHref(act.machine_id) : null;
  const storageHref =
    act.factory_id != null && act.source !== 'machine'
      ? buildStorageHref({
          factoryId: act.factory_id,
          itemId,
          tab: act.source === 'product' ? 'products' : 'storage',
          inventoryType: act.inventory_type ?? undefined,
        })
      : null;
  const contextParts: React.ReactNode[] = [];
  if (act.factory_name) {
    contextParts.push(
      storageHref ? (
        <EntityLink
          key="factory"
          to={storageHref}
          onNavigate={onNavigate}
          className="text-xs font-normal"
        >
          {act.factory_name}
        </EntityLink>
      ) : (
        act.factory_name
      )
    );
  }
  if (act.machine_name) {
    contextParts.push(
      machineHref ? (
        <EntityLink
          key="machine"
          to={machineHref}
          onNavigate={onNavigate}
          className="text-xs font-normal"
        >
          {act.machine_name}
        </EntityLink>
      ) : (
        act.machine_name
      )
    );
  }

  return (
    <li
      key={`${act.source}-${act.performed_at}-${index}`}
      className="flex items-center justify-between gap-3 px-3 py-2"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-medium capitalize">
            {formatMovementTitle(act.transaction_type, act)}
          </span>
          {orderHref ? (
            <Link
              to={orderHref}
              onClick={onNavigate}
              className={cn(
                badgeVariants({ variant: 'default' }),
                'shrink-0 cursor-pointer border-transparent bg-brand-primary font-medium text-primary-foreground hover:bg-brand-primary-hover'
              )}
            >
              {act.order_number ?? `#${act.order_id}`}
            </Link>
          ) : null}
        </div>
        {contextParts.length > 0 ? (
          <p className="truncate text-xs text-muted-foreground">
            {contextParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 ? ' · ' : null}
                {part}
              </React.Fragment>
            ))}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 space-y-0.5 text-right">
        <p className="font-medium tabular-nums">
          {act.quantity > 0 ? '+' : ''}
          {act.quantity}
        </p>
        <p className="text-[10px] text-muted-foreground">{formatDateTime(act.performed_at)}</p>
      </div>
    </li>
  );
}

export function ActivityMovementList({
  activities,
  itemId,
  onNavigate,
  limit,
  className,
}: {
  activities: ItemSummaryRecentActivity[];
  itemId: number;
  onNavigate: () => void;
  limit?: number;
  className?: string;
}) {
  const rows = limit != null ? activities.slice(0, limit) : activities;

  return (
    <ul
      className={cn(
        'divide-y divide-border/60 rounded-lg border border-border text-sm',
        className
      )}
    >
      {rows.map((act, idx) => (
        <ActivityMovementRow
          key={`${act.source}-${act.performed_at}-${idx}`}
          act={act}
          itemId={itemId}
          onNavigate={onNavigate}
          index={idx}
        />
      ))}
    </ul>
  );
}

export function ActivitySection({
  summary,
  itemId,
  onNavigate,
}: {
  summary: ItemSummary;
  itemId: number;
  onNavigate: () => void;
}) {
  if (summary.recent_activity.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">No recent movements.</p>
    );
  }

  return (
    <ActivityMovementList
      activities={summary.recent_activity}
      itemId={itemId}
      onNavigate={onNavigate}
    />
  );
}
