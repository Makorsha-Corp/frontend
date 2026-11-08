import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMillTimezone } from '@/hooks/useMillTimezone';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import type { CalendarDayCell } from '@/pages/newpages/calendar/calendarDateUtils';
import CalendarEventPopover from './CalendarEventPopover';
import CalendarStripeEventCard from './CalendarStripeEventCard';
import { formatCalendarEventWhen } from './calendarEventWhen';
import {
  calendarGridShellClass,
  calendarWeekDayColumnClass,
  calendarWeekDayHeaderClass,
  calendarWeekEventCountLabel,
} from './calendarPageStyles';

export interface CalendarWeekViewProps {
  days: CalendarDayCell[];
  onSelectDay: (date: string) => void;
}

const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({ days, onSelectDay }) => {
  const millTimezone = useMillTimezone();
  const { use24Hour } = useUserTimeFormat();

  return (
    <div
      className={cn(
        calendarGridShellClass,
        'grid min-h-0 flex-1 grid-cols-7 divide-x divide-border overflow-hidden',
      )}
    >
      {days.map((day) => (
        <div
          key={day.date}
          className={calendarWeekDayColumnClass({
            isToday: day.isToday,
            isSelected: day.isSelected,
          })}
        >
          <button
            type="button"
            className={calendarWeekDayHeaderClass({
              isToday: day.isToday,
              isSelected: day.isSelected,
            })}
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
              {calendarWeekEventCountLabel(day.events.length)}
            </span>
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto bg-background p-2">
            {day.events.length > 0 ? (
              <div>
                {day.events.map((event) => {
                  const whenLabel = formatCalendarEventWhen(event, millTimezone, use24Hour);

                  return (
                    <CalendarEventPopover
                      key={event.id}
                      event={event}
                      className="block w-full shrink-0"
                    >
                      <CalendarStripeEventCard
                        event={event}
                        whenLabel={whenLabel}
                        showSubtitle={false}
                        className="mb-1.5"
                      />
                    </CalendarEventPopover>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarWeekView;
