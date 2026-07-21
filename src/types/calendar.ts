export type CalendarCategory =
  | 'work_orders'
  | 'maintenance'
  | 'purchase'
  | 'expense'
  | 'sales'
  | 'invoices'
  | 'production'
  | 'projects';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarEvent {
  id: string;
  category: CalendarCategory;
  source_type: string;
  record_id: number;
  date: string;
  date_label: string;
  title: string;
  subtitle?: string | null;
  link: string;
  meta: Record<string, unknown>;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  total: number;
}

export interface CalendarEventsParams {
  start: string;
  end: string;
  types?: CalendarCategory[];
}

export const ALL_CALENDAR_CATEGORIES: CalendarCategory[] = [
  'work_orders',
  'maintenance',
  'purchase',
  'expense',
  'sales',
  'invoices',
  'production',
  'projects',
];

export const CALENDAR_CATEGORY_LABELS: Record<CalendarCategory, string> = {
  work_orders: 'Work Orders',
  maintenance: 'Maintenance',
  purchase: 'Purchase',
  expense: 'Expense',
  sales: 'Sales',
  invoices: 'Invoices',
  production: 'Production',
  projects: 'Projects',
};
