import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarDayCell } from '@/pages/newpages/calendar/calendarDateUtils';
import CalendarEventPopover from './CalendarEventPopover';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface CalendarWeekViewProps {
  days: CalendarDayCell[];
  onSelectDay: (date: string) => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({ days, onSelectDay }) => {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-7 divide-x divide-border overflow-hidden rounded-lg border border-border bg-card">
      {days.map((day) => (
        <div
          key={day.date}
          className={cn(
            'flex min-h-0 min-w-0 flex-col overflow-hidden',
            day.isSelected && 'bg-brand-primary/[0.06]',
          )}
        >
          <button
            type="button"
            className={cn(
              'flex shrink-0 flex-col gap-1 border-b border-border px-2 py-2 text-left transition-colors hover:bg-muted/30',
              day.isSelected && 'border-t-2 border-t-brand-primary',
            )}
            onClick={() => onSelectDay(day.date)}
          >
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold text-foreground">{day.dayLabel}</span>
              {day.isToday ? (
                <Badge variant="secondary" className="px-1 py-0 text-[9px] font-normal">
                  Today
                </Badge>
              ) : null}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {day.events.length} {day.events.length === 1 ? 'event' : 'events'}
            </span>
          </button>

          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5">
            {day.events.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/70 px-2 py-6 text-center text-[11px] text-muted-foreground">
                No events
              </div>
            ) : (
              day.events.map((event) => {
                const style = getCategoryStyle(event.category);
                return (
                  <CalendarEventPopover key={event.id} event={event}>
                    <div
                      className={cn(
                        'w-full rounded-md border p-2 text-left text-xs shadow-sm transition-colors hover:bg-muted/20',
                        style.event,
                      )}
                    >
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="truncate text-[10px] opacity-80">{event.date_label}</p>
                    </div>
                  </CalendarEventPopover>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarWeekView;
