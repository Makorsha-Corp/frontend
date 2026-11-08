import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import DatePickerField from '@/components/newcomponents/customui/DatePickerField';
import {
  RecurrenceCadenceField,
} from '@/components/newcomponents/customui/orders/RecurrenceCadenceField';
import {
  formatRecurrenceCadenceShortLabel,
  type WorkOrderRecurrenceCadenceValue,
} from '@/pages/newpages/orders/workOrderRecurrenceCadence';
import {
  formatPlannedRecurrenceChip,
  listPlannedRecurrenceDates,
} from '@/pages/newpages/orders/workOrderRecurrenceDates';

export type ProductionRunRecurrenceCadence = WorkOrderRecurrenceCadenceValue;

interface ProductionRunRecurrenceFieldsProps {
  cadence: ProductionRunRecurrenceCadence;
  onCadenceChange: (value: ProductionRunRecurrenceCadence) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  /** datetime-local planned start; date part is the first run. */
  plannedStart: string;
}

export function ProductionRunRecurrenceFields({
  cadence,
  onCadenceChange,
  endDate,
  onEndDateChange,
  plannedStart,
}: ProductionRunRecurrenceFieldsProps) {
  const startDate = plannedStart.slice(0, 10);
  const intervalDays = cadence.cadence === 'custom' ? cadence.intervalDays : undefined;
  const plannedDates =
    startDate && endDate
      ? listPlannedRecurrenceDates(startDate, endDate, cadence.cadence, intervalDays)
      : [];
  const cadenceLabel = formatRecurrenceCadenceShortLabel(cadence.cadence, cadence.intervalDays);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Planned start is the first run. End date schedules drafts through that day (max 6 months).
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <RecurrenceCadenceField
          value={cadence}
          onChange={onCadenceChange}
          className="min-w-[8.5rem] flex-1"
        />
        <div className="grid min-w-[11rem] flex-1 gap-1">
          <Label className="text-xs text-muted-foreground">Recurrence end (max 6 months)</Label>
          <DatePickerField
            value={endDate}
            onChange={onEndDateChange}
            highlightedDates={plannedDates}
            recurrenceStartDate={startDate || undefined}
            placeholder="Pick end date"
            triggerClassName="h-9 w-full px-3 text-sm"
            aria-label="Recurrence end date"
          />
        </div>
      </div>
      <div
        className="flex min-h-9 min-w-0 items-center gap-2 rounded-md border border-border/70 bg-muted/25 px-2 py-1 text-xs text-muted-foreground"
        title={plannedDates.map(formatPlannedRecurrenceChip).join(' · ') || undefined}
      >
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden />
        {plannedDates.length > 0 ? (
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1">
            <span className="shrink-0 font-medium text-foreground">{cadenceLabel}</span>
            <span className="shrink-0">·</span>
            <span className="shrink-0">{plannedDates.length} planned</span>
            <span className="shrink-0">·</span>
            {plannedDates.map((iso) => (
              <Badge
                key={iso}
                variant="outline"
                className="h-6 shrink-0 border-brand-primary/30 bg-brand-primary/10 px-1.5 text-[10px] font-normal text-brand-primary"
              >
                {formatPlannedRecurrenceChip(iso)}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="truncate">Set an end date to preview recurring runs.</p>
        )}
      </div>
    </div>
  );
}
