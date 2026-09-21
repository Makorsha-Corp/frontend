import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';

import AppShellHeader, {
  AppShellHeaderInlineSearchField,
  AppShellHeaderInlineSearchToggle,
  AppShellHeaderMobileDetailBar,
  AppShellHeaderRow,
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PlatformInboxShellHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  selectedTicketLabel: string | null;
  onClearSelection: () => void;
}

const PlatformInboxShellHeader: React.FC<PlatformInboxShellHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  searchPlaceholder,
  searchInput,
  onSearchInputChange,
  selectedTicketLabel,
  onClearSelection,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const desktopSearch = (
    <div className="relative w-[220px] shrink-0">
      <Input
        type="text"
        placeholder={searchPlaceholder}
        value={searchInput}
        onChange={(event) => onSearchInputChange(event.target.value)}
        className={cn(appShellHeaderControlClass, 'bg-background')}
      />
    </div>
  );

  return (
    <>
      {selectedTicketLabel ? (
        <AppShellHeaderMobileDetailBar
          className="lg:hidden"
          label={selectedTicketLabel}
          onBack={onClearSelection}
          backAriaLabel="Back to list"
        />
      ) : null}

      <div className={cn(selectedTicketLabel && 'hidden lg:block')}>
        <AppShellHeader sticky>
          <div className="space-y-3 lg:hidden">
            <AppShellHeaderRow className="flex-nowrap gap-1.5">
              <div className={appShellHeaderLeftGroupClass}>
                <div className={appShellHeaderIconTileClass}>
                  <Icon className="h-5 w-5 text-brand-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className={appShellHeaderTitleClass}>{title}</h1>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <div className="ml-auto shrink-0">
                <AppShellHeaderInlineSearchToggle
                  open={mobileSearchOpen}
                  onOpenChange={setMobileSearchOpen}
                  searchAriaLabel={`Search ${title.toLowerCase()}`}
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

          <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-4">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <Icon className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h1 className={appShellHeaderTitleClass}>{title}</h1>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            {desktopSearch}
          </div>
        </AppShellHeader>
      </div>
    </>
  );
};

export default PlatformInboxShellHeader;
