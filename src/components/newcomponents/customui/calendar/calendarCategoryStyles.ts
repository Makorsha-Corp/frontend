import type { CalendarCategory } from '@/types/calendar';
import { CALENDAR_CATEGORY_LABELS } from '@/types/calendar';

export interface CalendarCategoryStyle {
  label: string;
  chip: string;
  chipActive: string;
  event: string;
  dot: string;
  /** Left stripe on month/week/day event chips */
  stripe: string;
}

export const CALENDAR_CATEGORY_STYLES: Record<CalendarCategory, CalendarCategoryStyle> = {
  work_orders: {
    label: CALENDAR_CATEGORY_LABELS.work_orders,
    chip: 'border-transparent bg-sky-500/20 text-sky-800/80 dark:bg-sky-500/25 dark:text-sky-200/80',
    chipActive: 'border-transparent bg-sky-500 text-white shadow-sm dark:bg-sky-600 dark:text-white',
    event: 'border-sky-500/25 bg-sky-500/8 text-sky-950 dark:text-sky-50',
    dot: 'bg-sky-500',
    stripe: 'border-l-sky-500',
  },
  maintenance: {
    label: CALENDAR_CATEGORY_LABELS.maintenance,
    chip: 'border-transparent bg-amber-500/20 text-amber-900/80 dark:bg-amber-500/25 dark:text-amber-100/80',
    chipActive: 'border-transparent bg-amber-500 text-amber-950 shadow-sm dark:bg-amber-500 dark:text-amber-950',
    event: 'border-amber-500/25 bg-amber-500/8 text-amber-950 dark:text-amber-50',
    dot: 'bg-amber-500',
    stripe: 'border-l-amber-500',
  },
  purchase: {
    label: CALENDAR_CATEGORY_LABELS.purchase,
    chip: 'border-transparent bg-violet-500/20 text-violet-800/80 dark:bg-violet-500/25 dark:text-violet-200/80',
    chipActive: 'border-transparent bg-violet-500 text-white shadow-sm dark:bg-violet-600 dark:text-white',
    event: 'border-violet-500/25 bg-violet-500/8 text-violet-950 dark:text-violet-50',
    dot: 'bg-violet-500',
    stripe: 'border-l-violet-500',
  },
  expense: {
    label: CALENDAR_CATEGORY_LABELS.expense,
    chip: 'border-transparent bg-rose-500/20 text-rose-800/80 dark:bg-rose-500/25 dark:text-rose-200/80',
    chipActive: 'border-transparent bg-rose-500 text-white shadow-sm dark:bg-rose-600 dark:text-white',
    event: 'border-rose-500/25 bg-rose-500/8 text-rose-950 dark:text-rose-50',
    dot: 'bg-rose-500',
    stripe: 'border-l-rose-500',
  },
  sales: {
    label: CALENDAR_CATEGORY_LABELS.sales,
    chip: 'border-transparent bg-emerald-500/20 text-emerald-900/80 dark:bg-emerald-500/25 dark:text-emerald-100/80',
    chipActive: 'border-transparent bg-emerald-500 text-white shadow-sm dark:bg-emerald-600 dark:text-white',
    event: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-950 dark:text-emerald-50',
    dot: 'bg-emerald-500',
    stripe: 'border-l-emerald-500',
  },
  invoices: {
    label: CALENDAR_CATEGORY_LABELS.invoices,
    chip: 'border-transparent bg-orange-500/20 text-orange-900/80 dark:bg-orange-500/25 dark:text-orange-100/80',
    chipActive: 'border-transparent bg-orange-500 text-white shadow-sm dark:bg-orange-600 dark:text-white',
    event: 'border-orange-500/25 bg-orange-500/8 text-orange-950 dark:text-orange-50',
    dot: 'bg-orange-500',
    stripe: 'border-l-orange-500',
  },
  production: {
    label: CALENDAR_CATEGORY_LABELS.production,
    chip: 'border-transparent bg-cyan-500/20 text-cyan-900/80 dark:bg-cyan-500/25 dark:text-cyan-100/80',
    chipActive: 'border-transparent bg-cyan-500 text-white shadow-sm dark:bg-cyan-600 dark:text-white',
    event: 'border-cyan-500/25 bg-cyan-500/8 text-cyan-950 dark:text-cyan-50',
    dot: 'bg-cyan-500',
    stripe: 'border-l-cyan-500',
  },
  projects: {
    label: CALENDAR_CATEGORY_LABELS.projects,
    chip: 'border-transparent bg-indigo-500/20 text-indigo-900/80 dark:bg-indigo-500/25 dark:text-indigo-100/80',
    chipActive: 'border-transparent bg-indigo-500 text-white shadow-sm dark:bg-indigo-600 dark:text-white',
    event: 'border-indigo-500/25 bg-indigo-500/8 text-indigo-950 dark:text-indigo-50',
    dot: 'bg-indigo-500',
    stripe: 'border-l-indigo-500',
  },
};

export function getCategoryStyle(category: CalendarCategory): CalendarCategoryStyle {
  return CALENDAR_CATEGORY_STYLES[category];
}
