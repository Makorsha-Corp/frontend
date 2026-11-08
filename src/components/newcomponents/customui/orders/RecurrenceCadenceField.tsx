import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { cn } from '@/lib/utils';
import {
  DEFAULT_RECURRENCE_CADENCE,
  formatRecurrenceCadenceTriggerLabel,
  type WorkOrderRecurrenceCadence,
  type WorkOrderRecurrenceCadenceValue,
} from '@/pages/newpages/orders/workOrderRecurrenceCadence';

export type { WorkOrderRecurrenceCadenceValue };

const PRESET_OPTIONS: { value: Exclude<WorkOrderRecurrenceCadence, 'custom'>; label: string }[] =
  [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

/** Shared compact h-9 control — matches sheet recurrence row. */
export const recurrenceRowControlClassName =
  'h-9 min-w-[5.25rem] max-w-[7.5rem] shrink-0 px-1.5 text-xs font-medium truncate';

interface RecurrenceCadenceFieldProps {
  value: WorkOrderRecurrenceCadenceValue;
  onChange: (value: WorkOrderRecurrenceCadenceValue) => void;
  disabled?: boolean;
  className?: string;
}

export function RecurrenceCadenceField({
  value,
  onChange,
  disabled = false,
  className,
}: RecurrenceCadenceFieldProps) {
  const [open, setOpen] = useState(false);
  const [draftInterval, setDraftInterval] = useState(String(value.intervalDays));

  const triggerLabel = formatRecurrenceCadenceTriggerLabel(value);

  const applyCustomInterval = () => {
    const parsed = Number.parseInt(draftInterval, 10);
    const intervalDays = Number.isFinite(parsed) ? Math.min(90, Math.max(1, parsed)) : 2;
    onChange({ cadence: 'custom', intervalDays });
    setDraftInterval(String(intervalDays));
    setOpen(false);
  };

  return (
    <div className={cn('grid w-fit shrink-0 gap-1', className)}>
      <Label className="text-xs text-muted-foreground">Frequency</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setDraftInterval(String(value.intervalDays || DEFAULT_RECURRENCE_CADENCE.intervalDays));
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={`Frequency: ${triggerLabel}`}
            title={triggerLabel}
            className={recurrenceRowControlClassName}
          >
            <span className="truncate">{triggerLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1" align="start">
          <ul className="flex flex-col gap-0.5" role="listbox" aria-label="Frequency">
            {PRESET_OPTIONS.map((opt) => {
              const selected = value.cadence === opt.value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted',
                      selected && 'bg-muted/80 font-medium',
                    )}
                    onClick={() => {
                      onChange({ cadence: opt.value, intervalDays: value.intervalDays });
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                    {selected ? (
                      <Check className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value.cadence === 'custom'}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-muted',
                  value.cadence === 'custom' && 'bg-muted/80 font-medium',
                )}
                onClick={() => {
                  onChange({
                    cadence: 'custom',
                    intervalDays: value.intervalDays || DEFAULT_RECURRENCE_CADENCE.intervalDays,
                  });
                }}
              >
                Custom
                {value.cadence === 'custom' ? (
                  <Check className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
                ) : null}
              </button>
            </li>
          </ul>
          {value.cadence === 'custom' ? (
            <div className="mt-2 border-t border-border/60 px-2 pb-1 pt-2">
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Every N days</p>
              <div className="flex items-center gap-1.5">
                <StepNumberInput
                  min={1}
                  max={90}
                  step={1}
                  value={draftInterval}
                  onChange={(e) => setDraftInterval(e.target.value)}
                  className="h-8 flex-1 text-sm"
                  aria-label="Interval in days"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 px-2 text-xs"
                  onClick={applyCustomInterval}
                >
                  Apply
                </Button>
              </div>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
