import React from 'react';
import { format, type Locale } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

export function formatDateRangeFilterLabel(
  value: DateRangeValue,
  emptyLabel = 'All dates',
  locale?: Locale,
): string {
  const { from, to } = value;
  if (!from) return emptyLabel;
  const opts = locale ? { locale } : undefined;
  if (to) return `${format(from, 'MMM d', opts)} – ${format(to, 'MMM d', opts)}`;
  return format(from, 'MMM d', opts);
}

export interface DateRangeFilterTriggerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  emptyLabel?: string;
  triggerClassName?: string;
  align?: 'start' | 'center' | 'end';
  numberOfMonths?: 1 | 2;
}

const DateRangeFilterTrigger: React.FC<DateRangeFilterTriggerProps> = ({
  value,
  onChange,
  emptyLabel = 'All dates',
  triggerClassName,
  align = 'start',
  numberOfMonths = 2,
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          'min-w-[200px] justify-start border-border bg-background',
          appShellHeaderControlClass,
          triggerClassName,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {formatDateRangeFilterLabel(value, emptyLabel)}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align={align}>
      <Calendar
        mode="range"
        selected={{ from: value.from, to: value.to }}
        onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
        numberOfMonths={numberOfMonths}
      />
    </PopoverContent>
  </Popover>
);

export default DateRangeFilterTrigger;
