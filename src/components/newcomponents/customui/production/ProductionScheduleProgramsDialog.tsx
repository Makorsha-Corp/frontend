import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight, Loader2, Plus, Repeat2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useGetProductionBatchProgramsQuery,
  useGetProductionFormulasQuery,
  useStopProductionBatchProgramMutation,
} from '@/features/production/productionApi';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import { appToast } from '@/lib/appToast';
import { cn } from '@/lib/utils';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';
import { formatRecurrenceCadenceShortLabel } from '@/pages/newpages/orders/workOrderRecurrenceCadence';
import type { ProductionBatchProgram, ProductionBatchProgramOccurrence } from '@/types/production';
import { apiErrorDetail } from '@/utils/apiError';

function programCadenceLabel(program: ProductionBatchProgram): string {
  return formatRecurrenceCadenceShortLabel(program.cadence, program.interval_days);
}

const STOP_CONFIRM =
  'Stop this program? Draft batches will be cancelled. Started and completed batches stay.';

interface ProductionScheduleProgramsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number | null;
  factoryNameById?: Map<number, string>;
  onCreateRecurring?: () => void;
  onOpenBatch?: (batchId: number, plannedStart: Date | null) => void;
}

function formatProgramStart(iso: string, use24Hour: boolean): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return iso;
  const hm = `${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
  return `${format(when, 'MMM d, yyyy')} ${formatWallTimeHm(hm, use24Hour)}`;
}

function formatEndDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return format(new Date(year, month - 1, day), 'MMM d, yyyy');
}

function occurrenceDate(iso: string | null): Date | null {
  if (!iso) return null;
  const when = parseISO(iso);
  return Number.isNaN(when.getTime()) ? null : when;
}

function occurrenceLabel(occurrence: ProductionBatchProgramOccurrence, use24Hour: boolean): string {
  if (!occurrence.planned_start_at) return occurrence.batch_number;
  return formatProgramStart(occurrence.planned_start_at, use24Hour);
}

function ProgramTimeline({
  occurrences,
  use24Hour,
  onOpenBatch,
}: {
  occurrences: ProductionBatchProgramOccurrence[];
  use24Hour: boolean;
  onOpenBatch?: (batchId: number, plannedStart: Date | null) => void;
}) {
  const sections: Array<{ label: string; entries: ProductionBatchProgramOccurrence[] }> = [
    { label: 'Completed', entries: occurrences.filter((row) => row.status === 'completed') },
    { label: 'Active', entries: occurrences.filter((row) => row.status === 'in_progress') },
    {
      label: 'Upcoming',
      entries: occurrences.filter((row) => row.status === 'recurring' || row.status === 'draft'),
    },
  ];
  const visible = sections.some((section) => section.entries.length > 0);

  if (!visible) {
    return (
      <p className="border-t border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        No open batches in this program.
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
                <li key={entry.batch_id}>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md border border-border/60 bg-background px-2 py-0.5 text-xs text-muted-foreground',
                      'transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    onClick={() => onOpenBatch?.(entry.batch_id, occurrenceDate(entry.planned_start_at))}
                  >
                    {occurrenceLabel(entry, use24Hour)}
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

export function ProductionScheduleProgramsDialog({
  open,
  onOpenChange,
  factoryId,
  factoryNameById,
  onCreateRecurring,
  onOpenBatch,
}: ProductionScheduleProgramsDialogProps) {
  const { use24Hour } = useUserTimeFormat();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [stoppingId, setStoppingId] = useState<number | null>(null);

  const { data: programs = [], isLoading, error } = useGetProductionBatchProgramsQuery(
    { factory_id: factoryId ?? undefined },
    { skip: !open },
  );
  const { data: formulas = [] } = useGetProductionFormulasQuery(
    { skip: 0, limit: 100, active_only: false },
    { skip: !open },
  );
  const [stopProgram] = useStopProductionBatchProgramMutation();

  const formulaNameById = useMemo(() => {
    const names = new Map<number, string>();
    for (const formula of formulas) names.set(formula.id, formula.name);
    return names;
  }, [formulas]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = [...programs].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return b.first_start_at.localeCompare(a.first_start_at);
    });
    if (!query) return rows;
    return rows.filter((program) => {
      const name = formulaNameById.get(program.formula_id) ?? '';
      const cadence = programCadenceLabel(program);
      return (
        name.toLowerCase().includes(query) ||
        cadence.toLowerCase().includes(query) ||
        program.status.includes(query)
      );
    });
  }, [programs, search, formulaNameById]);

  async function handleStop(program: ProductionBatchProgram) {
    if (stoppingId != null) return;
    const name = formulaNameById.get(program.formula_id) ?? 'this recipe';
    const confirmed = window.confirm(`${name}\n\n${STOP_CONFIRM}`);
    if (!confirmed) return;
    setStoppingId(program.id);
    try {
      await stopProgram(program.id).unwrap();
      appToast.success('Program stopped');
    } catch (stopError) {
      appToast.error(apiErrorDetail(stopError, 'Failed to stop program'));
    } finally {
      setStoppingId(null);
    }
  }

  function openOccurrence(batchId: number, plannedStart: Date | null) {
    onOpenChange(false);
    onOpenBatch?.(batchId, plannedStart);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(70vh,640px)] w-[min(48rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border py-4 pl-6 pr-14">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Repeat2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                Recurring programs
              </DialogTitle>
              <DialogDescription>
                {factoryId != null
                  ? 'Repeating runs for this factory. Stop a program to cancel its draft batches.'
                  : 'Repeating runs across all factories. Stop a program to cancel its draft batches.'}
              </DialogDescription>
            </div>
            {onCreateRecurring ? (
              <Button
                type="button"
                size="sm"
                className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
                onClick={onCreateRecurring}
              >
                <Plus className="mr-1 h-4 w-4" />
                New recurring run
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{apiErrorDetail(error, 'Failed to load programs')}</p>
          ) : programs.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
              <Repeat2 className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No recurring programs yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use New recurring run, pick a recipe, and set the first start and end date.
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <div className="relative shrink-0">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search programs…"
                  className="h-9 pl-8"
                  autoComplete="off"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center px-4 py-10 text-sm text-muted-foreground">
                    No programs match your search
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filtered.map((program) => {
                      const expanded = expandedId === program.id;
                      const occurrences = program.occurrences ?? [];
                      const completed = occurrences.filter((row) => row.status === 'completed').length;
                      const active = occurrences.filter((row) => row.status === 'in_progress').length;
                      const upcoming = occurrences.filter(
                        (row) => row.status === 'recurring' || row.status === 'draft',
                      ).length;
                      const name = formulaNameById.get(program.formula_id) ?? `Recipe #${program.formula_id}`;
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
                                <p className="truncate text-sm font-medium text-card-foreground">{name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {factoryId == null && factoryNameById
                                    ? `${factoryNameById.get(program.factory_id) ?? 'Factory'} · `
                                    : ''}
                                  {programCadenceLabel(program)}
                                  {' · '}
                                  {formatProgramStart(program.first_start_at, use24Hour)}
                                  {' – '}
                                  {formatEndDate(program.end_date)}
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
                                  {occurrences.length === 0 ? (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                                      {program.batch_count} {program.batch_count === 1 ? 'batch' : 'batches'}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            {program.status === 'active' ? (
                              <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
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
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[14rem] text-xs leading-snug">
                                      Cancels draft batches. Started and completed runs stay.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            ) : null}
                          </div>
                          {expanded ? (
                            <ProgramTimeline
                              occurrences={occurrences}
                              use24Hour={use24Hour}
                              onOpenBatch={openOccurrence}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex shrink-0 flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {programs.length} program{programs.length === 1 ? '' : 's'}
          </p>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
