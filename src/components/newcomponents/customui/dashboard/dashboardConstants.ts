import type { OverviewOrderKind } from '@/pages/newpages/orders/ordersOverviewData';

export const ORDER_TYPE_PATHS: Record<OverviewOrderKind, string> = {
  purchase: '/orders/purchase',
  transfer: '/orders/transfer',
  expense: '/orders/expense',
};

export const ORDER_TYPE_LABELS: Record<OverviewOrderKind, string> = {
  purchase: 'Purchase',
  transfer: 'Transfer',
  expense: 'Expense',
};

export { PASTEL_CHART_FILLS, CHART_TOOLTIP_PROPS } from '@/components/newcomponents/customui/orders/overview/ordersOverviewConstants';

export function formatDashboardCurrency(value: number): string {
  if (value <= 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
