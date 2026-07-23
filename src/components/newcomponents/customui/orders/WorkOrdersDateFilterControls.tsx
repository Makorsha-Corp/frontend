import React, { useMemo, useState } from 'react';
import {
  endOfWeek,
  format,
  isSameDay,
  isSameWeek,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { workOrderWeekSelectedModifierClassNames } from '@/components/ui/calendarDayClassNames';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SHEET_WEEK_STARTS_ON } from '@/pages/newpages/orders/workOrderSheetData';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { cn } from '@/lib/utils';

export interface WorkOrdersDateFilterControlsProps {
  dateViewMode: WorkOrdersDateViewMode;
  sheetDate: string;
  weekPeriodLabel: string | null;
  onDateViewModeChange: (mode: WorkOrdersDateViewMode) => void;
  onPickDate: (iso: string) => void;
  onPickWeek: (iso: string) => void;
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

const weekCalendarModifierClassNames = workOrderWeekSelectedModifierClassNames;

const WorkOrdersDateFilterControls: React.FC<WorkOrdersDateFilterControlsProps> = ({
  dateViewMode,
  sheetDate,
  weekPeriodLabel,
  onDateViewModeChange,
  onPickDate,
  onPickWeek,
  className,
}) => {
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);

  const parsedDate = sheetDate ? parseISO(sheetDate) : undefined;
  const dayPillLabel =
    dateViewMode === 'day' && parsedDate ? format(parsedDate, 'd MMM') : 'Date';
  const weekPillLabel =
    dateViewMode === 'week' && weekPeriodLabel ? weekPeriodLabel : 'Week';

  const weekCalendarModifiers = useMemo(() => {
    if (!parsedDate) return {};
    const weekStart = startOfWeek(parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
    const weekEnd = endOfWeek(parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON });
    return {
      selectedWeek: (date: Date) =>
        isSameWeek(date, parsedDate, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
      selectedWeekStart: (date: Date) => isSameDay(date, weekStart),
      selectedWeekEnd: (date: Date) => isSameDay(date, weekEnd),
    };
  }, [parsedDate]);

  const handleWeekPickerOpenChange = (open: boolean) => {
    setWeekPickerOpen(open);
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
        <button
          type="button"
          className={segmentPillClass(dateViewMode === 'all')}
          onClick={() => onDateViewModeChange('all')}
        >
          All dates
        </button>

        <Popover open={weekPickerOpen} onOpenChange={handleWeekPickerOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={segmentPillClass(dateViewMode === 'week')}
              onClick={handleWeekPillClick}
            >
              {weekPillLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              weekStartsOn={SHEET_WEEK_STARTS_ON}
              selected={parsedDate}
              modifiers={weekCalendarModifiers}
              modifiersClassNames={weekCalendarModifierClassNames}
              onSelect={(date) => {
                if (!date) return;
                onPickWeek(format(date, 'yyyy-MM-dd'));
                setWeekPickerOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <Popover open={dayPickerOpen} onOpenChange={setDayPickerOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={segmentPillClass(dateViewMode === 'day')}>
              {dayPillLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={(d) => {
                if (d) {
                  onPickDate(format(d, 'yyyy-MM-dd'));
                  setDayPickerOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default WorkOrdersDateFilterControls;
