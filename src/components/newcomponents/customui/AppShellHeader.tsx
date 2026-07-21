import React from 'react';
import { cn } from '@/lib/utils';

interface AppShellHeaderProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

/**
 * Shared control height baseline for app-shell headers.
 * Apply to header Inputs/Buttons/SelectTriggers to keep rows consistent.
 */
export const appShellHeaderControlClass = '!h-9';
export const appShellHeaderBoxedControlClass = `${appShellHeaderControlClass} border-border bg-background`;
export const appShellHeaderLeftGroupClass = 'flex min-w-0 flex-wrap items-center gap-3';
export const appShellHeaderScopeSeparatorClass = 'hidden h-6 w-px shrink-0 bg-border sm:block';
export const appShellHeaderIconTileClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35';
export const appShellHeaderTitleClass =
  'truncate text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground';

/**
 * Lowered breadcrumb-style selector baseline used in shell headers.
 */
export const appShellHeaderLoweredSelectorClass =
  '!h-7 border-none bg-transparent px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground shadow-none hover:bg-muted/60 [&>svg]:hidden';

/**
 * Standard top header wrapper for app-shell pages.
 *
 * **Default layout (factory-scoped hubs, 2026-07-18):**
 * - Wrapper: `px-8 py-5`, border-b, optional `sticky`
 * - Row: `flex flex-wrap items-center justify-between gap-4`
 * - **Left:** primary nav (e.g. hub tabs) → vertical separator → scope breadcrumb
 *   (`MachinesInlineLocationFilters` `variant="toolbar"`) — factory then section
 * - **Left alignment:** use `appShellHeaderLeftGroupClass` (`items-center`) for title +
 *   scope on one row — never `items-end` (title ~32px vs toolbar `!h-9` misaligns)
 * - **Right:** primary page action(s) only (`!h-9` via `appShellHeaderControlClass`)
 * - No duplicate page title/icon when tabs or context already name the view
 *
 * Reference: `MachinesPage`, `WorkOrdersPageHeader`.
 */
const AppShellHeader: React.FC<AppShellHeaderProps> = ({ children, sticky = false, className }) => {
  return (
    <div
      className={cn(
        'flex-shrink-0 bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 z-10 shadow-sm',
        sticky && 'sticky top-0',
        className
      )}
    >
      {children}
    </div>
  );
};

export default AppShellHeader;
