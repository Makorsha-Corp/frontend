import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import CalendarMonthYearJumpPanel from './CalendarMonthYearJumpPanel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  formatCalendarDate,
  formatPeriodLabel,
  getPeriodStepAriaLabel,
  isViewingCurrentPeriod,
  parseCalendarDate,
  shiftAnchorDate,
  todayIso,
} from '@/pages/newpages/calendar/calendarDateUtils';

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'agenda', label: 'Agenda' },
];

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const isCurrentPeriod = isViewingCurrentPeriod(view, anchorDate);
  const anchor = useMemo(() => parseCalendarDate(anchorDate), [anchorDate]);
  const periodLabel = useMemo(() => formatPeriodLabel(view, anchorDate), [view, anchorDate]);

  const isHeader = variant === 'header';
  const controlHeight = isHeader ? appShellHeaderControlClass : 'h-10';
  const dateShellClass = isHeader
    ? cn('inline-flex items-stretch overflow-hidden rounded-lg border shadow-sm', appShellHeaderBoxedControlClass)
    : 'inline-flex h-10 items-stretch overflow-hidden rounded-lg border border-border bg-card shadow-sm';
  const navButtonClass = cn(
    'shrink-0 rounded-none text-foreground',
    isHeader ? cn(appShellHeaderControlClass, 'w-9') : 'h-10 w-10',
  );

  const navigationControls = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'shrink-0 px-3',
          controlHeight,
          isCurrentPeriod
            ? 'border-muted/70 bg-muted/40 font-normal text-muted-foreground shadow-none hover:bg-muted/55 dark:border-muted dark:bg-muted/25'
            : cn(
                'border-border bg-background font-medium text-foreground hover:bg-muted/60',
                isHeader && 'shadow-sm',
              ),
        )}
        onClick={() => onAnchorDateChange(todayIso())}
        aria-current={isCurrentPeriod ? 'date' : undefined}
        aria-label={isCurrentPeriod ? 'Currently viewing today — jump to today' : 'Go to today'}
      >
        Today
      </Button>

      <div className={dateShellClass}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={navButtonClass}
          onClick={() => onAnchorDateChange(shiftAnchorDate(view, anchorDate, -1))}
          aria-label={getPeriodStepAriaLabel(view, 'previous')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'h-auto min-w-0 shrink rounded-none px-3 font-semibold',
                isHeader ? 'h-9 max-w-[min(16rem,42vw)]' : 'h-10 max-w-[min(18rem,50vw)]',
              )}
              aria-label={
                view === 'month'
                  ? `${periodLabel}. Choose month`
                  : `${periodLabel}. Choose date`
              }
            >
              <CalendarDays className="mr-1.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{periodLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {view === 'month' ? (
              <CalendarMonthYearJumpPanel
                anchorDate={anchorDate}
                onCommit={(iso) => {
                  onAnchorDateChange(iso);
                  setPickerOpen(false);
                }}
              />
            ) : (
              <Calendar
                mode="single"
                selected={anchor}
                defaultMonth={anchor}
                onSelect={(date) => {
                  if (!date) return;
                  onAnchorDateChange(formatCalendarDate(date));
                  setPickerOpen(false);
                }}
                initialFocus
              />
            )}
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={navButtonClass}
          onClick={() => onAnchorDateChange(shiftAnchorDate(view, anchorDate, 1))}
          aria-label={getPeriodStepAriaLabel(view, 'next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
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
