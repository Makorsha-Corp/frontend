import type { CalendarCategory } from '@/types/calendar';
import { CALENDAR_CATEGORY_LABELS } from '@/types/calendar';

export interface CalendarCategoryStyle {
  label: string;
  chip: string;
  chipActive: string;
  event: string;
  dot: string;
}

export const CALENDAR_CATEGORY_STYLES: Record<CalendarCategory, CalendarCategoryStyle> = {
  work_orders: {
    label: CALENDAR_CATEGORY_LABELS.work_orders,
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    chipActive: 'border-sky-500 bg-sky-500/20 text-sky-800 dark:text-sky-200',
    event: 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    dot: 'bg-sky-500',
  },
  maintenance: {
    label: CALENDAR_CATEGORY_LABELS.maintenance,
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    chipActive: 'border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-200',
    event: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
    dot: 'bg-amber-500',
  },
  purchase: {
    label: CALENDAR_CATEGORY_LABELS.purchase,
    chip: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    chipActive: 'border-violet-500 bg-violet-500/20 text-violet-800 dark:text-violet-200',
    event: 'border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-100',
    dot: 'bg-violet-500',
  },
  expense: {
    label: CALENDAR_CATEGORY_LABELS.expense,
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    chipActive: 'border-rose-500 bg-rose-500/20 text-rose-800 dark:text-rose-200',
    event: 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100',
    dot: 'bg-rose-500',
  },
  sales: {
    label: CALENDAR_CATEGORY_LABELS.sales,
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    chipActive: 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200',
    event: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
    dot: 'bg-emerald-500',
  },
  invoices: {
    label: CALENDAR_CATEGORY_LABELS.invoices,
    chip: 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    chipActive: 'border-orange-500 bg-orange-500/20 text-orange-800 dark:text-orange-200',
    event: 'border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-100',
    dot: 'bg-orange-500',
  },
  production: {
    label: CALENDAR_CATEGORY_LABELS.production,
    chip: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    chipActive: 'border-cyan-500 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200',
    event: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100',
    dot: 'bg-cyan-500',
  },
  projects: {
    label: CALENDAR_CATEGORY_LABELS.projects,
    chip: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    chipActive: 'border-indigo-500 bg-indigo-500/20 text-indigo-800 dark:text-indigo-200',
    event: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100',
    dot: 'bg-indigo-500',
  },
};

export function getCategoryStyle(category: CalendarCategory): CalendarCategoryStyle {
  return CALENDAR_CATEGORY_STYLES[category];
}
