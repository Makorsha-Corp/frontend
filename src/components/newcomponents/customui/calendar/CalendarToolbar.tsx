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
import {
  appShellHeaderBoxedControlClass,
  appShellHeaderControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import type { CalendarView } from '@/types/calendar';
import {
  getAnchorDay,
  getAnchorMonth,
  getAnchorYear,
  getDaySelectOptions,
  getMonthSelectOptions,
  getYearSelectOptions,
  isViewingCurrentPeriod,
  setAnchorDay,
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
  /** Header row in AppShellHeader vs standalone page row. */
  variant?: 'default' | 'header';
  /** Split navigation (date) and views for header layout. */
  part?: 'all' | 'navigation' | 'views';
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  view,
  anchorDate,
  onViewChange,
  onAnchorDateChange,
  variant = 'default',
  part = 'all',
}) => {
  const isCurrentPeriod = isViewingCurrentPeriod(view, anchorDate);

  const month = getAnchorMonth(anchorDate);
  const year = getAnchorYear(anchorDate);
  const day = getAnchorDay(anchorDate);
  const yearOptions = useMemo(() => getYearSelectOptions(anchorDate), [anchorDate]);
  const dayOptions = useMemo(() => getDaySelectOptions(month, year), [month, year]);

  const handleMonthChange = (value: string) => {
    onAnchorDateChange(setAnchorMonthYear(anchorDate, Number(value), year));
  };

  const handleYearChange = (value: string) => {
    onAnchorDateChange(setAnchorMonthYear(anchorDate, month, Number(value)));
  };

  const handleDayChange = (value: string) => {
    onAnchorDateChange(setAnchorDay(anchorDate, Number(value)));
  };

  const isHeader = variant === 'header';
  const controlHeight = isHeader ? appShellHeaderControlClass : 'h-10';
  const dateShellClass = isHeader
    ? cn('inline-flex items-stretch overflow-hidden rounded-lg border shadow-sm', appShellHeaderBoxedControlClass)
    : 'inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-border bg-card shadow-sm';
  const navButtonClass = cn(
    'shrink-0 rounded-none',
    isHeader ? cn(appShellHeaderControlClass, 'w-9') : 'h-10 w-10',
  );
  const selectTrigger = cn(
    selectTriggerClass,
    isHeader && '!h-9',
  );

  const navigationControls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className={dateShellClass}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(navButtonClass, 'border-r border-border')}
          onClick={() => onAnchorDateChange(shiftAnchorDate(view, anchorDate, -1))}
          aria-label="Previous period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          <Select value={String(month)} onValueChange={handleMonthChange}>
            <SelectTrigger className={cn(selectTrigger, 'w-[7.5rem] font-semibold')}>
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

          {view === 'day' ? (
            <Select value={String(day)} onValueChange={handleDayChange}>
              <SelectTrigger className={cn(selectTrigger, 'w-[3.25rem] font-semibold')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((optionDay) => (
                  <SelectItem key={optionDay} value={String(optionDay)}>
                    {optionDay}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <Select value={String(year)} onValueChange={handleYearChange}>
            <SelectTrigger className={cn(selectTrigger, 'w-[5.5rem] font-semibold')}>
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
          className={cn(navButtonClass, 'border-l border-border')}
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
        className={cn(
          'shrink-0 px-3',
          controlHeight,
          isHeader && 'border-border bg-background',
          isCurrentPeriod && 'pointer-events-none opacity-70',
        )}
        onClick={() => onAnchorDateChange(todayIso())}
        disabled={isCurrentPeriod}
      >
        Today
      </Button>
    </div>
  );

  const viewControls = (
    <EmphasisTabsProvider value={view}>
      <Tabs value={view} onValueChange={(nextView) => onViewChange(nextView as CalendarView)}>
        <EmphasisTabsList
          className={cn(
            'w-auto shrink-0 border border-border bg-muted/40 dark:bg-muted/60',
            isHeader ? cn(appShellHeaderControlClass, 'h-9') : 'h-10',
          )}
        >
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
  );

  if (part === 'navigation') {
    return navigationControls;
  }

  if (part === 'views') {
    return viewControls;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {navigationControls}
      {viewControls}
    </div>
  );
};

export default CalendarToolbar;
