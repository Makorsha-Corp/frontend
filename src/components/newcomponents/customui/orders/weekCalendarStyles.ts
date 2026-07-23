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

/** Rows view: day header row — muted band (was content inset look). */
export function weekDayBandHeaderClass(day: WeekDayBandState): string {
  return cn(
    'flex w-full items-center gap-2 border-b border-border/60 bg-muted/45 py-2',
    day.isSelected ? 'bg-muted/65 pl-[10px] pr-3' : 'px-3',
  );
}

/** Rows view: clickable day label area inside the header. */
export function weekDayBandHeaderSelectClass(): string {
  return cn(
    'flex min-w-0 flex-1 items-center justify-start gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-background/40',
  );
}

/** Rows view: Add work on muted header — light card pill. */
export function weekDayHeaderAddButtonClass(): string {
  return cn(
    'inline-flex shrink-0 items-center gap-1 rounded-md border border-border/50 bg-card px-2 py-1 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:bg-card/90',
  );
}

/** Rows view: order count on muted header. */
export function weekDayHeaderCountClass(): string {
  return 'shrink-0 text-xs font-medium text-muted-foreground';
}

/** Rows view: content area — open/light on card (was header look). */
export function weekDayContentInsetClass(): string {
  return 'mx-2 mb-2 overflow-hidden rounded-md bg-card';
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
