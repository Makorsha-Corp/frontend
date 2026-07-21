import React, { useCallback, useMemo, useState } from 'react';
import {
  endOfWeek,
  format,
  getUnixTime,
  isSameDay,
  isSameWeek,
  parseISO,
  startOfWeek,
} from 'date-fns';
import type { RowProps } from 'react-day-picker';
import { Day, useDayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import WorkOrderWeekSnapshotPanel from '@/components/newcomponents/customui/orders/WorkOrderWeekSnapshotPanel';
import {
  formatRelativeWeekTriggerLabel,
  SHEET_WEEK_STARTS_ON,
  type WorkOrderSheetRow,
} from '@/pages/newpages/orders/workOrderSheetData';

export interface WorkOrderWeekNavigatorProps {
  sheetDate: string;
  calendarSheetRows: WorkOrderSheetRow[];
  orderCountByDate: Record<string, number>;
  calendarMonth: Date;
  onCalendarMonthChange: (month: Date) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onSheetDateChange: (iso: string) => void;
  onGoToToday: () => void;
  className?: string;
}

const WorkOrderWeekNavigator: React.FC<WorkOrderWeekNavigatorProps> = ({
  sheetDate,
  calendarSheetRows,
  orderCountByDate,
  calendarMonth,
  onCalendarMonthChange,
  onNavigatePrev,
  onNavigateNext,
  onSheetDateChange,
  onGoToToday,
  className,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewWeekStart, setPreviewWeekStart] = useState<string | null>(null);
  const parsedDate = sheetDate ? parseISO(sheetDate) : undefined;

  const anchorWeekStart = useMemo(
    () =>
      sheetDate
        ? format(startOfWeek(parseISO(sheetDate), { weekStartsOn: SHEET_WEEK_STARTS_ON }), 'yyyy-MM-dd')
        : format(startOfWeek(new Date(), { weekStartsOn: SHEET_WEEK_STARTS_ON }), 'yyyy-MM-dd'),
    [sheetDate],
  );

  const displayWeekStart = previewWeekStart ?? anchorWeekStart;

  const triggerLabel = useMemo(
    () => (sheetDate ? formatRelativeWeekTriggerLabel(sheetDate) : 'Pick week'),
    [sheetDate],
  );

  const previewWeekDate = previewWeekStart ? parseISO(previewWeekStart) : undefined;

  const calendarModifiers = useMemo(() => {
    const hasOrders = (date: Date) => Boolean(orderCountByDate[format(date, 'yyyy-MM-dd')]);

    if (!parsedDate) {
      return previewWeekDate
        ? {
            hasOrders,
            previewWeek: (date: Date) =>
              isSameWeek(date, previewWeekDate, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
          }
        : { hasOrders };
    }

    const weekStart = startOfWeek(parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
    const weekEnd = endOfWeek(parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });

    return {
      hasOrders,
      selectedWeek: (date: Date) =>
        isSameWeek(date, parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
      selectedWeekStart: (date: Date) => isSameDay(date, weekStart),
      selectedWeekEnd: (date: Date) => isSameDay(date, weekEnd),
      ...(previewWeekDate
        ? {
            previewWeek: (date: Date) =>
              isSameWeek(date, previewWeekDate, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
          }
        : {}),
    };
  }, [parsedDate, orderCountByDate, previewWeekDate]);

  const calendarModifierClassNames = useMemo(
    () => ({
      hasOrders:
        'relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-brand-primary aria-selected:after:bg-white',
      selectedWeek:
        'rounded-none bg-brand-primary/10 hover:bg-brand-primary/15 aria-selected:!rounded-md aria-selected:!bg-brand-primary aria-selected:!text-white aria-selected:hover:!bg-brand-primary/90 aria-selected:hover:!text-white aria-selected:focus:!bg-brand-primary aria-selected:focus:!text-white dark:aria-selected:!bg-brand-primary dark:aria-selected:!text-white',
      selectedWeekStart: 'rounded-l-md',
      selectedWeekEnd: 'rounded-r-md',
      previewWeek: 'rounded-none bg-muted/60 text-foreground hover:bg-muted/70',
    }),
    [],
  );

  const handleRowMouseEnter = useCallback((dates: Date[]) => {
    if (dates.length === 0) return;
    const weekStart = format(
      startOfWeek(dates[0], { weekStartsOn: SHEET_WEEK_STARTS_ON }),
      'yyyy-MM-dd',
    );
    setPreviewWeekStart(weekStart);
  }, []);

  const HoverCalendarRow = useCallback(
    ({ dates, displayMonth, weekNumber }: RowProps) => {
      const { styles, classNames, showWeekNumber, components } = useDayPicker();
      const DayComponent = components?.Day ?? Day;
      const WeeknumberComponent = components?.WeekNumber;

      return (
        <tr
          className={classNames.row}
          style={styles.row}
          onMouseEnter={() => handleRowMouseEnter(dates)}
          onMouseLeave={() => setPreviewWeekStart(null)}
        >
          {showWeekNumber && WeeknumberComponent ? (
            <td className={classNames.cell} style={styles.cell}>
              <WeeknumberComponent number={weekNumber} dates={dates} />
            </td>
          ) : null}
          {dates.map((date) => (
            <td
              className={classNames.cell}
              style={styles.cell}
              key={getUnixTime(date)}
              role="presentation"
            >
              <DayComponent displayMonth={displayMonth} date={date} />
            </td>
          ))}
        </tr>
      );
    },
    [handleRowMouseEnter],
  );

  const calendarComponents = useMemo(
    () => ({
      Row: HoverCalendarRow,
      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
      IconRight: () => <ChevronRight className="h-4 w-4" />,
    }),
    [HoverCalendarRow],
  );

  const handleSelectDay = (date: string) => {
    onSheetDateChange(date);
    setPickerOpen(false);
  };

  const handlePickerOpenChange = (open: boolean) => {
    setPickerOpen(open);
    if (!open) setPreviewWeekStart(null);
  };

  return (
    <div className={cn('inline-flex shrink-0 flex-wrap items-center justify-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onNavigatePrev}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={pickerOpen} onOpenChange={handlePickerOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 min-w-[7rem] max-w-[min(14rem,40vw)] px-3 text-sm font-semibold"
          >
            <span className="truncate">{triggerLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="flex w-auto max-w-[min(36rem,94vw)] flex-row p-0"
        >
          <div className="shrink-0">
            <Calendar
              mode="single"
              weekStartsOn={SHEET_WEEK_STARTS_ON}
              selected={parsedDate}
              month={calendarMonth}
              onMonthChange={onCalendarMonthChange}
              modifiers={calendarModifiers}
              modifiersClassNames={calendarModifierClassNames}
              components={calendarComponents}
              classNames={{
                day_selected:
                  '!rounded-md !bg-brand-primary !text-white hover:!bg-brand-primary/90 hover:!text-white focus:!bg-brand-primary focus:!text-white dark:!bg-brand-primary dark:!text-white dark:hover:!bg-brand-primary/90',
                day_today:
                  'font-semibold bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50 aria-selected:!bg-brand-primary aria-selected:!text-white aria-selected:hover:!bg-brand-primary/90 aria-selected:hover:!text-white dark:aria-selected:!bg-brand-primary dark:aria-selected:!text-white',
              }}
              onSelect={(date) => {
                if (!date) return;
                handleSelectDay(format(date, 'yyyy-MM-dd'));
              }}
            />
          </div>
          <WorkOrderWeekSnapshotPanel
            weekStartIso={displayWeekStart}
            sheetDate={sheetDate}
            calendarSheetRows={calendarSheetRows}
            orderCountByDate={orderCountByDate}
            onSelectDay={handleSelectDay}
            className="border-l border-border"
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onNavigateNext}
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 px-2.5" onClick={onGoToToday}>
        Today
      </Button>
    </div>
  );
};

export default WorkOrderWeekNavigator;
