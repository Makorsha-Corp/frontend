import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { WeekDayCell } from '@/pages/newpages/orders/workOrderSheetData';
import {
  weekDayBandHeaderClass,
  weekDayBandHeaderSelectClass,
  weekDayBandSectionClass,
  weekDayContentInsetClass,
  weekDayCountLabel,
  weekDayHeaderAddButtonClass,
  weekDayHeaderCountClass,
} from './weekCalendarStyles';
import WorkOrderSheetTable from './WorkOrderSheetTable';

export interface WorkOrderWeekRowsProps {
  days: WeekDayCell[];
  onSelectDay: (date: string) => void;
  onAddForDay: (date: string) => void;
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
}

const WorkOrderWeekRows: React.FC<WorkOrderWeekRowsProps> = ({
  days,
  onSelectDay,
  onAddForDay,
  onRowClick,
  currentUserId = null,
  onSheetMutated,
}) => (
  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
    {days.map((day) => (
      <section key={day.date} className={weekDayBandSectionClass(day)}>
        <div className={weekDayBandHeaderClass(day)}>
          <button
            type="button"
            className={weekDayBandHeaderSelectClass()}
            onClick={() => onSelectDay(day.date)}
          >
            <span className="shrink-0 truncate text-sm font-semibold text-foreground">
              {day.dayLabel}
            </span>
            {day.isToday ? (
              <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                Today
              </Badge>
            ) : null}
          </button>

          {day.isEmpty ? (
            <button
              type="button"
              className={weekDayHeaderAddButtonClass()}
              onClick={() => onAddForDay(day.date)}
            >
              <Plus className="h-3 w-3 shrink-0" />
              Add work
            </button>
          ) : (
            <span className={weekDayHeaderCountClass()}>{weekDayCountLabel(day)}</span>
          )}
        </div>

        {!day.isEmpty ? (
          <div className={weekDayContentInsetClass()}>
            <WorkOrderSheetTable
              embed
              showHeader={false}
              rows={day.rows}
              onRowClick={onRowClick}
              currentUserId={currentUserId}
              onSheetMutated={onSheetMutated}
            />
          </div>
        ) : null}
      </section>
    ))}
  </div>
);

export default WorkOrderWeekRows;
