import React, { useMemo, useState } from 'react';
import {
  endOfWeek,
  format,
  isSameDay,
  isSameWeek,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  workOrderCalendarHasOrdersModifierClassNames,
  workOrderWeekHoverModifierClassNames,
  workOrderWeekPickerDayClass,
  workOrderWeekSelectedModifierClassNames,
} from '@/components/ui/calendarDayClassNames';
import { buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SHEET_WEEK_STARTS_ON } from '@/pages/newpages/orders/workOrderSheetData';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { cn } from '@/lib/utils';

export type WorkOrdersDateFilterVisibleMode = 'all' | 'week' | 'day';

export interface WorkOrdersDateFilterControlsProps {
  dateViewMode: WorkOrdersDateViewMode;
  sheetDate: string;
  weekPeriodLabel: string | null;
  onDateViewModeChange: (mode: WorkOrdersDateViewMode) => void;
  onPickDate: (iso: string) => void;
  onPickWeek: (iso: string) => void;
  orderCountByDate?: Record<string, number>;
  calendarMonth?: Date;
  onCalendarMonthChange?: (month: Date) => void;
  /** Default: all three segments (work orders). Production schedule uses `['week']` only. */
  visibleModes?: WorkOrdersDateFilterVisibleMode[];
  className?: string;
}

const segmentTrackClass =
  'inline-flex h-9 shrink-0 items-center gap-0.5 rounded-lg bg-muted/80 p-1 ring-1 ring-border/60';

function segmentPillClass(active: boolean) {
  return cn(
    'h-8 rounded-md px-3 text-sm font-semibold transition-colors',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  );
}

const WorkOrdersDateFilterControls: React.FC<WorkOrdersDateFilterControlsProps> = ({
  dateViewMode,
  sheetDate,
  weekPeriodLabel,
  onDateViewModeChange,
  onPickDate,
  onPickWeek,
  orderCountByDate = {},
  calendarMonth,
  onCalendarMonthChange,
  visibleModes = ['all', 'week', 'day'],
  className,
}) => {
  const showAll = visibleModes.includes('all');
  const showWeek = visibleModes.includes('week');
  const showDay = visibleModes.includes('day');
  const weekOnly = showWeek && !showAll && !showDay;
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [hoveredWeekDate, setHoveredWeekDate] = useState<Date | undefined>();

  const parsedDate = sheetDate ? parseISO(sheetDate) : undefined;
  const [internalCalendarMonth, setInternalCalendarMonth] = useState(() =>
    startOfMonth(sheetDate ? parseISO(sheetDate) : new Date()),
  );
  const resolvedCalendarMonth = calendarMonth ?? internalCalendarMonth;

  const handleCalendarMonthChange = (month: Date) => {
    const normalized = startOfMonth(month);
    onCalendarMonthChange?.(normalized);
    if (!calendarMonth) {
      setInternalCalendarMonth(normalized);
    }
  };

  const syncCalendarMonthToSelection = () => {
    handleCalendarMonthChange(startOfMonth(parsedDate ?? new Date()));
  };

  const dayHasOrders = useMemo(
    () => (date: Date) => Boolean(orderCountByDate[format(date, 'yyyy-MM-dd')]),
    [orderCountByDate],
  );

  const calendarModifierClassNames = useMemo(
    () => ({
      ...workOrderCalendarHasOrdersModifierClassNames,
      ...workOrderWeekSelectedModifierClassNames,
      ...workOrderWeekHoverModifierClassNames,
    }),
    [],
  );
  const dayPillLabel =
    dateViewMode === 'day' && parsedDate ? format(parsedDate, 'd MMM') : 'Date';
  const weekPillLabel =
    weekOnly || (dateViewMode === 'week' && weekPeriodLabel) ? (weekPeriodLabel ?? 'Week') : 'Week';

  const weekCalendarModifiers = useMemo(() => {
    const base: Record<string, (date: Date) => boolean> = {
      hasOrders: dayHasOrders,
    };
    if (parsedDate) {
      const weekStart = startOfWeek(parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
      const weekEnd = endOfWeek(parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
      base.selectedWeek = (date: Date) =>
        isSameWeek(date, parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
      base.selectedWeekStart = (date: Date) => isSameDay(date, weekStart);
      base.selectedWeekEnd = (date: Date) => isSameDay(date, weekEnd);
    }
    if (hoveredWeekDate) {
      const hoverStart = startOfWeek(hoveredWeekDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
      const hoverEnd = endOfWeek(hoveredWeekDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
      base.hoverWeek = (date: Date) =>
        isSameWeek(date, hoveredWeekDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
      base.hoverWeekStart = (date: Date) => isSameDay(date, hoverStart);
      base.hoverWeekEnd = (date: Date) => isSameDay(date, hoverEnd);
    }
    return base;
  }, [parsedDate, hoveredWeekDate, dayHasOrders]);

  const dayCalendarModifiers = useMemo(
    () => ({
      hasOrders: dayHasOrders,
    }),
    [dayHasOrders],
  );

  const handleWeekPickerOpenChange = (open: boolean) => {
    setWeekPickerOpen(open);
    if (!open) setHoveredWeekDate(undefined);
    if (open) syncCalendarMonthToSelection();
  };

  const handleDayPickerOpenChange = (open: boolean) => {
    setDayPickerOpen(open);
    if (open) syncCalendarMonthToSelection();
  };

  const handleWeekPillClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (dateViewMode !== 'week') {
      event.preventDefault();
      onDateViewModeChange('week');
      setWeekPickerOpen(false);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className={segmentTrackClass}>
        {showAll ? (
          <button
            type="button"
            className={segmentPillClass(dateViewMode === 'all')}
            onClick={() => onDateViewModeChange('all')}
          >
            All dates
          </button>
        ) : null}

        {showWeek ? (
          <Popover open={weekPickerOpen} onOpenChange={handleWeekPickerOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={segmentPillClass(weekOnly || dateViewMode === 'week')}
                onClick={weekOnly ? undefined : handleWeekPillClick}
              >
                {weekPillLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div onMouseLeave={() => setHoveredWeekDate(undefined)}>
                <Calendar
                  mode="single"
                  weekStartsOn={SHEET_WEEK_STARTS_ON}
                  selected={parsedDate}
                  month={resolvedCalendarMonth}
                  onMonthChange={handleCalendarMonthChange}
                  modifiers={weekCalendarModifiers}
                  modifiersClassNames={calendarModifierClassNames}
                  onDayMouseEnter={setHoveredWeekDate}
                  classNames={{
                    day: cn(buttonVariants({ variant: 'ghost' }), workOrderWeekPickerDayClass),
                  }}
                  onSelect={(date) => {
                    if (!date) return;
                    onPickWeek(format(date, 'yyyy-MM-dd'));
                    setWeekPickerOpen(false);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        {showDay ? (
          <Popover open={dayPickerOpen} onOpenChange={handleDayPickerOpenChange}>
            <PopoverTrigger asChild>
              <button type="button" className={segmentPillClass(dateViewMode === 'day')}>
                {dayPillLabel}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parsedDate}
                month={resolvedCalendarMonth}
                onMonthChange={handleCalendarMonthChange}
                modifiers={dayCalendarModifiers}
                modifiersClassNames={workOrderCalendarHasOrdersModifierClassNames}
                onSelect={(d) => {
                  if (d) {
                    onPickDate(format(d, 'yyyy-MM-dd'));
                    setDayPickerOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </div>
  );
};

export default WorkOrdersDateFilterControls;
