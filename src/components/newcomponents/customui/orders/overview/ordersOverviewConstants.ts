import {
  ShoppingCart,
  ArrowLeftRight,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';
import type { OverviewOrderKind } from '@/pages/newpages/orders/ordersOverviewData';

/** Procurement hub tiles on /orders overview (purchase, transfer, expense only). */
export const ORDER_TYPE_HUB = [
  { id: 'purchase' as const, label: 'Purchase', path: '/orders/purchase', icon: ShoppingCart },
  { id: 'transfer' as const, label: 'Transfer', path: '/orders/transfer', icon: ArrowLeftRight },
  { id: 'expense' as const, label: 'Expense', path: '/orders/expense', icon: CreditCard },
] satisfies Array<{
  id: OverviewOrderKind;
  label: string;
  path: string;
  icon: LucideIcon;
}>;

export const PASTEL_CHART_FILLS = [
  'var(--chart-pastel-1)',
  'var(--chart-pastel-2)',
  'var(--chart-pastel-3)',
  'var(--chart-pastel-4)',
  'var(--chart-pastel-5)',
] as const;

export const CHART_TOOLTIP_PROPS = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    borderColor: 'hsl(var(--border))',
    borderRadius: '0.5rem',
    fontSize: '12px',
    color: 'hsl(var(--card-foreground))',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))' },
  itemStyle: { color: 'hsl(var(--card-foreground))' },
} as const;

export function formatOverviewCurrency(value: number): string {
  if (value <= 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOverviewNumber(value: number, maxFraction = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFraction,
  }).format(value);
}
