import React from 'react';
import { cn } from '@/lib/utils';
import { groupEventsByCategory } from '@/pages/newpages/calendar/calendarDateUtils';
import type { AgendaGroup } from '@/pages/newpages/calendar/calendarDateUtils';
import CalendarCategoryDivider from './CalendarCategoryDivider';
import CalendarEventCard from './CalendarEventCard';

export interface CalendarAgendaListProps {
  groups: AgendaGroup[];
}

const CalendarAgendaList: React.FC<CalendarAgendaListProps> = ({ groups }) => {
  if (groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-16 text-sm text-muted-foreground">
        No upcoming events in this range
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-card">
      <div className="space-y-4 px-4 pb-4">
        {groups.map((group) => {
          const categoryGroups = groupEventsByCategory(group.events);

          return (
            <section key={group.date}>
              <h3
                className={cn(
                  'sticky top-0 z-10 -mx-4 flex min-h-14 items-center',
                  'border-b border-border bg-card px-4 pt-4 pb-3',
                  'text-sm font-semibold text-foreground shadow-[0_1px_0_0_hsl(var(--border))]',
                )}
              >
                {group.dateLabel}
              </h3>
              <div className="mt-2 space-y-3">
                {categoryGroups.map((categoryGroup) => (
                  <div key={categoryGroup.category} className="space-y-1.5">
                    <CalendarCategoryDivider
                      category={categoryGroup.category}
                      count={categoryGroup.events.length}
                    />
                    {categoryGroup.events.map((event) => (
                      <CalendarEventCard key={event.id} event={event} variant="agenda" />
                    ))}
                  </div>
                ))}
              </div>
          </section>
        );
      })}
      </div>
    </div>
  );
};

export default CalendarAgendaList;
