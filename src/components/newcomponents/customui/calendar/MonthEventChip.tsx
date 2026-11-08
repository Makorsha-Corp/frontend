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
          'max-w-full truncate rounded border-transparent leading-tight transition-[filter]',
          chipPadding,
          chipText,
          style.chipActive,
          'hover:brightness-110',
          className,
        )}
      >
        <span className="truncate font-medium">{event.title}</span>
      </div>
    </CalendarEventPopover>
  );
};

export default MonthEventChip;
