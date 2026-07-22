import React from 'react';
import { groupEventsByCategory } from '@/pages/newpages/calendar/calendarDateUtils';
import type { CalendarDayCell } from '@/pages/newpages/calendar/calendarDateUtils';
import CalendarCategoryDivider from './CalendarCategoryDivider';
import CalendarEventCard from './CalendarEventCard';

export interface CalendarDayViewProps {
  day: CalendarDayCell;
}

const CalendarDayView: React.FC<CalendarDayViewProps> = ({ day }) => {
  const categoryGroups = groupEventsByCategory(day.events);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">{day.dayLabel}</h2>
        <p className="text-xs text-muted-foreground">
          {day.events.length} {day.events.length === 1 ? 'event' : 'events'}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {day.events.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No events on this day
          </div>
        ) : (
          categoryGroups.map((group) => (
            <section key={group.category} className="space-y-1.5">
              <CalendarCategoryDivider category={group.category} count={group.events.length} />
              {group.events.map((event) => (
                <CalendarEventCard key={event.id} event={event} variant="day" />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default CalendarDayView;
