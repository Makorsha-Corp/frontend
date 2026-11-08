import React, { useState } from 'react';
import { Plus, Search, X, type LucideIcon } from 'lucide-react';

import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';
import AppShellHeader, {
  AppShellHeaderIconAction,
  AppShellHeaderInlineSearchField,
  AppShellHeaderInlineSearchToggle,
  AppShellHeaderMobileDetailBar,
  AppShellHeaderRow,
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';
import HelpGuidePageReplayButton from '@/components/newcomponents/customui/helpGuides/HelpGuidePageReplayButton';
import { HELP_GUIDE_TOUR_ID } from '@/features/helpGuides/helpGuideTourIds';

export type OrderHubHelpGuideKind = 'purchase' | 'transfer' | 'expense';

const ORDER_HUB_HELP_TOURS: Record<OrderHubHelpGuideKind, (typeof HELP_GUIDE_TOUR_ID)[keyof typeof HELP_GUIDE_TOUR_ID]> = {
  purchase: HELP_GUIDE_TOUR_ID.purchaseOrders,
  transfer: HELP_GUIDE_TOUR_ID.transferOrders,
  expense: HELP_GUIDE_TOUR_ID.expenseOrders,
};

export interface OrderHubShellHeaderProps {
  icon: LucideIcon;
  title: string;
  selectedOrderLabel: string | null;
  onClearSelection: () => void;
  backAriaLabel: string;
  closeSelectionAriaLabel: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  onAdd: () => void;
  addButtonLabel: string;
  addAriaLabel: string;
  helpGuideKind?: OrderHubHelpGuideKind;
  /** Before Filters (e.g. Templates) — desktop + mobile title row. */
  headerToolbarLeading?: React.ReactNode;
  /** Filters, selects, etc. before search (desktop + mobile title row). */
  headerToolbarExtras?: React.ReactNode;
}

/**
 * Orders hub header: mobile detail bar, compact mobile list, unchanged desktop row.
 */
const OrderHubShellHeader: React.FC<OrderHubShellHeaderProps> = ({
  icon: Icon,
  title,
  selectedOrderLabel,
  onClearSelection,
  backAriaLabel,
  closeSelectionAriaLabel,
  searchInput,
  onSearchInputChange,
  searchPlaceholder,
  searchAriaLabel,
  onAdd,
  addButtonLabel,
  addAriaLabel,
  helpGuideKind,
  headerToolbarLeading,
  headerToolbarExtras,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isLgScreen = useIsLgScreen();
  /** One popover instance — hidden mobile/desktop rows both stay mounted via CSS. */
  const mobileToolbarLeading = isLgScreen ? null : headerToolbarLeading;
  const desktopToolbarLeading = isLgScreen ? headerToolbarLeading : null;
  const mobileToolbarExtras = isLgScreen ? null : headerToolbarExtras;
  const desktopToolbarExtras = isLgScreen ? headerToolbarExtras : null;
  const addHelpTourAttr = helpGuideKind
    ? { 'data-help-tour': `${helpGuideKind}.header-add` as const }
    : {};
  const pageTourId = helpGuideKind ? ORDER_HUB_HELP_TOURS[helpGuideKind] : null;
  const helpGuideReplayMobile = pageTourId ? (
    <HelpGuidePageReplayButton tourId={pageTourId} compact />
  ) : null;
  const helpGuideReplayDesktop = pageTourId ? (
    <HelpGuidePageReplayButton tourId={pageTourId} />
  ) : null;

  return (
    <>
      {selectedOrderLabel ? (
        <AppShellHeaderMobileDetailBar
          className="lg:hidden"
          label={selectedOrderLabel}
          onBack={onClearSelection}
          backAriaLabel={backAriaLabel}
        />
      ) : null}

      <div className={cn(selectedOrderLabel && 'hidden lg:block')}>
        <AppShellHeader>
          {/* Mobile list header */}
          <div className="lg:hidden">
            <AppShellHeaderRow>
              <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
                <div className={appShellHeaderIconTileClass}>
                  <Icon className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className={appShellHeaderTitleClass}>{title}</h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {helpGuideReplayMobile}
                {mobileToolbarLeading}
                {mobileToolbarExtras}
                <AppShellHeaderInlineSearchToggle
                  open={mobileSearchOpen}
                  onOpenChange={setMobileSearchOpen}
                  searchAriaLabel={searchAriaLabel ?? `Search ${title.toLowerCase()}`}
                />
                <AppShellHeaderIconAction
                  icon={Plus}
                  onClick={onAdd}
                  ariaLabel={addAriaLabel}
                  {...addHelpTourAttr}
                />
              </div>
            </AppShellHeaderRow>
            <AppShellHeaderInlineSearchField
              value={searchInput}
              onChange={onSearchInputChange}
              placeholder={searchPlaceholder}
              open={mobileSearchOpen}
              onOpenChange={setMobileSearchOpen}
            />
          </div>

          {/* Desktop header — unchanged layout */}
          <div className="hidden lg:block">
            <AppShellHeaderRow>
              <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
                <div className={appShellHeaderIconTileClass}>
                  <Icon className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className={appShellHeaderTitleClass}>{title}</h1>
                {selectedOrderLabel ? (
                  <>
                    <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
                    <Breadcrumb className="min-w-0">
                      <BreadcrumbList className="items-center text-card-foreground dark:text-foreground">
                        <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                          <span className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5">
                            <ReferenceId
                              size="sm"
                              tone="default"
                              weight="medium"
                              className="truncate px-1.5 text-[15px] text-card-foreground dark:text-foreground"
                            >
                              {selectedOrderLabel}
                            </ReferenceId>
                            <button
                              type="button"
                              onClick={onClearSelection}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={closeSelectionAriaLabel}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 lg:ml-auto">
                {helpGuideReplayDesktop}
                {desktopToolbarLeading}
                {desktopToolbarExtras}
                <div className="relative w-[220px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchInput}
                    onChange={(event) => onSearchInputChange(event.target.value)}
                    className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                  />
                </div>
                <Button
                  type="button"
                  onClick={onAdd}
                  className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
                  {...addHelpTourAttr}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {addButtonLabel}
                </Button>
              </div>
            </AppShellHeaderRow>
          </div>
        </AppShellHeader>
      </div>
    </>
  );
};

export default OrderHubShellHeader;
