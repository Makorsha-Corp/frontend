import { cn } from '@/lib/utils';
import type { WeekDayCell } from '@/pages/newpages/orders/workOrderSheetData';

type WeekDayBandState = Pick<WeekDayCell, 'isSelected'>;

/** Rows view: one day section in the vertical week list. */
export function weekDayBandSectionClass(day: WeekDayBandState): string {
  return cn(
    'border-b border-border last:border-b-0',
    day.isSelected && 'border-l-2 border-l-brand-primary bg-brand-primary/[0.08]',
  );
}

/** Rows view: clickable day header row inside the section. */
export function weekDayBandHeaderClass(day: WeekDayBandState): string {
  return cn(
    'flex w-full items-center gap-2 py-2 text-left transition-colors hover:bg-muted/30',
    day.isSelected ? 'pl-[10px] pr-3' : 'px-3',
  );
}

/** Rows view: inset surface for order table or empty Add target. */
export function weekDayContentInsetClass(): string {
  return 'mx-2 mb-2 overflow-hidden rounded-md border border-border/60 bg-background';
}

/** Compact empty-day Add control inside content inset (rows = inline; columns = stacked). */
export function weekDayEmptyAddButtonClass(variant: 'rows' | 'columns' = 'rows'): string {
  return cn(
    'flex w-full items-center justify-center gap-1 text-muted-foreground transition-colors hover:bg-muted/20',
    variant === 'rows'
      ? 'flex-row px-2 py-1.5 text-[11px]'
      : 'flex-col px-1.5 py-2 text-[10px]',
  );
}

/** Columns view: empty-day inset matches rows content surface. */
export function weekDayColumnEmptyInsetClass(): string {
  return 'overflow-hidden rounded-md border border-border/60 bg-background';
}

/** Columns view: vertical day column shell. */
export function weekDayColumnShellClass(day: WeekDayBandState): string {
  return cn(
    'flex min-h-0 min-w-0 flex-col overflow-hidden',
    day.isSelected && 'bg-brand-primary/[0.08]',
  );
}

/** Columns view: day header at top of column. */
export function weekDayColumnHeaderClass(day: WeekDayBandState): string {
  return cn(
    'flex shrink-0 flex-col gap-1 border-b border-border px-2 py-2 text-left transition-colors hover:bg-muted/30',
    day.isSelected && 'border-t-2 border-t-brand-primary',
  );
}

export function weekDayCountLabel(day: Pick<WeekDayCell, 'entryCount'>): string {
  return day.entryCount > 0
    ? `${day.entryCount} ${day.entryCount === 1 ? 'order' : 'orders'}`
    : 'No orders';
}
