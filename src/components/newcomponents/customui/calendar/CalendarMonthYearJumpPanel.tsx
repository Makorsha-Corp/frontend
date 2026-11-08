import React, { useEffect, useMemo, useState } from 'react';
import { format, setMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  parseCalendarDate,
  setAnchorMonthYear,
} from '@/pages/newpages/calendar/calendarDateUtils';

const YEARS_PER_PAGE = 12;
const YEAR_SPAN = 10;

type PanelMode = 'month' | 'year';

function monthCellClassName(selected: boolean) {
  return cn(
    buttonVariants({ variant: 'ghost' }),
    'h-9 rounded-md px-2 text-sm font-normal',
    selected &&
      'bg-slate-900 text-slate-50 hover:bg-slate-900 hover:text-slate-50 focus:bg-slate-900 focus:text-slate-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50 dark:hover:text-slate-900 dark:focus:bg-slate-50 dark:focus:text-slate-900',
  );
}

function captionSegmentClassName(active: boolean) {
  return cn(
    'rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors',
    active ? 'bg-muted text-foreground' : 'text-foreground hover:bg-muted',
  );
}

export interface CalendarMonthYearJumpPanelProps {
  anchorDate: string;
  onCommit: (isoDate: string) => void;
}

const CalendarMonthYearJumpPanel: React.FC<CalendarMonthYearJumpPanelProps> = ({
  anchorDate,
  onCommit,
}) => {
  const anchor = useMemo(() => parseCalendarDate(anchorDate), [anchorDate]);
  const [displayMonth, setDisplayMonth] = useState(anchor);
  const [mode, setMode] = useState<PanelMode>('month');

  useEffect(() => {
    setDisplayMonth(parseCalendarDate(anchorDate));
  }, [anchorDate]);

  const currentYear = new Date().getFullYear();
  const fromYear = currentYear - YEAR_SPAN;
  const toYear = currentYear + YEAR_SPAN;
  const displayYear = displayMonth.getFullYear();

  const [yearPageStart, setYearPageStart] = useState(() => {
    const maxStart = Math.max(fromYear, toYear - YEARS_PER_PAGE + 1);
    const rawStart =
      fromYear + Math.floor((displayYear - fromYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    return Math.min(Math.max(rawStart, fromYear), maxStart);
  });

  useEffect(() => {
    const maxStart = Math.max(fromYear, toYear - YEARS_PER_PAGE + 1);
    const rawStart =
      fromYear + Math.floor((displayYear - fromYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    setYearPageStart(Math.min(Math.max(rawStart, fromYear), maxStart));
  }, [displayYear, fromYear, toYear]);

  const yearPageEnd = Math.min(yearPageStart + YEARS_PER_PAGE - 1, toYear);
  const years = useMemo(
    () =>
      Array.from({ length: yearPageEnd - yearPageStart + 1 }, (_, index) => yearPageStart + index),
    [yearPageEnd, yearPageStart],
  );

  const canPageYearBack = yearPageStart > fromYear;
  const canPageYearForward = yearPageEnd < toYear;

  const commitMonth = (monthIndex: number, year: number) => {
    onCommit(setAnchorMonthYear(anchorDate, monthIndex, year));
  };

  return (
    <div className="w-[17rem] p-3">
      <div className="mb-3 flex items-center justify-center gap-1">
        <button
          type="button"
          className={captionSegmentClassName(mode === 'month')}
          aria-expanded={mode === 'month'}
          onClick={() => setMode('month')}
        >
          {format(displayMonth, 'MMMM')}
        </button>
        <button
          type="button"
          className={captionSegmentClassName(mode === 'year')}
          aria-expanded={mode === 'year'}
          onClick={() => setMode('year')}
        >
          {format(displayMonth, 'yyyy')}
        </button>
      </div>

      {mode === 'month' ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const selected = displayMonth.getMonth() === monthIndex;
            return (
              <button
                key={monthIndex}
                type="button"
                className={monthCellClassName(selected)}
                aria-current={selected ? 'date' : undefined}
                onClick={() => commitMonth(monthIndex, displayYear)}
              >
                {format(setMonth(displayMonth, monthIndex), 'MMM')}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between px-1">
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-7 w-7 p-0',
                !canPageYearBack && 'pointer-events-none opacity-30',
              )}
              aria-label="Previous years"
              disabled={!canPageYearBack}
              onClick={() =>
                setYearPageStart((start) => Math.max(fromYear, start - YEARS_PER_PAGE))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-muted-foreground">
              {yearPageStart}–{yearPageEnd}
            </span>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-7 w-7 p-0',
                !canPageYearForward && 'pointer-events-none opacity-30',
              )}
              aria-label="Next years"
              disabled={!canPageYearForward}
              onClick={() =>
                setYearPageStart((start) =>
                  Math.min(Math.max(fromYear, toYear - YEARS_PER_PAGE + 1), start + YEARS_PER_PAGE),
                )
              }
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {years.map((year) => {
              const selected = displayYear === year;
              return (
                <button
                  key={year}
                  type="button"
                  className={monthCellClassName(selected)}
                  aria-current={selected ? 'date' : undefined}
                  onClick={() => commitMonth(displayMonth.getMonth(), year)}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarMonthYearJumpPanel;
