import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Label } from '@/components/ui/label';
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
  WORK_WHEN_TIME_VIEWPORT_PX,
} from '@/components/newcomponents/customui/timePicker/timePickerShared';
import { parseLocalDateValue } from '@/components/newcomponents/customui/DateTimePickerField';
import { resolveWorkOrderWindow, untimedDayBounds } from '@/pages/newpages/orders/workOrderWindow';
import {
  formatWorkWhenSummary,
  LENGTH_CHIP_PRESETS,
  lengthPresetFromMinutes,
  type LengthChipPresetId,
} from '@/components/newcomponents/customui/workWhenPickerSummary';

export interface WorkWhenPickerProps {
  value: string;
  onChange?: (value: string) => void;
  durationMinutes: string;
  onDurationMinutesChange?: (value: string) => void;
  timeZone: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
  minuteStep?: number;
  highlightedDates?: string[];
  recurrenceStartDate?: string;
  onPopoverClosed?: () => void;
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

function formatInstantWallTime(instant: Date, timeZone: string, use24Hour: boolean): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0') % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return formatWallTimeHm(formatHm(hour, minute), use24Hour);
}

function lengthChipClass(active: boolean) {
  return cn(
    'flex h-8 w-full items-center justify-start rounded-md border px-2 text-xs font-medium transition-colors',
    active
      ? 'border-brand-primary bg-brand-primary text-primary-foreground'
      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  );
}

const WorkWhenPicker: React.FC<WorkWhenPickerProps> = ({
  value,
  onChange,
  durationMinutes,
  onDurationMinutesChange,
  timeZone,
  disabled = false,
  className,
  triggerClassName,
  placeholder = 'Pick date',
  id,
  'aria-label': ariaLabel,
  minuteStep = 5,
  highlightedDates = [],
  recurrenceStartDate,
  onPopoverClosed,
}) => {
  const { use24Hour } = useUserTimeFormat();
  const [open, setOpen] = useState(false);
  const [alignId, setAlignId] = useState(0);
  const wasOpenRef = useRef(false);
  const [draftHasTime, setDraftHasTime] = useState(() => {
    const p = parseLocalDateValue(value);
    return p?.hour24 != null && p?.minute != null;
  });
  const [draftLengthPreset, setDraftLengthPreset] = useState<LengthChipPresetId>(() =>
    lengthPresetFromMinutes(durationMinutes),
  );
  const [draftCustomMinutes, setDraftCustomMinutes] = useState(() => {
    const preset = lengthPresetFromMinutes(durationMinutes);
    return preset === 'custom' ? durationMinutes : '';
  });

  const parsed = parseLocalDateValue(value);
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const seedHour = parsed?.hour24 ?? 8;
  const seedMinute = parsed?.minute ?? 0;
  const [draftDateIso, setDraftDateIso] = useState(parsed?.dateIso ?? todayIso);
  const [draftHour24, setDraftHour24] = useState(seedHour);
  const [draftMinute, setDraftMinute] = useState(seedMinute);
  const [draftHour12, setDraftHour12] = useState(() => hour24To12(seedHour).hour12);
  const [draftPeriod, setDraftPeriod] = useState<DayPeriod>(() => hour24To12(seedHour).period);

  const timeHm = formatHm(draftHour24, draftMinute);
  const minutesAnchorHm = useMemo(() => {
    const p = parseLocalDateValue(value);
    if (p?.hour24 != null && p?.minute != null) return formatHm(p.hour24, p.minute);
    return timeHm;
  }, [value, timeHm]);
  const minutes = useMemo(
    () => minutesListForStep(minuteStep, minutesAnchorHm),
    [minuteStep, minutesAnchorHm],
  );

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

  const syncDraftFromProps = useCallback(() => {
    const p = parseLocalDateValue(value);
    const hasTime = p?.hour24 != null && p?.minute != null;
    const hour = p?.hour24 ?? 8;
    const minute = p?.minute ?? 0;
    const { hour12, period } = hour24To12(hour);
    setDraftDateIso(p?.dateIso ?? todayIso);
    setDraftHour24(hour);
    setDraftMinute(minute);
    setDraftHour12(hour12);
    setDraftPeriod(period);
    setDraftHasTime(hasTime);
    const preset = lengthPresetFromMinutes(durationMinutes);
    setDraftLengthPreset(preset);
    setDraftCustomMinutes(preset === 'custom' ? durationMinutes : '');
  }, [value, durationMinutes, todayIso]);

  useEffect(() => {
    if (!open) {
      syncDraftFromProps();
    }
  }, [open, value, durationMinutes, syncDraftFromProps]);

  useLayoutEffect(() => {
    if (open && !wasOpenRef.current) {
      syncDraftFromProps();
      setAlignId((id) => id + 1);
      wasOpenRef.current = true;
    }
    if (!open) {
      wasOpenRef.current = false;
    }
  }, [open, syncDraftFromProps]);

  const commitDuration = useCallback(
    (next: string, preset: LengthChipPresetId) => {
      setDraftLengthPreset(preset);
      setDraftCustomMinutes(preset === 'custom' ? next : '');
      onDurationMinutesChange?.(next);
    },
    [onDurationMinutesChange],
  );

  const commitValue = useCallback(
    (next: string, close: boolean) => {
      onChange?.(next);
      if (!close) return;
      onPopoverClosed?.();
      setOpen(false);
    },
    [onChange, onPopoverClosed],
  );

  const emitTimed = useCallback(
    (dateIso: string, hour24: number, minute: number, close: boolean) => {
      commitValue(toLocalDateTimeValue(dateIso, hour24, minute), close);
    },
    [commitValue],
  );

  const resolvedHour24 = use24Hour ? draftHour24 : hour12To24(draftHour12, draftPeriod);
  const draftClock = draftHasTime ? `${pad2(resolvedHour24)}:${pad2(draftMinute)}` : null;

  const draftDurationMinutes = useMemo(() => {
    if (draftLengthPreset === 'rest') return '';
    if (draftLengthPreset === 'custom') return draftCustomMinutes;
    const preset = LENGTH_CHIP_PRESETS.find((item) => item.id === draftLengthPreset);
    return preset?.minutes ?? '';
  }, [draftLengthPreset, draftCustomMinutes]);

  const applyStartTime = useCallback(
    (hour24: number, minute: number) => {
      if (!draftHasTime) {
        setDraftHasTime(true);
        commitDuration('', 'rest');
      }
      setDraftHour24(hour24);
      setDraftMinute(minute);
      emitTimed(draftDateIso, hour24, minute, false);
    },
    [draftHasTime, draftDateIso, emitTimed, commitDuration],
  );

  const untilLabel = useMemo(() => {
    if (!draftHasTime || !draftClock) return null;
    const mins = draftDurationMinutes ? Number(draftDurationMinutes) : null;
    try {
      const window = resolveWorkOrderWindow({
        plannedDate: draftDateIso,
        plannedStartTime: draftClock,
        durationMinutes: mins,
        timeZone,
      });
      if (!window.end) return 'Until end of day';
      const dayEnd = untimedDayBounds(draftDateIso, timeZone).end;
      if (Math.abs(window.end.getTime() - dayEnd.getTime()) < 60_000) {
        return 'Until end of day';
      }
      return `Until ${formatInstantWallTime(window.end, timeZone, use24Hour)}`;
    } catch {
      return null;
    }
  }, [draftHasTime, draftClock, draftDateIso, draftDurationMinutes, timeZone, use24Hour]);

  const display = useMemo(
    () => formatWorkWhenSummary(value, durationMinutes, use24Hour, timeZone),
    [value, durationMinutes, use24Hour, timeZone],
  );

  const selectedDate = parseIsoDate(draftDateIso);

  const adoptWheelStartIfNeeded = useCallback(() => {
    if (draftHasTime) return;
    setDraftHasTime(true);
    emitTimed(draftDateIso, resolvedHour24, draftMinute, false);
  }, [draftHasTime, draftDateIso, resolvedHour24, draftMinute, emitTimed]);

  const handleRestLengthChip = () => {
    if (!draftHasTime) return;
    if (draftLengthPreset !== 'rest') {
      commitDuration('', 'rest');
      return;
    }
    setDraftHasTime(false);
    commitDuration('', 'rest');
    commitValue(draftDateIso, false);
  };

  const handlePresetClick = (presetId: LengthChipPresetId, minutesValue: string) => {
    if (presetId === 'rest') {
      handleRestLengthChip();
      return;
    }
    adoptWheelStartIfNeeded();
    commitDuration(minutesValue, presetId);
  };

  const handleCustomMinutesChange = (next: string) => {
    if (!next.trim()) {
      commitDuration('', 'rest');
      return;
    }
    adoptWheelStartIfNeeded();
    commitDuration(next, 'custom');
  };

  const footerLine = !draftHasTime ? 'All day' : untilLabel;

  const handleDone = () => {
    if (!draftHasTime) {
      commitValue(draftDateIso, true);
      return;
    }
    emitTimed(draftDateIso, resolvedHour24, draftMinute, true);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next && open) onPopoverClosed?.();
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel ?? 'Pick work date and time'}
          className={cn(
            'flex h-9 min-w-0 items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !display && 'text-muted-foreground',
            !className && !triggerClassName?.includes('w-') ? 'w-full' : null,
            triggerClassName,
            className,
          )}
        >
          <CalendarClock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate tabular-nums">{display ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-[min(48rem,96vw)] border-border bg-popover p-3"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
          <div className="flex shrink-0 flex-col space-y-1 md:self-stretch">
            <Label className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </Label>
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
                if (draftHasTime) {
                  emitTimed(iso, resolvedHour24, draftMinute, false);
                } else {
                  commitValue(iso, false);
                }
              }}
              initialFocus
              className="rounded-md border border-border p-0"
            />
          </div>
          <div
            className={cn(
              'flex min-h-0 flex-col space-y-1 md:self-stretch',
              use24Hour ? 'w-[220px]' : 'w-[248px]',
            )}
          >
            <Label className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Start
            </Label>
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col rounded-md border border-border/60 bg-muted/20 p-1',
                !draftHasTime && 'border-dashed',
              )}
            >
              <TimePickerColumnsPanel
                use24Hour={use24Hour}
                alignId={alignId}
                scrollActive={open}
                highlightSelection={draftHasTime}
                viewportHeightPx={WORK_WHEN_TIME_VIEWPORT_PX}
                minutes={minutes}
                draftHour24={draftHour24}
                draftHour12={draftHour12}
                draftMinute={draftMinute}
                draftPeriod={draftPeriod}
                onHour24Select={(hour) => {
                  const { hour12, period } = hour24To12(hour);
                  setDraftHour12(hour12);
                  setDraftPeriod(period);
                  applyStartTime(hour, draftMinute);
                }}
                onHour12Select={(hour12) => {
                  const h24 = hour12To24(hour12, draftPeriod);
                  setDraftHour12(hour12);
                  applyStartTime(h24, draftMinute);
                }}
                onMinuteSelect={(minute) => {
                  applyStartTime(resolvedHour24, minute);
                }}
                onPeriodSelect={(period) => {
                  const h24 = hour12To24(draftHour12, period);
                  setDraftPeriod(period);
                  applyStartTime(h24, draftMinute);
                }}
              />
            </div>
          </div>
          <div className="flex w-[10.5rem] shrink-0 flex-col gap-2 md:self-stretch md:border-l md:border-border md:pl-3">
            <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Length
            </Label>
            <div className="flex flex-col gap-1.5">
              {LENGTH_CHIP_PRESETS.map((preset) => {
                const isRest = preset.id === 'rest';
                const chipLabel = isRest
                  ? draftHasTime
                    ? 'Rest of day'
                    : 'Whole day'
                  : preset.label;
                const chipActive = draftLengthPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    title={
                      isRest && draftHasTime && chipActive ? 'Click again for whole day' : undefined
                    }
                    className={lengthChipClass(chipActive)}
                    onClick={() => handlePresetClick(preset.id, preset.minutes)}
                  >
                    {chipLabel}
                  </button>
                );
              })}
            </div>
            <StepNumberInput
              id={`${id ?? 'work-when'}-custom-minutes`}
              min={1}
              step={minuteStep}
              buttonStep={minuteStep}
              className="h-8"
              value={draftLengthPreset === 'custom' ? draftCustomMinutes : ''}
              placeholder="Custom min"
              aria-label="Custom duration in minutes"
              onChange={(event) => handleCustomMinutesChange(event.target.value)}
            />
            {footerLine ? (
              <p className="mt-auto pt-1 text-xs text-muted-foreground">{footerLine}</p>
            ) : null}
          </div>
        </div>
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

export default WorkWhenPicker;
