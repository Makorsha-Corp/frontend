import type { TransferOrder } from '@/types/transferOrder';

export type TransferLocationTypeFilter = 'all' | 'storage' | 'machine' | 'project' | 'damaged';

export interface TransferLocationLabelContext {
  factories: { id: number; name: string }[];
  machines: { id: number; name: string }[];
  projects: { id: number; name: string }[];
}

export function transferLocationName(
  type: string,
  id: number,
  ctx: TransferLocationLabelContext
): string {
  if (type === 'storage' || type === 'damaged') {
    const f = ctx.factories.find((x) => x.id === id);
    return f?.name ?? `#${id}`;
  }
  if (type === 'machine') {
    const m = ctx.machines.find((x) => x.id === id);
    return m?.name ?? `#${id}`;
  }
  if (type === 'project') {
    const p = ctx.projects.find((x) => x.id === id);
    return p?.name ?? `#${id}`;
  }
  return `#${id}`;
}

const LOCATION_TYPE_LABEL: Record<string, string> = {
  storage: 'Storage',
  machine: 'Machine',
  damaged: 'Damaged',
  project: 'Project',
};

export function transferLocationTypeLabel(type: string): string {
  return LOCATION_TYPE_LABEL[type] ?? type;
}

export function transferLocationLabel(
  type: string,
  id: number,
  ctx: TransferLocationLabelContext
): string {
  const name = transferLocationName(type, id, ctx);
  const typeLabel = transferLocationTypeLabel(type);
  return `${typeLabel} · ${name}`;
}

export function transferRouteLabel(order: TransferOrder, ctx: TransferLocationLabelContext): string {
  const from = transferLocationLabel(order.source_location_type, order.source_location_id, ctx);
  const to = transferLocationLabel(
    order.destination_location_type,
    order.destination_location_id,
    ctx
  );
  return `${from} → ${to}`;
}

export function transferRouteTypeLabel(order: TransferOrder): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(order.source_location_type)} → ${cap(order.destination_location_type)}`;
}
