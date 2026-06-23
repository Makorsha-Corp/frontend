import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Cpu,
  FolderKanban,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransferOrder } from '@/types/transferOrder';
import {
  transferLocationName,
  transferLocationTypeLabel,
  type TransferLocationLabelContext,
} from '@/pages/newpages/orders/transferOrderLocationLabels';

const LOCATION_ICONS: Record<string, LucideIcon> = {
  storage: Warehouse,
  machine: Cpu,
  damaged: AlertTriangle,
  project: FolderKanban,
};

export function transferLocationIcon(
  type: string,
  className = 'h-3.5 w-3.5 shrink-0 text-muted-foreground'
) {
  const Icon = LOCATION_ICONS[type] ?? Warehouse;
  return <Icon className={className} aria-hidden />;
}

export interface TransferLocationDisplayProps {
  type: string;
  id: number;
  ctx: TransferLocationLabelContext;
  iconClassName?: string;
  className?: string;
}

export function TransferLocationDisplay({
  type,
  id,
  ctx,
  iconClassName,
  className,
}: TransferLocationDisplayProps) {
  const name = transferLocationName(type, id, ctx);
  const typeLabel = transferLocationTypeLabel(type);

  return (
    <span
      className={cn('inline-flex min-w-0 items-center gap-1', className)}
      title={`${typeLabel} · ${name}`}
    >
      {transferLocationIcon(type, iconClassName)}
      <span className="truncate">{name}</span>
    </span>
  );
}

export interface TransferRouteDisplayProps {
  order: TransferOrder;
  ctx: TransferLocationLabelContext;
  className?: string;
  iconClassName?: string;
}

export function TransferRouteDisplay({
  order,
  ctx,
  className,
  iconClassName,
}: TransferRouteDisplayProps) {
  return (
    <span className={cn('inline-flex min-w-0 max-w-full items-center gap-1.5', className)}>
      <TransferLocationDisplay
        type={order.source_location_type}
        id={order.source_location_id}
        ctx={ctx}
        iconClassName={iconClassName}
        className="min-w-0 max-w-[46%]"
      />
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
      <TransferLocationDisplay
        type={order.destination_location_type}
        id={order.destination_location_id}
        ctx={ctx}
        iconClassName={iconClassName}
        className="min-w-0 max-w-[46%]"
      />
    </span>
  );
}

export interface TransferRouteTypeIconsProps {
  order: TransferOrder;
  className?: string;
  iconClassName?: string;
}

/** Icon-only source → destination (no entity names). */
export function TransferRouteTypeIcons({
  order,
  className,
  iconClassName = 'h-3.5 w-3.5 shrink-0 text-muted-foreground',
}: TransferRouteTypeIconsProps) {
  const sourceType = transferLocationTypeLabel(order.source_location_type);
  const destType = transferLocationTypeLabel(order.destination_location_type);

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      title={`${sourceType} → ${destType}`}
    >
      {transferLocationIcon(order.source_location_type, iconClassName)}
      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
      {transferLocationIcon(order.destination_location_type, iconClassName)}
    </span>
  );
}
