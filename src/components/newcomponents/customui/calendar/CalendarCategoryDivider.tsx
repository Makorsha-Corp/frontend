import React from 'react';
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
    <div className={className ?? 'flex items-center gap-2'}>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {style.label}
      </span>
      <div className="h-px flex-1 bg-border" />
      {count != null ? (
        <span className="shrink-0 text-[10px] text-muted-foreground">{count}</span>
      ) : null}
    </div>
  );
};

export default CalendarCategoryDivider;
