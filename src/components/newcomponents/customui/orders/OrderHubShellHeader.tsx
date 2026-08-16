import React, { useState } from 'react';
import { Plus, Search, X, type LucideIcon } from 'lucide-react';

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
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
                <AppShellHeaderInlineSearchToggle
                  open={mobileSearchOpen}
                  onOpenChange={setMobileSearchOpen}
                  searchAriaLabel={searchAriaLabel ?? `Search ${title.toLowerCase()}`}
                />
                <AppShellHeaderIconAction icon={Plus} onClick={onAdd} ariaLabel={addAriaLabel} />
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
                            <span className="truncate px-1.5 text-[15px] font-medium text-card-foreground dark:text-foreground">
                              {selectedOrderLabel}
                            </span>
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
              <div className="flex flex-wrap items-center gap-3">
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
