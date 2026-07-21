import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  buildWeekDaysFromDailyCounts,
  buildWeekSnapshotOrdersByDate,
  formatCompactWeekSnapshotHeaderFromWeekStart,
  type WorkOrderSheetRow,
} from '@/pages/newpages/orders/workOrderSheetData';

export interface WorkOrderWeekSnapshotPanelProps {
  weekStartIso: string;
  sheetDate: string;
  calendarSheetRows: WorkOrderSheetRow[];
  orderCountByDate: Record<string, number>;
  onSelectDay: (date: string) => void;
  className?: string;
}

const WorkOrderWeekSnapshotPanel: React.FC<WorkOrderWeekSnapshotPanelProps> = ({
  weekStartIso,
  sheetDate,
  calendarSheetRows,
  orderCountByDate,
  onSelectDay,
  className,
}) => {
  const header = formatCompactWeekSnapshotHeaderFromWeekStart(weekStartIso);

  const weekDays = useMemo(
    () => buildWeekDaysFromDailyCounts(orderCountByDate, weekStartIso, sheetDate),
    [orderCountByDate, weekStartIso, sheetDate],
  );

  const ordersByDate = useMemo(
    () => buildWeekSnapshotOrdersByDate(calendarSheetRows, weekStartIso),
    [calendarSheetRows, weekStartIso],
  );

  const busyDays = useMemo(
    () => weekDays.filter((day) => day.entryCount > 0),
    [weekDays],
  );

  const totalOrders = useMemo(
    () => weekDays.reduce((sum, day) => sum + day.entryCount, 0),
    [weekDays],
  );

  const statsLine =
    busyDays.length > 0
      ? `${busyDays.length} ${busyDays.length === 1 ? 'day' : 'days'} with work · ${totalOrders} ${totalOrders === 1 ? 'order' : 'orders'}`
      : null;

  return (
    <div className={cn('flex min-w-[14rem] flex-col', className)}>
      <div className="border-b border-border/60 px-3 py-2">
        <p className="text-sm font-semibold">{header}</p>
        {statsLine ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{statsLine}</p>
        ) : null}
      </div>
      <div className="max-h-[min(18rem,50vh)] overflow-y-auto px-1 py-1">
        {busyDays.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">No work this week</p>
        ) : (
          <ul className="space-y-0.5">
            {busyDays.map((day) => {
              const rowLabel = format(parseISO(day.date), 'EEE d');
              const countLabel = `${day.entryCount} ${day.entryCount === 1 ? 'order' : 'orders'}`;
              const isSelected = day.date === sheetDate;
              const orders = ordersByDate[day.date] ?? [];

              return (
                <li key={day.date}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50',
                      isSelected && 'bg-brand-primary/10 text-brand-primary',
                    )}
                    onClick={() => onSelectDay(day.date)}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium">{rowLabel}</span>
                      <span
                        className={cn(
                          'shrink-0 text-muted-foreground',
                          isSelected && 'text-brand-primary/80',
                        )}
                      >
                        · {countLabel}
                      </span>
                    </span>
                    {orders.length > 0 ? (
                      <span className="flex flex-col gap-0.5 pl-0.5">
                        {orders.map((order) => (
                          <span
                            key={order.workOrderId}
                            className={cn(
                              'truncate text-[10px] leading-snug text-muted-foreground',
                              isSelected && 'text-brand-primary/75',
                            )}
                            title={`${order.workOrderNumber} · ${order.machineName} · ${order.works}`}
                          >
                            {order.machineName} · {order.works}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WorkOrderWeekSnapshotPanel;
