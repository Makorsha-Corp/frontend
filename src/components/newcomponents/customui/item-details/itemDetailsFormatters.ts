import type { ItemSummaryRecentActivity } from '@/types/itemSummary';

export function num(v: number | string | null | undefined): number {
  if (v == null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

export function formatQty(v: number | string, unit?: string): string {
  const n = num(v);
  const formatted = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatMoney(v: number | string | null | undefined): string {
  if (v == null || v === '') return '—';
  return num(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const [year, month, day] = iso.split('T')[0].split('-').map(Number);
    if (!year || !month || !day) return '—';
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function movementLocationLabel(act: ItemSummaryRecentActivity): string {
  if (act.source === 'machine') return 'Machine';
  if (act.source === 'product') return 'Products';
  switch (act.inventory_type?.toUpperCase()) {
    case 'STORAGE':
      return 'Storage';
    case 'DAMAGED':
      return 'Damaged';
    case 'WASTE':
      return 'Waste';
    case 'SCRAP':
      return 'Scrap';
    default:
      return 'Storage';
  }
}

export function formatMovementTitle(
  transactionType: string,
  act: ItemSummaryRecentActivity
): string {
  return `${transactionType.replace(/_/g, ' ')} · ${movementLocationLabel(act)}`;
}

export function formatItemRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
