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
import { cn } from '@/lib/utils';

export interface WorkProgramSummaryStripProps {
  template: WorkOrderTemplate;
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
  template,
  machines = [],
  sections = [],
  className,
  compact = false,
  recurrenceStartIso,
  recurrenceEndIso,
}) => {
  if (!template.is_recurring) return null;

  const summary = formatProgramSummaryStrip(template, machines, sections);
  const cadence = formatRecurrenceCadence(template) ?? 'Recurring';
  const plannedDates =
    recurrenceStartIso && recurrenceEndIso
      ? listPlannedRecurrenceDates(
          recurrenceStartIso,
          recurrenceEndIso,
          template.recurrence_type,
        )
      : [];

  return (
    <div
      className={cn(
        'flex min-w-0 gap-2 rounded-md border border-border/70 bg-muted/25 text-xs text-muted-foreground',
        compact ? 'h-9 items-center px-2' : 'items-start px-3 py-2',
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
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
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
        <p className="min-w-0 truncate leading-4">{summary}</p>
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
