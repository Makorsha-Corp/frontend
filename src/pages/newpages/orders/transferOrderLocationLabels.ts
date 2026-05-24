import type { TransferOrder } from '@/types/transferOrder';

export type TransferLocationTypeFilter = 'all' | 'storage' | 'machine' | 'project' | 'damaged';

export interface TransferLocationLabelContext {
  factories: { id: number; name: string }[];
  machines: { id: number; name: string }[];
  projects: { id: number; name: string }[];
}

export function transferLocationLabel(
  type: string,
  id: number,
  ctx: TransferLocationLabelContext
): string {
  if (type === 'storage') {
    const f = ctx.factories.find((x) => x.id === id);
    return f ? `Storage · ${f.name}` : `Storage #${id}`;
  }
  if (type === 'damaged') {
    const f = ctx.factories.find((x) => x.id === id);
    return f ? `Damaged · ${f.name}` : `Damaged #${id}`;
  }
  if (type === 'machine') {
    const m = ctx.machines.find((x) => x.id === id);
    return m ? `Machine · ${m.name}` : `Machine #${id}`;
  }
  if (type === 'project') {
    const p = ctx.projects.find((x) => x.id === id);
    return p ? `Project · ${p.name}` : `Project #${id}`;
  }
  return `${type} #${id}`;
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
