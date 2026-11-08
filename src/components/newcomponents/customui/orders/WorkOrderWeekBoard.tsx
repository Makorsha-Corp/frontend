import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  collapseSheetRowsToDayCards,
  type WeekDayCell,
} from '@/pages/newpages/orders/workOrderSheetData';
import {
  weekDayColumnHeaderClass,
  weekDayColumnShellClass,
  weekDayCountLabel,
} from './weekCalendarStyles';
import WorkOrderWeekCard from './WorkOrderWeekCard';

export type WorkOrderWeekBoardLayout = 'week' | 'day' | 'stack';

export interface WorkOrderWeekBoardProps {
  days: WeekDayCell[];
  layout: WorkOrderWeekBoardLayout;
  timeZone: string;
  onSelectDay: (date: string) => void;
  onOrderClick?: (workOrderId: number) => void;
  className?: string;
}

function DayColumn({
  day,
  timeZone,
  onSelectDay,
  onOrderClick,
}: {
  day: WeekDayCell;
  timeZone: string;
  onSelectDay: (date: string) => void;
  onOrderClick?: (workOrderId: number) => void;
}) {
  const cards = useMemo(() => collapseSheetRowsToDayCards(day.rows), [day.rows]);

  return (
    <div className={weekDayColumnShellClass(day)}>
      <button
        type="button"
        className={weekDayColumnHeaderClass(day)}
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
        <span className="text-[10px] text-muted-foreground">{weekDayCountLabel(day)}</span>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto bg-background p-2">
        {cards.length > 0 ? (
          <div>
            {cards.map((card) => (
              <WorkOrderWeekCard
                key={card.workOrderId}
                card={card}
                timeZone={timeZone}
                onOpen={onOrderClick}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const WorkOrderWeekBoard: React.FC<WorkOrderWeekBoardProps> = ({
  days,
  layout,
  timeZone,
  onSelectDay,
  onOrderClick,
  className,
}) => {
  if (layout === 'stack') {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto', className)}>
        {days.map((day) => (
          <div key={day.date} className="flex min-h-[8rem] shrink-0 flex-col">
            <DayColumn
              day={day}
              timeZone={timeZone}
              onSelectDay={onSelectDay}
              onOrderClick={onOrderClick}
            />
          </div>
        ))}
      </div>
    );
  }

  const gridClass =
    layout === 'week' ? 'grid min-h-0 flex-1 grid-cols-7 divide-x divide-border' : 'grid min-h-0 flex-1 grid-cols-1';

  return (
    <div className={cn(gridClass, 'overflow-hidden', className)}>
      {days.map((day) => (
        <DayColumn
          key={day.date}
          day={day}
          timeZone={timeZone}
          onSelectDay={onSelectDay}
          onOrderClick={onOrderClick}
        />
      ))}
    </div>
  );
};

export default WorkOrderWeekBoard;
