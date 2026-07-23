import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { planMonthCellDisplay } from '@/pages/newpages/calendar/calendarMonthCellDisplay';
import {
  MONTH_CELL_LAYOUT,
  type MonthCellLayoutConfig,
} from './calendarMonthCellLayouts';
import MonthCellMeasuredChipRows from './MonthCellMeasuredChipRows';
import MonthEventDot from './MonthEventDot';
import { groupEventsByCategory } from '@/pages/newpages/calendar/calendarDateUtils';

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
    <div className="mb-1 flex min-h-0 shrink-0 items-center gap-1">
      <span
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isToday && 'bg-brand-primary text-primary-foreground',
          !isToday && isSelected && 'bg-muted text-foreground',
          !isToday && !isSelected && isCurrentMonth && 'text-muted-foreground',
          !isToday && !isSelected && !isCurrentMonth && 'text-muted-foreground/45',
        )}
      >
        {dayLabel}
      </span>
      {events.length > 0 ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1">
          {groupEventsByCategory(events).map((group, groupIndex) => (
            <div
              key={group.category}
              className={cn('flex flex-wrap items-center gap-1', groupIndex > 0 && 'ml-0.5')}
            >
              {group.events.map((event) => (
                <MonthEventDot key={event.id} event={event} />
              ))}
            </div>
          ))}
        </div>
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="grid shrink-0 grid-cols-7 border-b border-border bg-muted/20">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 divide-x divide-y divide-border overflow-y-auto">
        {days.map((day) => (
          <div
            key={day.date}
            role="button"
            tabIndex={0}
            className={cn(
              'relative flex min-h-0 cursor-pointer flex-col overflow-hidden p-1.5 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              layout.cellMinHeight,
              !day.isCurrentMonth && 'bg-muted/30 dark:bg-muted/20',
              day.isSelected && day.isCurrentMonth && 'bg-brand-primary/[0.06]',
              day.isSelected && !day.isCurrentMonth && 'bg-brand-primary/[0.04]',
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
