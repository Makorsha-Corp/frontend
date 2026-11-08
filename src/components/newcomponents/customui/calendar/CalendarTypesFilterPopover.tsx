import React from 'react';
import { Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { cn } from '@/lib/utils';
import {
  ALL_CALENDAR_CATEGORIES,
  type CalendarCategory,
} from '@/types/calendar';
import CategoryLegendChips from './CategoryLegendChips';

export interface CalendarTypesFilterPopoverProps {
  activeCategories: CalendarCategory[];
  onToggle: (category: CalendarCategory) => void;
  onToggleAll: () => void;
}

const CalendarTypesFilterPopover: React.FC<CalendarTypesFilterPopoverProps> = ({
  activeCategories,
  onToggle,
  onToggleAll,
}) => {
  const allActive = activeCategories.length === ALL_CALENDAR_CATEGORIES.length;
  const noneActive = activeCategories.length === 0;
  const activeCount = activeCategories.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={allActive ? 'outline' : 'secondary'}
          size="sm"
          className={cn('shrink-0 gap-1.5', appShellHeaderControlClass)}
          aria-label={
            noneActive
              ? 'Event types — none selected'
              : allActive
                ? 'Event types — all shown'
                : `Event types — ${activeCount} of ${ALL_CALENDAR_CATEGORIES.length} shown`
          }
        >
          <Layers className="h-4 w-4 shrink-0" />
          Types
          {!allActive ? (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto max-w-[94vw] border-border bg-background p-3 shadow-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <CategoryLegendChips
          variant="popover"
          activeCategories={activeCategories}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
        />
      </PopoverContent>
    </Popover>
  );
};

export default CalendarTypesFilterPopover;
