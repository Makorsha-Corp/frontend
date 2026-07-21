import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import CalendarEventPopover from './CalendarEventPopover';
import { getCategoryStyle } from './calendarCategoryStyles';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_EVENTS = 3;

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

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({ days, onSelectDay }) => {
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
          <button
            key={day.date}
            type="button"
            className={cn(
              'flex min-h-[7rem] flex-col p-1.5 text-left transition-colors hover:bg-muted/20',
              !day.isCurrentMonth && 'bg-muted/10',
              day.isSelected && 'bg-brand-primary/[0.06]',
            )}
            onClick={() => onSelectDay(day.date)}
          >
            <span
              className={cn(
                'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                day.isToday && 'bg-brand-primary text-primary-foreground',
                !day.isToday && day.isSelected && 'bg-muted text-foreground',
                !day.isToday && !day.isSelected && 'text-muted-foreground',
              )}
            >
              {day.dayLabel}
            </span>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
              {day.events.slice(0, MAX_VISIBLE_EVENTS).map((event) => {
                const style = getCategoryStyle(event.category);
                return (
                  <CalendarEventPopover key={event.id} event={event}>
                    <div
                      className={cn(
                        'truncate rounded border px-1 py-0.5 text-[10px] leading-tight',
                        style.event,
                      )}
                    >
                      {event.title}
                    </div>
                  </CalendarEventPopover>
                );
              })}
              {day.events.length > MAX_VISIBLE_EVENTS ? (
                <span className="text-[10px] text-muted-foreground">
                  +{day.events.length - MAX_VISIBLE_EVENTS} more
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
