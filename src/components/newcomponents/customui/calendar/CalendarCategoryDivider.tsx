import React from 'react';
import { cn } from '@/lib/utils';
import type { CalendarCategory } from '@/types/calendar';
import { getCategoryStyle } from './calendarCategoryStyles';

export interface CalendarCategoryDividerProps {
  category: CalendarCategory;
  count?: number;
  className?: string;
}

const CalendarCategoryDivider: React.FC<CalendarCategoryDividerProps> = ({
  category,
  count,
  className,
}) => {
  const style = getCategoryStyle(category);

  return (
    <div
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium',
        style.chipActive,
        className,
      )}
      aria-label={count != null ? `${style.label}, ${count} events` : style.label}
    >
      <span>{style.label}</span>
      {count != null ? <span className="opacity-80">{count}</span> : null}
    </div>
  );
};

export default CalendarCategoryDivider;
