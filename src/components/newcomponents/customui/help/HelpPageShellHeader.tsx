import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';

import AppShellHeader, {
  AppShellHeaderIconAction,
  AppShellHeaderInlineSearchField,
  AppShellHeaderInlineSearchToggle,
  AppShellHeaderMobileDetailBar,
  AppShellHeaderRow,
  appShellHeaderControlClass,
  appShellHeaderLeftGroupClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { HelpTicketType } from '@/types/helpTicket';

import { getHelpCopy } from './helpCopy';
import HelpTypeTabs from './HelpTypeTabs';

interface HelpPageShellHeaderProps {
  activeType: HelpTicketType;
  onActiveTypeChange: (type: HelpTicketType) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  selectedTicketLabel: string | null;
  onClearSelection: () => void;
  onCreate: () => void;
}

const HelpPageShellHeader: React.FC<HelpPageShellHeaderProps> = ({
  activeType,
  onActiveTypeChange,
  searchInput,
  onSearchInputChange,
  selectedTicketLabel,
  onClearSelection,
  onCreate,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const copy = getHelpCopy(activeType);

  const searchAndCreate = (
    <div className="flex shrink-0 flex-wrap items-center gap-2 lg:gap-3">
      <div className="relative w-[220px] shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={copy.searchPlaceholder}
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          className={`pl-9 ${appShellHeaderControlClass} bg-background`}
        />
      </div>
      <Button
        type="button"
        onClick={onCreate}
        className={`${appShellHeaderControlClass} min-w-[9.25rem] shrink-0 bg-brand-primary hover:bg-brand-primary-hover`}
      >
        <Plus className="mr-2 h-4 w-4 shrink-0" />
        {copy.newButtonLabel}
      </Button>
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
          {/* Mobile — tabs-first like Machines hub */}
          <div className="space-y-3 lg:hidden">
            <AppShellHeaderRow className="flex-nowrap gap-1.5">
              <div className="min-w-0 shrink">
                <HelpTypeTabs value={activeType} onValueChange={onActiveTypeChange} compact />
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                <AppShellHeaderInlineSearchToggle
                  open={mobileSearchOpen}
                  onOpenChange={setMobileSearchOpen}
                  searchAriaLabel={`Search ${copy.listSectionTitle.toLowerCase()}`}
                />
                <AppShellHeaderIconAction
                  icon={Plus}
                  onClick={onCreate}
                  ariaLabel={copy.newAriaLabel}
                />
              </div>
            </AppShellHeaderRow>
            <AppShellHeaderInlineSearchField
              value={searchInput}
              onChange={onSearchInputChange}
              placeholder={copy.searchPlaceholder}
              open={mobileSearchOpen}
              onOpenChange={setMobileSearchOpen}
            />
          </div>

          {/* Desktop — tabs left, search + CTA right (Machines hub pattern) */}
          <div className="hidden lg:block">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className={appShellHeaderLeftGroupClass}>
                <HelpTypeTabs value={activeType} onValueChange={onActiveTypeChange} />
              </div>
              {searchAndCreate}
            </div>
          </div>
        </AppShellHeader>
      </div>
    </>
  );
};

export default HelpPageShellHeader;
