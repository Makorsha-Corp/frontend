import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import CalendarEventPopover from './CalendarEventPopover';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface MonthEventChipProps {
  event: CalendarEvent;
  chipText: string;
  chipPadding: string;
  className?: string;
}

const MonthEventChip: React.FC<MonthEventChipProps> = ({
  event,
  chipText,
  chipPadding,
  className,
}) => {
  const style = getCategoryStyle(event.category);

  return (
    <CalendarEventPopover event={event} className="inline-block max-w-full shrink-0">
      <div
        className={cn(
          'max-w-full truncate rounded border leading-tight',
          chipPadding,
          chipText,
          style.event,
          className,
        )}
      >
        {event.title}
      </div>
    </CalendarEventPopover>
  );
};

export default MonthEventChip;
