import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { groupEventsByCategory } from '@/pages/newpages/calendar/calendarDateUtils';
import {
  DEFAULT_MONTH_CELL_LAYOUT,
  getMonthCellLayoutConfig,
  type MonthCellLayoutConfig,
  type MonthCellLayoutPreset,
} from './calendarMonthCellLayouts';
import MonthEventChip from './MonthEventChip';
import MonthEventDot from './MonthEventDot';
import MonthOverflowChip from './MonthOverflowChip';

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
  layoutPreset?: MonthCellLayoutPreset;
}

function CategoryGroupedChips({
  events,
  layout,
  overflowCount,
}: {
  events: CalendarEvent[];
  layout: MonthCellLayoutConfig;
  overflowCount: number;
}) {
  const groups = groupEventsByCategory(events);
  const lastGroupIndex = groups.length - 1;

  return (
    <>
      {groups.map((group, groupIndex) => (
        <div
          key={group.category}
          className={cn(
            'flex w-full flex-wrap items-start gap-x-1 gap-y-1',
            groupIndex > 0 && layout.categoryGap,
          )}
        >
          {group.events.map((event) => (
            <MonthEventChip
              key={event.id}
              event={event}
              chipText={layout.chipText}
              chipPadding={layout.chipPadding}
            />
          ))}
          {groupIndex === lastGroupIndex && overflowCount > 0 ? (
            <MonthOverflowChip
              count={overflowCount}
              chipText={layout.chipText}
              chipPadding={layout.chipPadding}
            />
          ) : null}
        </div>
      ))}
    </>
  );
}

function MonthCellDayHeader({
  dayLabel,
  isToday,
  isSelected,
  events,
}: {
  dayLabel: string;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}) {
  return (
    <div className="mb-1 flex min-w-0 items-center gap-1">
      <span
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isToday && 'bg-brand-primary text-primary-foreground',
          !isToday && isSelected && 'bg-muted text-foreground',
          !isToday && !isSelected && 'text-muted-foreground',
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

function MonthCellEventBody({
  visibleEvents,
  overflowCount,
  layout,
}: {
  visibleEvents: CalendarEvent[];
  overflowCount: number;
  layout: MonthCellLayoutConfig;
}) {
  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden', layout.stackGap)}>
      <CategoryGroupedChips
        events={visibleEvents}
        layout={layout}
        overflowCount={overflowCount}
      />
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
  const hasOverflow = events.length > layout.maxVisibleEvents;
  const visibleLimit = hasOverflow
    ? layout.maxVisibleEvents - 1
    : layout.maxVisibleEvents;
  const visibleEvents = events.slice(0, visibleLimit);
  const overflowCount = events.length - visibleEvents.length;

  return (
    <MonthCellEventBody
      visibleEvents={visibleEvents}
      overflowCount={overflowCount}
      layout={layout}
    />
  );
}

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  days,
  onSelectDay,
  layoutPreset = DEFAULT_MONTH_CELL_LAYOUT,
}) => {
  const layout = getMonthCellLayoutConfig(layoutPreset);

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
              'flex cursor-pointer flex-col p-1.5 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              layout.cellMinHeight,
              !day.isCurrentMonth && 'bg-muted/10',
              day.isSelected && 'bg-brand-primary/[0.06]',
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
              events={day.events}
            />
            <MonthCellEvents events={day.events} layout={layout} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
