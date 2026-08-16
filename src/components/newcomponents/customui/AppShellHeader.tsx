import React, { useEffect, useRef } from 'react';
import { ChevronLeft, Search, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
export const appShellHeaderLeftGroupClass =
  'flex min-w-0 flex-wrap items-center gap-2 lg:gap-3';
export const appShellHeaderScopeSeparatorClass = 'hidden h-6 w-px shrink-0 bg-border sm:block';
export const appShellHeaderIconTileClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35';
export const appShellHeaderTitleClass =
  'truncate text-lg font-semibold tracking-tight text-card-foreground dark:text-foreground lg:text-2xl';
export const appShellHeaderRowClass =
  'flex items-center justify-between gap-2 lg:flex-wrap lg:gap-4';

/**
 * Lowered breadcrumb-style selector baseline used in shell headers.
 */
export const appShellHeaderLoweredSelectorClass =
  '!h-7 border-none bg-transparent px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground shadow-none hover:bg-muted/60 [&>svg]:hidden';

export function AppShellHeaderRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(appShellHeaderRowClass, className)}>{children}</div>;
}

export interface AppShellHeaderMobileDetailBarProps {
  label: string;
  onBack: () => void;
  backAriaLabel?: string;
  className?: string;
}

/** Mobile detail strip: back chevron + entity label only. */
export function AppShellHeaderMobileDetailBar({
  label,
  onBack,
  backAriaLabel = 'Go back',
  className,
}: AppShellHeaderMobileDetailBarProps) {
  return (
    <AppShellHeader className={className}>
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(appShellHeaderControlClass, 'h-9 w-9 shrink-0')}
          onClick={onBack}
          aria-label={backAriaLabel}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-card-foreground dark:text-foreground">
          {label}
        </h1>
      </div>
    </AppShellHeader>
  );
}

/** Icon toggle for inline mobile search (place in header row). */
export function AppShellHeaderInlineSearchToggle({
  open,
  onOpenChange,
  className,
  searchAriaLabel = 'Search',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  searchAriaLabel?: string;
}) {
  return (
    <Button
      type="button"
      variant={open ? 'secondary' : 'outline'}
      size="icon"
      className={cn(appShellHeaderControlClass, 'h-9 w-9 shrink-0 lg:hidden', className)}
      onClick={() => onOpenChange(!open)}
      aria-label={searchAriaLabel}
      aria-expanded={open}
    >
      <Search className="h-4 w-4" />
    </Button>
  );
}

/** Full-width expanded search row (below header row on mobile). */
export function AppShellHeaderInlineSearchField({
  value,
  onChange,
  placeholder,
  open,
  onOpenChange,
  inputClassName,
  autoFocus = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && autoFocus) {
      inputRef.current?.focus();
    }
  }, [open, autoFocus]);

  if (!open) return null;

  return (
    <div className="relative mt-2 w-full lg:hidden">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onOpenChange(false);
          }
        }}
        className={cn('pl-9', appShellHeaderControlClass, 'w-full bg-background', inputClassName)}
      />
    </div>
  );
}

export interface AppShellHeaderInlineSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
  inputClassName?: string;
  searchAriaLabel?: string;
}

/** Icon toggle + optional inline expanded search row (mobile list headers). */
export function AppShellHeaderInlineSearch({
  value,
  onChange,
  placeholder,
  open,
  onOpenChange,
  className,
  inputClassName,
  searchAriaLabel = 'Search',
}: AppShellHeaderInlineSearchProps) {
  return (
    <>
      <AppShellHeaderInlineSearchToggle
        open={open}
        onOpenChange={onOpenChange}
        className={className}
        searchAriaLabel={searchAriaLabel}
      />
      <AppShellHeaderInlineSearchField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        open={open}
        onOpenChange={onOpenChange}
        inputClassName={inputClassName}
      />
    </>
  );
}

export interface AppShellHeaderIconActionProps {
  icon: LucideIcon;
  onClick: () => void;
  ariaLabel: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

export function AppShellHeaderIconAction({
  icon: Icon,
  onClick,
  ariaLabel,
  variant = 'default',
  className,
}: AppShellHeaderIconActionProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn(
        appShellHeaderControlClass,
        'h-9 w-9 shrink-0 lg:hidden',
        variant === 'default' && 'bg-brand-primary hover:bg-brand-primary-hover',
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

/**
 * Standard top header wrapper for app-shell pages.
 *
 * **Mobile (max-lg):** `px-4 py-3` — use `AppShellHeaderMobileDetailBar`,
 * `AppShellHeaderInlineSearch`, and `AppShellHeaderIconAction` for list/detail modes.
 *
 * **Desktop (lg+):** `px-8 py-5` — existing hub header layouts unchanged.
 */
const AppShellHeader: React.FC<AppShellHeaderProps> = ({ children, sticky = false, className }) => {
  return (
    <div
      className={cn(
        'z-10 flex-shrink-0 border-b border-border bg-card px-4 py-3 shadow-sm dark:bg-[hsl(var(--nav-background))] lg:px-8 lg:py-5',
        sticky && 'sticky top-0',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default AppShellHeader;
