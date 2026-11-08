import React, { useMemo, useState } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';

import AppShellHeader, {
  AppShellHeaderIconAction,
  AppShellHeaderInlineSearchField,
  AppShellHeaderInlineSearchToggle,
  AppShellHeaderRow,
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AppShellHeaderCompactListProps {
  icon: LucideIcon;
  title: string;
  /** Replaces page title (e.g. emphasis tab bar in header). */
  headerNav?: React.ReactNode;
  /** Mobile header nav; defaults to `headerNav`. */
  headerNavMobile?: React.ReactNode;
  /** Extra left-side controls after title on desktop (factory picker, tabs, etc.). */
  leftExtras?: React.ReactNode;
  /** Mobile-only controls in the title row (filters, selects) before search/add. */
  mobileActions?: React.ReactNode;
  /** Desktop-only extras in the actions cluster (filters, selects). */
  desktopActions?: React.ReactNode;
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  addAriaLabel?: string;
  sticky?: boolean;
  className?: string;
}

type ControlledDropdownExtras = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * `leftExtras` is rendered twice (mobile row + desktop row). A shared controlled
 * `open` on DropdownMenu would mount two portals — clone and pin closed on the hidden row.
 */
function leftExtrasForPlacement(
  node: React.ReactNode,
  placement: 'mobile' | 'desktop',
  isLgScreen: boolean,
): React.ReactNode {
  if (node == null) return node;
  if (React.isValidElement(node) && node.type === React.Fragment) {
    const fragmentProps = node.props as { children?: React.ReactNode };
    return (
      <>
        {React.Children.map(fragmentProps.children, (child) =>
          leftExtrasForPlacement(child, placement, isLgScreen),
        )}
      </>
    );
  }
  if (!React.isValidElement(node)) return node;
  const props = node.props as ControlledDropdownExtras;
  if (props.open === undefined) return node;

  const active = placement === 'desktop' ? isLgScreen : !isLgScreen;
  if (active) return React.cloneElement(node);

  return React.cloneElement(node, {
    open: false,
    onOpenChange: undefined,
  } as ControlledDropdownExtras);
}

/**
 * Compact mobile list header: icon + title + optional inline search + icon Add.
 * Desktop row keeps full search input and text Add button when provided.
 */
export function AppShellHeaderCompactList({
  icon: Icon,
  title,
  headerNav,
  headerNavMobile,
  leftExtras,
  mobileActions,
  desktopActions,
  searchInput,
  onSearchInputChange,
  searchPlaceholder = 'Search...',
  searchAriaLabel,
  onAdd,
  addButtonLabel,
  addAriaLabel,
  sticky = false,
  className,
}: AppShellHeaderCompactListProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isLgScreen = useIsLgScreen();
  const hasSearch = searchInput != null && onSearchInputChange != null;
  const hasAdd = onAdd != null && addAriaLabel != null;
  const mobileNav = headerNavMobile ?? headerNav;
  const mobileLeftExtras = useMemo(
    () => (leftExtras ? leftExtrasForPlacement(leftExtras, 'mobile', isLgScreen) : null),
    [leftExtras, isLgScreen],
  );
  const desktopLeftExtras = useMemo(
    () => (leftExtras ? leftExtrasForPlacement(leftExtras, 'desktop', isLgScreen) : null),
    [leftExtras, isLgScreen],
  );

  return (
    <AppShellHeader sticky={sticky} className={className}>
      {/* Mobile */}
      <div className="lg:hidden">
        <AppShellHeaderRow className="flex-nowrap gap-1.5">
          <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1 flex-nowrap gap-2')}>
            <div className={appShellHeaderIconTileClass}>
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
            {mobileNav ? (
              <div className="min-w-0 shrink">{mobileNav}</div>
            ) : (
              <h1 className={cn(appShellHeaderTitleClass, 'text-base sm:text-lg')}>{title}</h1>
            )}
          </div>
          {mobileActions ? (
            <div className="flex shrink-0 items-center gap-1.5">{mobileActions}</div>
          ) : null}
          <div className="flex shrink-0 items-center gap-1.5">
            {hasSearch ? (
              <AppShellHeaderInlineSearchToggle
                open={mobileSearchOpen}
                onOpenChange={setMobileSearchOpen}
                searchAriaLabel={searchAriaLabel ?? `Search ${title.toLowerCase()}`}
              />
            ) : null}
            {hasAdd ? (
              <AppShellHeaderIconAction icon={Plus} onClick={onAdd} ariaLabel={addAriaLabel} />
            ) : null}
          </div>
        </AppShellHeaderRow>
        {mobileLeftExtras ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">{mobileLeftExtras}</div>
        ) : null}
        {hasSearch ? (
          <AppShellHeaderInlineSearchField
            value={searchInput}
            onChange={onSearchInputChange}
            placeholder={searchPlaceholder}
            open={mobileSearchOpen}
            onOpenChange={setMobileSearchOpen}
          />
        ) : null}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <AppShellHeaderRow>
          <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
            <div className={appShellHeaderIconTileClass}>
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
            {headerNav ?? <h1 className={appShellHeaderTitleClass}>{title}</h1>}
            {desktopLeftExtras ? (
              <>
                <div
                  className={cn(
                    appShellHeaderScopeSeparatorClass,
                    headerNav && 'ml-3 lg:ml-6',
                  )}
                  aria-hidden
                />
                {desktopLeftExtras}
              </>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            {desktopActions}
            {hasAdd && addButtonLabel ? (
              <Button
                type="button"
                onClick={onAdd}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                {addButtonLabel}
              </Button>
            ) : null}
          </div>
        </AppShellHeaderRow>
      </div>
    </AppShellHeader>
  );
}
