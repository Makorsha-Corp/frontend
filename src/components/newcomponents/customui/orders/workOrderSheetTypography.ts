/** Shared typography + layout tokens for WorkOrderSheetTable (week bands + all-dates). */

export const SHEET_TABLE = 'text-sm table-fixed';
export const SHEET_PRIMARY = 'text-sm font-medium text-card-foreground';
export const SHEET_META = 'text-xs text-muted-foreground';
export const SHEET_BADGE = 'px-1.5 py-0 text-[11px] font-medium';
/** Shared date label box — plain dates and attention badges use the same footprint. */
export const SHEET_DATE_LABEL =
  'inline-flex min-w-[3.25rem] items-center justify-center rounded-md border px-1.5 py-0.5 text-sm font-medium leading-none';
export const SHEET_CHIP = 'text-[11px] text-muted-foreground';
export const SHEET_CELL_PAD = 'px-3 py-2.5';
export const SHEET_DATE_CELL_PAD = 'px-1.5 py-2.5';
export const SHEET_HEADER = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';
export const SHEET_HEADER_CELL_PAD = 'px-3 py-2';
export const SHEET_DATE_HEADER_CELL_PAD = 'px-1.5 py-2';

/**
 * Explicit column width ratios (percent of table, sums to 100).
 * Derived from prior rem-fixed side cols + balanced flex for Machine / Parts.
 */
export const SHEET_COLUMN_WEIGHTS = {
  machine: 25,
  works: 11,
  parts: 28,
  workers: 13,
  approvers: 13,
  actions: 10,
} as const;

export const SHEET_COLUMN_WEIGHTS_WITH_START = {
  start: 6,
  machine: 25,
  works: 9,
  parts: 28,
  workers: 11,
  approvers: 11,
  actions: 10,
} as const;

export type SheetColumnWidthSet = {
  start?: string;
  machine: string;
  works: string;
  parts: string;
  workers: string;
  approvers: string;
  actions: string;
};

/** Tailwind width classes — literals required for JIT. */
export function sheetColumnWidths(showStartDateColumn: boolean): SheetColumnWidthSet {
  if (showStartDateColumn) {
    return {
      start: 'w-[6%]',
      machine: 'w-[25%]',
      works: 'w-[9%]',
      parts: 'w-[28%]',
      workers: 'w-[11%]',
      approvers: 'w-[11%]',
      actions: 'w-[10%]',
    };
  }

  return {
    machine: 'w-[25%]',
    works: 'w-[11%]',
    parts: 'w-[28%]',
    workers: 'w-[13%]',
    approvers: 'w-[13%]',
    actions: 'w-[10%]',
  };
}

/** @deprecated Use sheetColumnWidths() — kept as aliases for gradual migration. */
export const SHEET_DATE_COL = 'w-[6%]';
export const SHEET_MACHINE_COL = 'w-[25%]';
export const SHEET_WORKS_COL = 'w-[11%]';
export const SHEET_PARTS_COL = 'w-[28%]';
export const SHEET_WORKERS_COL = 'w-[13%]';
export const SHEET_APPROVERS_COL = 'w-[13%]';
export const SHEET_ACTIONS_COL = 'w-[10%]';

export const SHEET_TABLE_MIN_W = 'min-w-[680px]';
export const SHEET_ACTION_BTN = 'h-7 w-full text-xs';

/** Sheet row detail popovers — card surface; darker nav chrome in dark mode. */
export const SHEET_DETAIL_POPOVER =
  'border-border/80 bg-card text-card-foreground shadow-lg ring-1 ring-border/50 dark:bg-[hsl(var(--nav-background))]';

export const SHEET_DETAIL_POPOVER_ITEM =
  'rounded-md border border-border/50 bg-muted/35 px-2.5 py-2 dark:bg-muted/15';
