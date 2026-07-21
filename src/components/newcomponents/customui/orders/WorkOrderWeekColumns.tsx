import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WeekDayCell, WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import {
  workOrderStatusBadgeClass,
  workOrderStatusLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import {
  weekDayColumnHeaderClass,
  weekDayColumnShellClass,
  weekDayCountLabel,
  weekDayEmptyAddButtonClass,
  weekDayColumnEmptyInsetClass,
} from './weekCalendarStyles';

export interface WorkOrderWeekColumnsProps {
  days: WeekDayCell[];
  onSelectDay: (date: string) => void;
  onAddForDay: (date: string) => void;
  onRowClick?: (workOrderId: number) => void;
}

function uniqueOrdersForDay(rows: WorkOrderSheetRow[]): WorkOrderSheetRow[] {
  const seen = new Set<number>();
  const result: WorkOrderSheetRow[] = [];
  for (const row of rows) {
    if (seen.has(row.workOrderId)) continue;
    seen.add(row.workOrderId);
    result.push(row);
  }
  return result;
}

const WorkOrderWeekColumns: React.FC<WorkOrderWeekColumnsProps> = ({
  days,
  onSelectDay,
  onAddForDay,
  onRowClick,
}) => {
  const ordersByDay = useMemo(
    () => days.map((day) => ({ day, orders: uniqueOrdersForDay(day.rows) })),
    [days],
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-7 divide-x divide-border overflow-hidden">
      {ordersByDay.map(({ day, orders }) => (
        <div key={day.date} className={weekDayColumnShellClass(day)}>
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

          <div className="min-h-0 flex-1 overflow-y-auto bg-background p-1.5">
            {orders.length === 0 ? (
              <div className={weekDayColumnEmptyInsetClass()}>
                <button
                  type="button"
                  className={weekDayEmptyAddButtonClass('columns')}
                  onClick={() => onAddForDay(day.date)}
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  Add work
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {orders.map((order) => (
                  <button
                    key={order.workOrderId}
                    type="button"
                    className="w-full rounded-md border border-border/60 bg-background p-2 text-left text-xs shadow-sm transition-colors hover:bg-muted/30"
                    onClick={() => onRowClick?.(order.workOrderId)}
                  >
                    <p className="truncate font-medium text-foreground">{order.machineName}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{order.works}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'mt-1 px-1 py-0 text-[9px] font-normal',
                        workOrderStatusBadgeClass(order.status),
                      )}
                    >
                      {workOrderStatusLabel(order.status)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkOrderWeekColumns;
