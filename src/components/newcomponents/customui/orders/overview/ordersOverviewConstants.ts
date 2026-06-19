import {
  ShoppingCart,
  ArrowLeftRight,
  CreditCard,
  Receipt,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { OverviewOrderKind } from '@/pages/newpages/orders/ordersOverviewData';

export const ORDER_TYPE_HUB = [
  { id: 'purchase' as const, label: 'Purchase', path: '/orders/purchase', icon: ShoppingCart },
  { id: 'transfer' as const, label: 'Transfer', path: '/orders/transfer', icon: ArrowLeftRight },
  { id: 'expense' as const, label: 'Expense', path: '/orders/expense', icon: CreditCard },
  { id: 'sales' as const, label: 'Sales', path: '/orders/sales', icon: Receipt },
  { id: 'work' as const, label: 'Work', path: '/orders/work', icon: Wrench },
] satisfies Array<{
  id: OverviewOrderKind;
  label: string;
  path: string;
  icon: LucideIcon;
}>;

export const PASTEL_CHART_FILLS = [
  'var(--pastel-1, hsla(257, 43%, 70%, 1))',
  'var(--pastel-2, hsla(192, 95%, 76%, 1))',
  'var(--pastel-3, hsla(83, 46%, 75%, 1))',
  'var(--pastel-4, hsla(57, 75%, 84%, 1))',
  'var(--pastel-5, hsla(15, 77%, 90%, 1))',
] as const;

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
