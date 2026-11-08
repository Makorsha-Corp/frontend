import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  parseHm,
} from '@/components/newcomponents/customui/timePicker/timePickerShared';

export interface TimePickerFieldProps {
  /** 24h wall time `HH:mm` */
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
}

const TimePickerField: React.FC<TimePickerFieldProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  triggerClassName,
  placeholder = 'Pick time',
  id,
  'aria-label': ariaLabel,
  minuteStep = 5,
  use24Hour: use24HourProp,
}) => {
  const { use24Hour: use24FromProfile } = useUserTimeFormat();
  const use24Hour = use24HourProp ?? use24FromProfile;

  const [open, setOpen] = useState(false);
  const [alignId, setAlignId] = useState(0);
  const wasOpenRef = useRef(false);
  const parsed = parseHm(value);
  const [draftHour24, setDraftHour24] = useState(parsed?.hour ?? 0);
  const [draftMinute, setDraftMinute] = useState(parsed?.minute ?? 0);
  const [draftHour12, setDraftHour12] = useState(() => hour24To12(parsed?.hour ?? 0).hour12);
  const [draftPeriod, setDraftPeriod] = useState<DayPeriod>(() => hour24To12(parsed?.hour ?? 0).period);

  const minutes = useMemo(() => minutesListForStep(minuteStep, value), [minuteStep, value]);

  const syncDraftFromValue = useCallback(() => {
    const p = parseHm(value);
    const hour = p?.hour ?? 0;
    const minute = p?.minute ?? minutes[0] ?? 0;
    const { hour12, period } = hour24To12(hour);
    setDraftHour24(hour);
    setDraftMinute(minute);
    setDraftHour12(hour12);
    setDraftPeriod(period);
  }, [value, minutes]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      syncDraftFromValue();
      setAlignId((id) => id + 1);
    }
    wasOpenRef.current = open;
  }, [open, syncDraftFromValue]);

  const applyDraft = useCallback(
    (hour24: number, minute: number, close: boolean) => {
      onChange?.(formatHm(hour24, minute));
      if (close) setOpen(false);
    },
    [onChange],
  );

  const resolvedHour24 = use24Hour ? draftHour24 : hour12To24(draftHour12, draftPeriod);
  const display = parsed ? formatWallTimeHm(formatHm(parsed.hour, parsed.minute), use24Hour) : null;
  const popoverWidth = use24Hour ? 'w-[220px]' : 'w-[248px]';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel ?? 'Pick time'}
          className={cn(
            'flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !display && 'text-muted-foreground',
            triggerClassName,
            className,
          )}
        >
          <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="tabular-nums">{display ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('border-border bg-popover p-3', popoverWidth)}
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <TimePickerColumnsPanel
          use24Hour={use24Hour}
          alignId={alignId}
          minutes={minutes}
          draftHour24={draftHour24}
          draftHour12={draftHour12}
          draftMinute={draftMinute}
          draftPeriod={draftPeriod}
          onHour24Select={(hour) => {
            setDraftHour24(hour);
            applyDraft(hour, draftMinute, false);
          }}
          onHour12Select={(hour12) => {
            setDraftHour12(hour12);
            applyDraft(hour12To24(hour12, draftPeriod), draftMinute, false);
          }}
          onMinuteSelect={(minute) => {
            setDraftMinute(minute);
            applyDraft(resolvedHour24, minute, !use24Hour);
          }}
          onPeriodSelect={(period) => {
            setDraftPeriod(period);
            applyDraft(hour12To24(draftHour12, period), draftMinute, false);
          }}
        />
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full bg-brand-primary hover:bg-brand-primary-hover"
          onClick={() => applyDraft(resolvedHour24, draftMinute, true)}
        >
          Done
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default TimePickerField;
