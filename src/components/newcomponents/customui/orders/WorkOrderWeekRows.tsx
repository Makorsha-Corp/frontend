import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { WeekDayCell } from '@/pages/newpages/orders/workOrderSheetData';
import type { RecurrenceProgramSummary } from '@/pages/newpages/orders/workOrderRecurrenceProgram';
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
  programSummariesByWorkOrderId?: Map<number, RecurrenceProgramSummary>;
}

const WorkOrderWeekRows: React.FC<WorkOrderWeekRowsProps> = ({
  days,
  onSelectDay,
  onAddForDay,
  onRowClick,
  currentUserId = null,
  onSheetMutated,
  programSummariesByWorkOrderId,
}) => (
  <div className="flex flex-col">
    {days.map((day) => {
      const hasTable = day.rows.length > 0;

      return (
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

            <div className="flex shrink-0 items-center gap-2">
              {!day.isEmpty ? (
                <span className={weekDayHeaderCountClass()}>{weekDayCountLabel(day)}</span>
              ) : null}
              <button
                type="button"
                className={weekDayHeaderAddButtonClass()}
                onClick={() => onAddForDay(day.date)}
              >
                <Plus className="h-3 w-3 shrink-0" />
                Add work
              </button>
            </div>
          </div>

          {hasTable ? (
            <div className={weekDayContentInsetClass()}>
              <WorkOrderSheetTable
                embed
                showHeader={false}
                showStartDateColumn
                hideStartDateLabel
                rows={day.rows}
                onRowClick={onRowClick}
                currentUserId={currentUserId}
                onSheetMutated={onSheetMutated}
                programSummariesByWorkOrderId={programSummariesByWorkOrderId}
              />
            </div>
          ) : null}
        </section>
      );
    })}
  </div>
);

export default WorkOrderWeekRows;
