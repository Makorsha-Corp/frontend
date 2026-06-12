import type { OverviewOrderKind } from '@/pages/newpages/orders/ordersOverviewData';

export const ORDER_TYPE_PATHS: Record<OverviewOrderKind, string> = {
  purchase: '/orders/purchase',
  transfer: '/orders/transfer',
  expense: '/orders/expense',
  sales: '/orders/sales',
  work: '/orders/work',
};

export const ORDER_TYPE_LABELS: Record<OverviewOrderKind, string> = {
  purchase: 'Purchase',
  transfer: 'Transfer',
  expense: 'Expense',
  sales: 'Sales',
  work: 'Work',
};

export const PASTEL_CHART_FILLS = [
  'var(--pastel-1, hsla(257, 43%, 70%, 1))',
  'var(--pastel-2, hsla(192, 95%, 76%, 1))',
  'var(--pastel-3, hsla(83, 46%, 75%, 1))',
  'var(--pastel-4, hsla(57, 75%, 84%, 1))',
  'var(--pastel-5, hsla(15, 77%, 90%, 1))',
] as const;

export function formatDashboardCurrency(value: number): string {
  if (value <= 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
