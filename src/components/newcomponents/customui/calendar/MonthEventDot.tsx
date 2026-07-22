import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface MonthEventDotProps {
  event: CalendarEvent;
  className?: string;
}

const MonthEventDot: React.FC<MonthEventDotProps> = ({ event, className }) => {
  const style = getCategoryStyle(event.category);

  return (
    <span
      className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', style.dot, className)}
      aria-hidden
    />
  );
};

export default MonthEventDot;
