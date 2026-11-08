import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import {
  formatPlannedRecurrenceChip,
  listPlannedRecurrenceDates,
} from '@/pages/newpages/orders/workOrderRecurrenceDates';
import {
  formatProgramSummaryStrip,
  formatRecurrenceCadence,
} from '@/pages/newpages/orders/workOrderTemplateLabels';
import { formatRecurrenceCadenceShortLabel } from '@/pages/newpages/orders/workOrderRecurrenceCadence';
import { cn } from '@/lib/utils';

export interface WorkProgramSummaryStripProps {
  template?: WorkOrderTemplate | null;
  /** Sheet row cadence when recurring is toggled without a template. */
  recurrenceType?: string | null;
  recurrenceIntervalDays?: number | null;
  machines?: Machine[];
  sections?: FactorySection[];
  className?: string;
  /** Match h-9 date pickers in footer rows. */
  compact?: boolean;
  /** When set, show scrollable planned date chips instead of generic copy. */
  recurrenceStartIso?: string | null;
  recurrenceEndIso?: string | null;
}

const WorkProgramSummaryStrip: React.FC<WorkProgramSummaryStripProps> = ({
  template = null,
  recurrenceType = null,
  recurrenceIntervalDays = null,
  machines = [],
  sections = [],
  className,
  compact = false,
  recurrenceStartIso,
  recurrenceEndIso,
}) => {
  const effectiveType = recurrenceType ?? template?.recurrence_type;
  if (!recurrenceType && !template?.is_recurring) return null;

  const summary = template
    ? formatProgramSummaryStrip(template, machines, sections)
    : 'Recurring work';
  const cadence = effectiveType
    ? formatRecurrenceCadenceShortLabel(effectiveType, recurrenceIntervalDays)
    : (template ? formatRecurrenceCadence(template) : null) ?? 'Recurring';
  const plannedDates =
    recurrenceStartIso && recurrenceEndIso && effectiveType
      ? listPlannedRecurrenceDates(
          recurrenceStartIso,
          recurrenceEndIso,
          effectiveType,
          effectiveType === 'custom' ? recurrenceIntervalDays : undefined,
        )
      : [];

  return (
    <div
      className={cn(
        'flex min-w-0 gap-2 rounded-md border border-border/70 bg-muted/25 text-xs text-muted-foreground',
        compact ? 'min-h-9 items-center px-2 py-1' : 'items-start px-3 py-2',
        className,
      )}
      title={
        plannedDates.length
          ? plannedDates.map(formatPlannedRecurrenceChip).join(' · ')
          : summary
      }
    >
      <CalendarClock
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-brand-primary',
          compact ? undefined : 'mt-0.5',
        )}
        aria-hidden
      />
      {plannedDates.length > 0 ? (
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5">
          <span className="shrink-0 font-medium text-foreground">{cadence}</span>
          <span className="shrink-0 text-muted-foreground">·</span>
          <span className="shrink-0 text-muted-foreground">
            {plannedDates.length} planned
          </span>
          <span className="shrink-0 text-muted-foreground">·</span>
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
      ) : compact ? (
        <p className="min-w-0 truncate leading-4">
          {recurrenceStartIso && !recurrenceEndIso
            ? 'Pick end date to preview planned dates'
            : recurrenceStartIso && recurrenceEndIso && effectiveType
              ? `${cadence} · set a valid date range`
              : summary}
        </p>
      ) : (
        <p>
          <span className="font-medium text-foreground">Recurring work — </span>
          {summary}
        </p>
      )}
    </div>
  );
};

export default WorkProgramSummaryStrip;
