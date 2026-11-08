import { cn } from '@/lib/utils';

/** Match WorkOrdersDateFilterControls segment track (h-9). */
export const productionRunsToolbarSegmentTrackClass =
  'inline-flex h-9 shrink-0 items-center gap-0.5 rounded-lg bg-muted/80 p-1 ring-1 ring-border/60';

export function productionRunsToolbarSegmentPillClass(active: boolean) {
  return cn(
    'h-7 rounded-md px-2.5 text-xs font-semibold transition-colors',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  );
}
