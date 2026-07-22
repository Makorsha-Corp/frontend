import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import CalendarEventPopover from './CalendarEventPopover';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface CalendarEventCardProps {
  event: CalendarEvent;
  variant: 'day' | 'agenda';
  className?: string;
}

const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ event, variant, className }) => {
  const style = getCategoryStyle(event.category);

  return (
    <CalendarEventPopover event={event} className={cn('block w-full', className)}>
      <div
        className={cn(
          'w-full rounded-md border text-left transition-colors hover:bg-muted/20',
          variant === 'day' ? 'p-3' : 'px-3 py-2',
          style.event,
        )}
      >
        {variant === 'day' ? (
          <>
            <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              {event.date_label}
            </p>
            <p className="mt-1 text-sm font-semibold">{event.title}</p>
            {event.subtitle ? (
              <p className="mt-1 text-xs opacity-80 line-clamp-2">{event.subtitle}</p>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{event.title}</p>
              <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-80">
                {event.date_label}
              </span>
            </div>
            {event.subtitle ? (
              <p className="mt-1 truncate text-xs opacity-80">{event.subtitle}</p>
            ) : null}
          </>
        )}
      </div>
    </CalendarEventPopover>
  );
};

export default CalendarEventCard;
