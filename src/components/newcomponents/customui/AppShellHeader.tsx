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

/**
 * Lowered breadcrumb-style selector baseline used in shell headers.
 */
export const appShellHeaderLoweredSelectorClass =
  '!h-7 border-none bg-transparent px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground shadow-none hover:bg-muted/60 [&>svg]:hidden';

/**
 * Standard top header wrapper for app-shell pages (Machines style baseline).
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
