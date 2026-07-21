import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import {
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { cn } from '@/lib/utils';
import type { CalendarView } from '@/types/calendar';
import {
  getAnchorMonth,
  getAnchorYear,
  getMonthSelectOptions,
  getYearSelectOptions,
  isViewingCurrentPeriod,
  setAnchorMonthYear,
  shiftAnchorDate,
  todayIso,
} from '@/pages/newpages/calendar/calendarDateUtils';

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'Agenda' },
];

const MONTH_OPTIONS = getMonthSelectOptions();

const selectTriggerClass =
  'h-10 border-none bg-transparent px-2 shadow-none hover:bg-muted/50 focus:ring-0 focus:ring-offset-0';

export interface CalendarToolbarProps {
  view: CalendarView;
  anchorDate: string;
  onViewChange: (view: CalendarView) => void;
  onAnchorDateChange: (date: string) => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  view,
  anchorDate,
  onViewChange,
  onAnchorDateChange,
}) => {
  const isCurrentPeriod = isViewingCurrentPeriod(view, anchorDate);

  const month = getAnchorMonth(anchorDate);
  const year = getAnchorYear(anchorDate);
  const yearOptions = useMemo(() => getYearSelectOptions(anchorDate), [anchorDate]);

  const handleMonthChange = (value: string) => {
    onAnchorDateChange(setAnchorMonthYear(anchorDate, Number(value), year));
  };

  const handleYearChange = (value: string) => {
    onAnchorDateChange(setAnchorMonthYear(anchorDate, month, Number(value)));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-none border-r border-border"
            onClick={() => onAnchorDateChange(shiftAnchorDate(view, anchorDate, -1))}
            aria-label="Previous period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-2">
            <Select value={String(month)} onValueChange={handleMonthChange}>
              <SelectTrigger className={cn(selectTriggerClass, 'w-[7.5rem] font-semibold')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={handleYearChange}>
              <SelectTrigger className={cn(selectTriggerClass, 'w-[5.5rem] font-semibold')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((optionYear) => (
                  <SelectItem key={optionYear} value={String(optionYear)}>
                    {optionYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-none border-l border-border"
            onClick={() => onAnchorDateChange(shiftAnchorDate(view, anchorDate, 1))}
            aria-label="Next period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant={isCurrentPeriod ? 'secondary' : 'outline'}
          size="sm"
          className={cn('h-10 shrink-0 px-3', isCurrentPeriod && 'pointer-events-none opacity-70')}
          onClick={() => onAnchorDateChange(todayIso())}
          disabled={isCurrentPeriod}
        >
          Today
        </Button>
      </div>

      <EmphasisTabsProvider value={view}>
        <Tabs
          value={view}
          onValueChange={(nextView) => onViewChange(nextView as CalendarView)}
        >
          <EmphasisTabsList className="h-10 w-auto shrink-0 border border-border bg-muted/40 dark:bg-muted/60">
            {VIEW_OPTIONS.map((option) => (
              <EmphasisTabsTrigger
                key={option.value}
                value={option.value}
                className="flex-none px-3 text-sm"
              >
                {option.label}
              </EmphasisTabsTrigger>
            ))}
          </EmphasisTabsList>
        </Tabs>
      </EmphasisTabsProvider>
    </div>
  );
};

export default CalendarToolbar;
