import type { ItemRole } from '@/types/production';

export const ITEM_ROLES: ItemRole[] = ['input', 'output', 'waste', 'byproduct'];

export const BATCH_ROLE_BADGE: Record<ItemRole, string> = {
  input: 'border-transparent bg-blue-500/15 text-blue-800 dark:text-blue-200',
  output: 'border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  waste: 'border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-100',
  byproduct: 'border-transparent bg-violet-500/15 text-violet-800 dark:text-violet-200',
};

export const BATCH_ROLE_SECTION_TITLE: Record<ItemRole, string> = {
  input: 'Inputs',
  output: 'Products',
  waste: 'Waste',
  byproduct: 'Byproducts',
};

export const BATCH_ROLE_BADGE_LABEL: Record<ItemRole, string> = {
  input: 'input',
  output: 'products',
  waste: 'waste',
  byproduct: 'byproduct',
};

export const productionBatchRowSelectedClass =
  'border-l-2 border-brand-primary bg-brand-primary/[0.08] dark:bg-brand-primary/15';

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatOptionalPercent(value: unknown, digits = 1): string | null {
  const n = toFiniteNumber(value);
  if (n == null) return null;
  return `${n.toFixed(digits)}%`;
}
