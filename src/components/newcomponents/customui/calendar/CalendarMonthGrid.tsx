import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { planMonthCellDisplay } from '@/pages/newpages/calendar/calendarMonthCellDisplay';
import {
  MONTH_CELL_LAYOUT,
  type MonthCellLayoutConfig,
} from './calendarMonthCellLayouts';
import MonthCellMeasuredChipRows from './MonthCellMeasuredChipRows';
import {
  calendarGridShellClass,
  calendarMonthDayCellClass,
} from './calendarPageStyles';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface CalendarMonthGridProps {
  days: Array<{
    date: string;
    dayLabel: string;
    isToday: boolean;
    isSelected: boolean;
    isCurrentMonth: boolean;
    events: CalendarEvent[];
  }>;
  onSelectDay: (date: string) => void;
}

function MonthCellDayHeader({
  dayLabel,
  isToday,
  isSelected,
  isCurrentMonth,
  events,
}: {
  dayLabel: string;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}) {
  return (
    <div className="mb-1 flex min-h-0 shrink-0 items-center gap-1.5">
      <span
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
          isToday && 'bg-brand-primary text-primary-foreground shadow-sm',
          !isToday && isSelected && 'bg-muted text-foreground ring-1 ring-border',
          !isToday && !isSelected && isCurrentMonth && 'text-foreground',
          !isToday && !isSelected && !isCurrentMonth && 'text-muted-foreground/50',
        )}
      >
        {dayLabel}
      </span>
      {events.length > 0 ? (
        <span className="ml-auto shrink-0 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {events.length}
        </span>
      ) : null}
    </div>
  );
}

function MonthCellEvents({
  events,
  layout,
}: {
  events: CalendarEvent[];
  layout: MonthCellLayoutConfig;
}) {
  const plan = planMonthCellDisplay(events);

  if (plan.groups.length === 0) return null;

  return (
    <MonthCellMeasuredChipRows
      groups={plan.groups}
      totalEventCount={plan.totalEventCount}
      layout={layout}
    />
  );
}

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  days,
  onSelectDay,
}) => {
  const layout = MONTH_CELL_LAYOUT;

  return (
    <div className={calendarGridShellClass}>
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted/35">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 divide-x divide-y divide-border/80 overflow-y-auto bg-background/40">
        {days.map((day) => (
          <div
            key={day.date}
            role="button"
            tabIndex={0}
            className={cn(
              layout.cellMinHeight,
              calendarMonthDayCellClass({
                isToday: day.isToday,
                isSelected: day.isSelected,
                isCurrentMonth: day.isCurrentMonth,
              }),
            )}
            onClick={() => onSelectDay(day.date)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectDay(day.date);
              }
            }}
          >
            <MonthCellDayHeader
              dayLabel={day.dayLabel}
              isToday={day.isToday}
              isSelected={day.isSelected}
              isCurrentMonth={day.isCurrentMonth}
              events={day.events}
            />
            <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', !day.isCurrentMonth && 'opacity-75')}>
              <MonthCellEvents events={day.events} layout={layout} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
