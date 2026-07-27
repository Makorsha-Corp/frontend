import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  calendarPlannedRecurrenceModifierClassNames,
  calendarRecurrenceStartModifierClassNames,
} from '@/components/ui/calendarDayClassNames';
import { cn } from '@/lib/utils';

export interface DatePickerFieldProps {
  /** ISO date `yyyy-MM-dd` */
  value: string;
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
  /** Extra dates to highlight in the popover calendar (`yyyy-MM-dd`). */
  highlightedDates?: string[];
  /** Recurrence start date — highlighted when picking end date (`yyyy-MM-dd`). */
  recurrenceStartDate?: string;
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  triggerClassName,
  placeholder = 'Pick date',
  id,
  'aria-label': ariaLabel,
  highlightedDates = [],
  recurrenceStartDate,
}) => {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? 'Pick date'}
          className={cn(
            'justify-start border-border bg-background font-normal',
            !value && 'text-muted-foreground',
            triggerClassName,
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, 'dd.MM.yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          modifiers={calendarModifiers}
          modifiersClassNames={calendarModifierClassNames}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, 'yyyy-MM-dd'));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePickerField;
