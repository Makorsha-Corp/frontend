import React from 'react';
import { cn } from '@/lib/utils';
import type { AgendaGroup } from '@/pages/newpages/calendar/calendarDateUtils';
import CalendarEventPopover from './CalendarEventPopover';
import { getCategoryStyle } from './calendarCategoryStyles';

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
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4">
      {groups.map((group) => (
        <section key={group.date}>
          <h3 className="sticky top-0 z-10 bg-card py-1 text-sm font-semibold text-foreground">
            {group.dateLabel}
          </h3>
          <div className="mt-2 space-y-2">
            {group.events.map((event) => {
              const style = getCategoryStyle(event.category);
              return (
                <CalendarEventPopover key={event.id} event={event} className="block w-full">
                  <div
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted/20',
                      style.event,
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-80">
                        {event.date_label}
                      </span>
                    </div>
                    {event.subtitle ? (
                      <p className="mt-1 truncate text-xs opacity-80">{event.subtitle}</p>
                    ) : null}
                  </div>
                </CalendarEventPopover>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CalendarAgendaList;
