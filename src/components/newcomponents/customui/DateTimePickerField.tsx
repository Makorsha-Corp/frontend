import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  calendarPlannedRecurrenceModifierClassNames,
  calendarRecurrenceStartModifierClassNames,
} from '@/components/ui/calendarDayClassNames';
import { cn } from '@/lib/utils';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import {
  formatWallTimeHm,
  hour12To24,
  hour24To12,
  type DayPeriod,
} from '@/lib/wallTimeFormat';
import TimePickerColumnsPanel from '@/components/newcomponents/customui/timePicker/TimePickerColumnsPanel';
import {
  formatHm,
  minutesListForStep,
  pad2,
  TIME_PICKER_VIEWPORT_PX,
  WORK_WHEN_TIME_VIEWPORT_PX,
} from '@/components/newcomponents/customui/timePicker/timePickerShared';
import type { WorkspaceShift } from '@/types/workspaceShift';
import {
  findShiftForDate,
  formatShiftChipLabel,
  shiftWindowStartOnDate,
  toDatetimeLocalValue,
} from '@/lib/workspaceShiftChipUtils';

export interface DateTimePickerFieldProps {
  /** Local `yyyy-MM-dd` or `yyyy-MM-ddTHH:mm` (datetime-local style) */
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
  minuteStep?: number;
  use24Hour?: boolean;
  /** Used when `value` is empty, so picking a date does not fall back to midnight. */
  defaultHour24?: number;
  defaultMinute?: number;
  /** When true, value may be date-only; Done without touching time keeps the whole day. */
  timeOptional?: boolean;
  highlightedDates?: string[];
  recurrenceStartDate?: string;
  /** Fired when the picker popover closes. Receives the local datetime that should be saved. */
  onPopoverClosed?: (value: string) => void;
  /** When set, shift chips render below calendar + time (inside popover). */
  shifts?: WorkspaceShift[];
  selectedShiftId?: number | null;
  onSelectedShiftIdChange?: (id: number | null) => void;
  onShiftPicked?: (plannedLocal: string, shiftId: number) => void;
}

function parseLocalDateTime(value: string): {
  dateIso: string;
  hour24: number;
  minute: number;
} | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hour = parseInt(match[2], 10);
  const minute = parseInt(match[3], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { dateIso: match[1], hour24: hour, minute };
}

export function parseLocalDateValue(value: string): {
  dateIso: string;
  hour24?: number;
  minute?: number;
} | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(trimmed);
  if (dateOnly) return { dateIso: dateOnly[1] };
  return parseLocalDateTime(trimmed);
}

function toLocalDateTimeValue(dateIso: string, hour24: number, minute: number): string {
  return `${dateIso}T${pad2(hour24)}:${pad2(minute)}`;
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
}

const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  triggerClassName,
  placeholder = 'Pick date and time',
  id,
  'aria-label': ariaLabel,
  minuteStep = 5,
  use24Hour: use24HourProp,
  defaultHour24 = 0,
  defaultMinute = 0,
  timeOptional = false,
  highlightedDates = [],
  recurrenceStartDate,
  onPopoverClosed,
  shifts,
  selectedShiftId = null,
  onSelectedShiftIdChange,
  onShiftPicked,
}) => {
  const { use24Hour: use24FromProfile } = useUserTimeFormat();
  const use24Hour = use24HourProp ?? use24FromProfile;

  const [open, setOpen] = useState(false);
  const [alignId, setAlignId] = useState(0);
  const wasOpenRef = useRef(false);
  const calendarWrapRef = useRef<HTMLDivElement>(null);
  const [timeViewportPx, setTimeViewportPx] = useState(WORK_WHEN_TIME_VIEWPORT_PX);
  const [draftHasTime, setDraftHasTime] = useState(false);

  const parsed = parseLocalDateValue(value);
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const seedHour = parsed?.hour24 ?? defaultHour24;
  const seedMinute = parsed?.minute ?? defaultMinute;
  const [draftDateIso, setDraftDateIso] = useState(parsed?.dateIso ?? todayIso);
  const [draftHour24, setDraftHour24] = useState(seedHour);
  const [draftMinute, setDraftMinute] = useState(seedMinute);
  const [draftHour12, setDraftHour12] = useState(() => hour24To12(seedHour).hour12);
  const [draftPeriod, setDraftPeriod] = useState<DayPeriod>(() => hour24To12(seedHour).period);

  const timeHm = formatHm(draftHour24, draftMinute);
  const minutes = useMemo(() => minutesListForStep(minuteStep, timeHm), [minuteStep, timeHm]);

  const calendarModifiers = useMemo(() => {
    const modifiers: Record<string, Date[]> = {};
    const planned = highlightedDates
      .map((iso) => parseIsoDate(iso))
      .filter((d): d is Date => d != null);
    if (planned.length) modifiers.plannedRecurrence = planned;
    const start = parseIsoDate(recurrenceStartDate ?? '');
    if (start) modifiers.recurrenceStart = [start];
    return Object.keys(modifiers).length ? modifiers : undefined;
  }, [highlightedDates, recurrenceStartDate]);

  const calendarModifierClassNames = useMemo(
    () => ({
      ...calendarPlannedRecurrenceModifierClassNames,
      ...(recurrenceStartDate ? calendarRecurrenceStartModifierClassNames : {}),
    }),
    [recurrenceStartDate],
  );

  const syncDraftFromValue = useCallback(() => {
    const p = parseLocalDateValue(value);
    const hasTime = p?.hour24 != null && p?.minute != null;
    const hour = p?.hour24 ?? defaultHour24;
    const minute = p?.minute ?? defaultMinute ?? minutes[0] ?? 0;
    const { hour12, period } = hour24To12(hour);
    setDraftDateIso(p?.dateIso ?? todayIso);
    setDraftHour24(hour);
    setDraftMinute(minute);
    setDraftHour12(hour12);
    setDraftPeriod(period);
    setDraftHasTime(timeOptional ? hasTime : true);
  }, [value, minutes, todayIso, defaultHour24, defaultMinute, timeOptional]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      syncDraftFromValue();
      setAlignId((id) => id + 1);
    }
    wasOpenRef.current = open;
  }, [open, syncDraftFromValue]);

  const measureCalendarHeight = useCallback(() => {
    const height = calendarWrapRef.current?.getBoundingClientRect().height;
    if (!height) return;
    const matched = Math.round(height - 14);
    setTimeViewportPx(
      Math.min(WORK_WHEN_TIME_VIEWPORT_PX + 40, Math.max(TIME_PICKER_VIEWPORT_PX, matched)),
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measureCalendarHeight();
    const node = calendarWrapRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measureCalendarHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open, alignId, measureCalendarHeight]);

  const commitValue = useCallback(
    (next: string, close: boolean) => {
      onChange?.(next);
      if (!close) return;
      onPopoverClosed?.(next);
      setOpen(false);
    },
    [onChange, onPopoverClosed],
  );

  const activeShifts = useMemo(
    () => (shifts ?? []).filter((shift) => shift.is_active),
    [shifts],
  );

  const syncShiftFromLocalValue = useCallback(
    (localValue: string) => {
      if (!onSelectedShiftIdChange || activeShifts.length === 0) return;
      if (!localValue) {
        onSelectedShiftIdChange(null);
        return;
      }
      const matched = findShiftForDate(activeShifts, new Date(localValue));
      onSelectedShiftIdChange(matched?.id ?? null);
    },
    [activeShifts, onSelectedShiftIdChange],
  );

  const emitTimed = useCallback(
    (dateIso: string, hour24: number, minute: number, close: boolean) => {
      const local = toLocalDateTimeValue(dateIso, hour24, minute);
      syncShiftFromLocalValue(local);
      commitValue(local, close);
    },
    [commitValue, syncShiftFromLocalValue],
  );

  const applyShiftToDraft = useCallback(
    (shift: WorkspaceShift, dateIso: string, close: boolean) => {
      const ref = parseIsoDate(dateIso) ?? new Date();
      const next = shiftWindowStartOnDate(shift, ref);
      const local = toDatetimeLocalValue(next);
      const parsedShift = parseLocalDateTime(local);
      if (!parsedShift) return;
      const { hour12, period } = hour24To12(parsedShift.hour24);
      setDraftDateIso(parsedShift.dateIso);
      setDraftHour24(parsedShift.hour24);
      setDraftMinute(parsedShift.minute);
      setDraftHour12(hour12);
      setDraftPeriod(period);
      setDraftHasTime(true);
      onSelectedShiftIdChange?.(shift.id);
      commitValue(local, close);
      onShiftPicked?.(local, shift.id);
    },
    [commitValue, onSelectedShiftIdChange, onShiftPicked],
  );

  const resolvedHour24 = use24Hour ? draftHour24 : hour12To24(draftHour12, draftPeriod);

  const selectedShiftName = useMemo(() => {
    if (activeShifts.length === 0) return null;
    if (selectedShiftId != null) {
      return activeShifts.find((shift) => shift.id === selectedShiftId)?.name ?? null;
    }
    if (!value) return null;
    return findShiftForDate(activeShifts, new Date(value))?.name ?? null;
  }, [activeShifts, selectedShiftId, value]);

  const display = useMemo(() => {
    const p = parseLocalDateValue(value);
    if (!p) return null;
    const date = parseIsoDate(p.dateIso);
    const datePart = date ? format(date, 'dd.MM.yyyy') : p.dateIso;
    if (p.hour24 == null || p.minute == null) return datePart;
    const timePart = formatWallTimeHm(formatHm(p.hour24, p.minute), use24Hour);
    const when = `${datePart} ${timePart}`;
    return selectedShiftName ? `${when} · ${selectedShiftName}` : when;
  }, [value, use24Hour, selectedShiftName]);

  const selectedDate = parseIsoDate(draftDateIso);
  const popoverWidth = use24Hour ? 'w-auto max-w-none' : 'w-auto max-w-none';
  const effectiveHasTime = timeOptional ? draftHasTime : true;

  const handleDone = () => {
    if (timeOptional && !draftHasTime) {
      commitValue(draftDateIso, true);
      return;
    }
    emitTimed(draftDateIso, resolvedHour24, draftMinute, true);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next && open) onPopoverClosed?.(value);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel ?? 'Pick date and time'}
          className={cn(
            'flex h-9 items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !display && 'text-muted-foreground',
            !className && !triggerClassName?.includes('w-') ? 'w-full' : null,
            triggerClassName,
            className,
          )}
        >
          <CalendarClock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="tabular-nums">{display ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-auto max-w-[min(94vw,52rem)] border-border bg-popover p-3',
          popoverWidth,
        )}
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex w-max max-w-[min(94vw,52rem)] flex-col gap-3 sm:flex-row sm:items-start">
          <div ref={calendarWrapRef} className="shrink-0 self-start">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              modifiers={calendarModifiers}
              modifiersClassNames={calendarModifierClassNames}
              onSelect={(date) => {
                if (!date) return;
                const iso = format(date, 'yyyy-MM-dd');
                setDraftDateIso(iso);
                if (effectiveHasTime) {
                  emitTimed(iso, resolvedHour24, draftMinute, false);
                } else {
                  commitValue(iso, false);
                }
              }}
              initialFocus
              className="rounded-md border border-border p-0"
            />
          </div>
          <div className={cn('shrink-0 self-start', use24Hour ? 'w-[220px]' : 'w-[248px]')}>
            <TimePickerColumnsPanel
              use24Hour={use24Hour}
              alignId={alignId}
              viewportHeightPx={timeViewportPx}
              minutes={minutes}
              draftHour24={draftHour24}
              draftHour12={draftHour12}
              draftMinute={draftMinute}
              draftPeriod={draftPeriod}
              onHour24Select={(hour) => {
                setDraftHasTime(true);
                setDraftHour24(hour);
                emitTimed(draftDateIso, hour, draftMinute, false);
              }}
              onHour12Select={(hour12) => {
                const h24 = hour12To24(hour12, draftPeriod);
                setDraftHasTime(true);
                setDraftHour12(hour12);
                setDraftHour24(h24);
                emitTimed(draftDateIso, h24, draftMinute, false);
              }}
              onMinuteSelect={(minute) => {
                setDraftHasTime(true);
                setDraftMinute(minute);
                emitTimed(draftDateIso, resolvedHour24, minute, false);
              }}
              onPeriodSelect={(period) => {
                const h24 = hour12To24(draftHour12, period);
                setDraftHasTime(true);
                setDraftPeriod(period);
                setDraftHour24(h24);
                emitTimed(draftDateIso, h24, draftMinute, false);
              }}
            />
          </div>
        </div>
        {activeShifts.length > 0 ? (
          <div
            className="space-y-1.5 border-t border-border pt-3"
            role="group"
            aria-label="Workspace shift"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Shift
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {activeShifts.map((shift) => (
                <button
                  key={shift.id}
                  type="button"
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md border px-2.5 text-xs font-medium transition-colors',
                    selectedShiftId === shift.id
                      ? 'border-brand-primary bg-brand-primary/15 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                  title={formatShiftChipLabel(shift, use24Hour)}
                  onClick={() => {
                    if (selectedShiftId === shift.id) return;
                    applyShiftToDraft(shift, draftDateIso, false);
                  }}
                >
                  {formatShiftChipLabel(shift, use24Hour)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {timeOptional ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              setDraftHasTime(false);
              commitValue(draftDateIso, false);
            }}
          >
            Whole day
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full bg-brand-primary hover:bg-brand-primary-hover"
          onClick={handleDone}
        >
          Done
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default DateTimePickerField;
