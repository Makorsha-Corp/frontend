/** Shared layout + typography for Products / Storage catalog cards. */

export const catalogSectionCardClass =
  'flex min-h-0 flex-col overflow-hidden border-border bg-card shadow-sm';

export const catalogSectionToolbarClass =
  'flex flex-wrap items-center justify-between gap-3 px-4 py-3';

export const catalogSectionIconTileClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/25';

export const catalogSectionTitleClass = 'text-sm font-semibold text-card-foreground';

export const catalogSectionSummaryClass = 'text-xs tabular-nums text-muted-foreground';

export const catalogSectionMetaClass =
  'flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground';

export const catalogTableClass = 'table-fixed w-full';

export const catalogTableHeadRowClass =
  'border-b border-border bg-brand-primary/5 dark:bg-brand-primary/10';

export const catalogTableHeadClass =
  'py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground';

export const catalogTableRowClass =
  'border-b border-border last:border-0 hover:bg-brand-primary/5';

/** Fixed 280px — use with table-fixed; max-w alone is ignored in auto table layout. */
export const catalogItemHeadClass = `${catalogTableHeadClass} w-[280px]`;

export const catalogItemCellClass =
  'py-3 font-medium text-card-foreground w-[280px] max-w-[280px]';

export const catalogItemTextClass = 'block truncate';

export const catalogNumericHeadClass = `${catalogTableHeadClass} w-[88px]`;

export const catalogIncomingHeadClass = `${catalogTableHeadClass} w-[120px]`;

export const catalogTypeHeadClass = `${catalogTableHeadClass} w-[100px]`;

export const catalogNumericCellClass = 'py-3 tabular-nums text-sm text-card-foreground';

export const catalogMoneyHeadClass = `${catalogTableHeadClass} w-[108px]`;

export const catalogMoneyCellClass = 'py-3 tabular-nums text-sm text-card-foreground';

export const catalogFactoryHeadClass = `${catalogTableHeadClass} w-[140px]`;

export const catalogFactoryCellClass = 'py-3 text-sm text-muted-foreground';

export const catalogActionsHeadClass = `${catalogTableHeadClass} w-[120px] text-right`;

export const catalogActionsCellClass = 'py-3 text-right';

export const CATALOG_PAGE_SIZE = 50;
