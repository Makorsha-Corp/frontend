import { cn } from '@/lib/utils';

export type CalendarDayChrome = {
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth?: boolean;
};

/** Page body under AppShellHeader — cream canvas, grid sits in card shell. */
export const calendarPageBodyClass =
  'flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:gap-4 md:p-4';

export const calendarGridViewportClass = 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden';

export const calendarGridShellClass =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm';

export function calendarMonthDayCellClass(day: CalendarDayChrome): string {
  return cn(
    'relative flex min-h-0 cursor-pointer flex-col overflow-hidden p-1.5 text-left transition-colors',
    'hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
    !day.isCurrentMonth && 'bg-muted/15',
    day.isSelected &&
      'border-l-2 border-l-brand-primary bg-brand-primary/[0.07] shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35)]',
    !day.isSelected && day.isCurrentMonth && 'bg-background',
  );
}

export function calendarWeekDayColumnClass(day: CalendarDayChrome): string {
  return cn(
    'flex min-h-0 min-w-0 flex-col overflow-hidden',
    day.isSelected && 'bg-brand-primary/[0.08]',
  );
}

export function calendarWeekDayHeaderClass(day: CalendarDayChrome): string {
  return cn(
    'flex shrink-0 flex-col gap-1 border-b border-border px-2 py-2 text-left transition-colors hover:bg-muted/30',
    day.isSelected && 'border-t-2 border-t-brand-primary',
  );
}

export function calendarWeekEventCountLabel(eventCount: number): string {
  if (eventCount > 0) {
    return `${eventCount} ${eventCount === 1 ? 'event' : 'events'}`;
  }
  return 'No events';
}
