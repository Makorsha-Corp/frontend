import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useGetWorkOrderProgramsQuery,
  useStopWorkOrderProgramMutation,
} from '@/features/workOrders/workOrdersApi';
import type { Machine } from '@/types/machine';
import type { WorkOrderProgram, WorkOrderProgramOccurrence } from '@/types/workOrderProgram';
import { appToast } from '@/lib/appToast';
import { ChevronDown, ChevronRight, Loader2, Search } from 'lucide-react';
import { formatRecurrenceProgramDateLabel } from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import { formatRecurrenceCadenceShortLabel } from '@/pages/newpages/orders/workOrderRecurrenceCadence';

export interface RecurringProgramsManagerTabProps {
  enabled: boolean;
  factoryId?: number | null;
  machineId?: number | null;
  machinesInScope: Machine[];
  onProgramsChanged?: () => void;
  onOpenWorkOrder?: (workOrderId: number) => void;
}

function programCadenceLabel(program: WorkOrderProgram): string {
  return formatRecurrenceCadenceShortLabel(program.cadence, program.interval_days);
}

function formatRange(program: WorkOrderProgram): string {
  const start = format(parseISO(program.start_date.slice(0, 10)), 'MMM d, yyyy');
  const end = format(parseISO(program.end_date.slice(0, 10)), 'MMM d, yyyy');
  return `${start} – ${end}`;
}

function ProgramTimeline({
  occurrences,
  onOpenWorkOrder,
}: {
  occurrences: WorkOrderProgramOccurrence[];
  onOpenWorkOrder?: (workOrderId: number) => void;
}) {
  const sections: Array<{ label: string; entries: WorkOrderProgramOccurrence[] }> = [
    { label: 'Completed', entries: occurrences.filter((row) => row.status === 'completed') },
    { label: 'Active', entries: occurrences.filter((row) => row.status === 'in_progress') },
    { label: 'Upcoming', entries: occurrences.filter((row) => row.status === 'draft') },
  ];

  const visible = sections.some((section) => section.entries.length > 0);
  if (!visible) {
    return (
      <p className="border-t border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        No open work orders in this program.
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-border/60 bg-muted/20 px-4 py-3">
      {sections.map((section) =>
        section.entries.length > 0 ? (
          <div key={section.label}>
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </div>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {section.entries.map((entry) => (
                <li key={entry.work_order_id}>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md border border-border/60 bg-background px-2 py-0.5 text-xs text-muted-foreground',
                      'transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    onClick={() => onOpenWorkOrder?.(entry.work_order_id)}
                  >
                    {entry.planned_date
                      ? formatRecurrenceProgramDateLabel(entry.planned_date)
                      : entry.work_order_number}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </div>
  );
}

const RecurringProgramsManagerTab: React.FC<RecurringProgramsManagerTabProps> = ({
  enabled,
  factoryId,
  machineId,
  machinesInScope,
  onProgramsChanged,
  onOpenWorkOrder,
}) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [stoppingId, setStoppingId] = useState<number | null>(null);

  const machineNameById = useMemo(
    () => new Map(machinesInScope.map((m) => [m.id, m.name])),
    [machinesInScope],
  );

  const { data: programs = [], isLoading, error } = useGetWorkOrderProgramsQuery(
    { factory_id: factoryId! },
    { skip: !enabled || factoryId == null },
  );
  const [stopProgram] = useStopWorkOrderProgramMutation();

  const scopedPrograms = useMemo(() => {
    let rows = programs;
    if (machineId != null) {
      rows = rows.filter((program) => program.machine_id === machineId);
    }
    return [...rows].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return b.start_date.localeCompare(a.start_date);
    });
  }, [programs, machineId]);

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scopedPrograms;
    return scopedPrograms.filter((program) => {
      const machineName = machineNameById.get(program.machine_id) ?? '';
      return (
        program.title.toLowerCase().includes(q) ||
        machineName.toLowerCase().includes(q) ||
        program.cadence.toLowerCase().includes(q)
      );
    });
  }, [scopedPrograms, search, machineNameById]);

  async function handleStop(program: WorkOrderProgram) {
    if (stoppingId != null || program.status !== 'active') return;
    const machineName = machineNameById.get(program.machine_id) ?? `Machine #${program.machine_id}`;
    const confirmed = window.confirm(
      `${program.title} · ${machineName}\n\nStop this program? Upcoming drafts after today will be removed. Active and completed work orders stay.`,
    );
    if (!confirmed) return;
    setStoppingId(program.id);
    try {
      await stopProgram(program.id).unwrap();
      appToast.success('Program stopped');
      onProgramsChanged?.();
    } catch {
      appToast.error('Failed to stop program');
    } finally {
      setStoppingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-sm text-destructive">
        Failed to load programs
      </div>
    );
  }

  if (scopedPrograms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">No recurring programs in this view</p>
        <p className="mt-1 text-xs text-muted-foreground">
          On Add work, turn on Recurring, set frequency and end date, then save the row.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="relative shrink-0">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search programs…"
          className="h-9 pl-8"
          autoComplete="off"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
        {filteredPrograms.length === 0 ? (
          <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
            No programs match your search
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPrograms.map((program) => {
              const expanded = expandedId === program.id;
              const occurrences = program.occurrences ?? [];
              const completed = occurrences.filter((row) => row.status === 'completed').length;
              const active = occurrences.filter((row) => row.status === 'in_progress').length;
              const upcoming = occurrences.filter((row) => row.status === 'draft').length;
              const machineName = machineNameById.get(program.machine_id) ?? `Machine #${program.machine_id}`;

              return (
                <div key={program.id}>
                  <div
                    className={cn(
                      'flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40',
                      expanded && 'bg-muted/20',
                    )}
                    onClick={() => setExpandedId(expanded ? null : program.id)}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      {expanded ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">
                          {program.title} · {machineName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {programCadenceLabel(program)}
                          {' · '}
                          {formatRange(program)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {program.status === 'stopped' ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                              Stopped
                            </Badge>
                          ) : null}
                          {completed > 0 ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                              {completed} completed
                            </Badge>
                          ) : null}
                          {active > 0 ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                              {active} active
                            </Badge>
                          ) : null}
                          {upcoming > 0 ? (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                              {upcoming} upcoming
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {program.status === 'active' ? (
                      <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={stoppingId != null}
                          onClick={() => void handleStop(program)}
                        >
                          {stoppingId === program.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Stop
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {expanded ? (
                    <ProgramTimeline occurrences={occurrences} onOpenWorkOrder={onOpenWorkOrder} />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringProgramsManagerTab;
