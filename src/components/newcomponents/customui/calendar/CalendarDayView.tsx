import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarDayCell } from '@/pages/newpages/calendar/calendarDateUtils';
import CalendarEventPopover from './CalendarEventPopover';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface CalendarDayViewProps {
  day: CalendarDayCell;
}

const CalendarDayView: React.FC<CalendarDayViewProps> = ({ day }) => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{day.dayLabel}</h2>
        <p className="text-xs text-muted-foreground">
          {day.events.length} {day.events.length === 1 ? 'event' : 'events'}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {day.events.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No events on this day
          </div>
        ) : (
          day.events.map((event) => {
            const style = getCategoryStyle(event.category);
            return (
              <CalendarEventPopover key={event.id} event={event} className="block w-full">
                <div
                  className={cn(
                    'w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/20',
                    style.event,
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                    {style.label} · {event.date_label}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{event.title}</p>
                  {event.subtitle ? (
                    <p className="mt-1 text-xs opacity-80 line-clamp-2">{event.subtitle}</p>
                  ) : null}
                </div>
              </CalendarEventPopover>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CalendarDayView;
