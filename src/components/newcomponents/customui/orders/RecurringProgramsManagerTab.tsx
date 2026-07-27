import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTemplatesQuery } from '@/features/workOrderTemplates/workOrderTemplatesApi';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Machine } from '@/types/machine';
import {
  buildRecurringProgramList,
  formatRecurrenceProgramDateLabel,
  type RecurrenceProgramSummary,
  type RecurringProgramListItem,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import RecurringProgramDeleteButton from './RecurringProgramDeleteButton';
import { ChevronDown, ChevronRight, Loader2, Pencil, Repeat2, Search } from 'lucide-react';

export interface RecurringProgramsManagerTabProps {
  enabled: boolean;
  factoryId?: number | null;
  machineId?: number | null;
  machinesInScope: Machine[];
  onEditTemplate: (template: WorkOrderTemplate) => void;
  onProgramsChanged?: () => void;
  onOpenWorkOrder?: (workOrderId: number) => void;
}

function programRowKey(item: RecurringProgramListItem): string {
  return `${item.templateId}:${item.machineId}`;
}

function searchPrograms(items: RecurringProgramListItem[], query: string): RecurringProgramListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.templateName.toLowerCase().includes(q) ||
      item.machineName.toLowerCase().includes(q) ||
      item.cadence.toLowerCase().includes(q),
  );
}

function ProgramTimeline({
  summary,
  onOpenWorkOrder,
}: {
  summary: RecurrenceProgramSummary;
  onOpenWorkOrder?: (workOrderId: number) => void;
}) {
  const sections: Array<{
    label: string;
    entries: Array<{ workOrderId: number; displayDate: string }>;
  }> = [
    {
      label: 'Completed',
      entries: summary.completedOccurrences.map((o) => ({
        workOrderId: o.workOrderId,
        displayDate: o.displayDate,
      })),
    },
    {
      label: 'Active',
      entries: summary.inProgressOccurrences.map((o) => ({
        workOrderId: o.workOrderId,
        displayDate: o.displayDate,
      })),
    },
    {
      label: 'Upcoming',
      entries: summary.futureDrafts.map((d) => ({
        workOrderId: d.workOrderId,
        displayDate: d.plannedDate,
      })),
    },
  ];

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
                <li key={`${section.label}-${entry.workOrderId}`}>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md border border-border/60 bg-background px-2 py-0.5 text-xs text-muted-foreground',
                      'transition-colors hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    onClick={() => onOpenWorkOrder?.(entry.workOrderId)}
                  >
                    {formatRecurrenceProgramDateLabel(entry.displayDate)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {summary.completedOccurrences.length === 0 &&
      summary.inProgressOccurrences.length === 0 &&
      summary.futureDraftCount === 0 ? (
        <p className="text-xs text-muted-foreground">No occurrences in this program.</p>
      ) : null}
    </div>
  );
}

const RecurringProgramsManagerTab: React.FC<RecurringProgramsManagerTabProps> = ({
  enabled,
  factoryId,
  machineId,
  machinesInScope,
  onEditTemplate,
  onProgramsChanged,
  onOpenWorkOrder,
}) => {
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const machineIdsInScope = useMemo(
    () => (machinesInScope.length > 0 ? new Set(machinesInScope.map((m) => m.id)) : undefined),
    [machinesInScope],
  );

  const machineNameById = useMemo(
    () => new Map(machinesInScope.map((m) => [m.id, m.name])),
    [machinesInScope],
  );

  const { data: templates = [], isLoading: templatesLoading } = useGetWorkOrderTemplatesQuery(
    { is_active: true, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !enabled },
  );

  const { data: orders = [], isLoading: ordersLoading } = useGetWorkOrdersQuery(
    {
      factory_id: factoryId ?? undefined,
      machine_id: machineId ?? undefined,
      limit: API_LIMITS.FLEXIBLE_1000,
    },
    { skip: !enabled },
  );

  const recurringTemplateCount = useMemo(
    () => templates.filter((t) => t.is_recurring).length,
    [templates],
  );

  const programs = useMemo(
    () =>
      buildRecurringProgramList({
        orders,
        templates,
        machineNameById,
        machineIdsInScope,
      }),
    [orders, templates, machineNameById, machineIdsInScope],
  );

  const filteredPrograms = useMemo(() => searchPrograms(programs, search), [programs, search]);
  const isLoading = templatesLoading || ordersLoading;

  const toggleExpanded = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (recurringTemplateCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
        <Repeat2 className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No recurring templates yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create one with Templates in the header and turn on recurrence.
        </p>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
        <Repeat2 className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No recurring programs in this view</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Save recurrence from the sheet to generate drafts for a machine.
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
            {filteredPrograms.map((item) => {
              const key = programRowKey(item);
              const expanded = expandedKey === key;
              const { summary } = item;

              return (
                <div key={key}>
                  <div
                    className={cn(
                      'flex cursor-pointer items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/40',
                      expanded && 'bg-muted/20',
                    )}
                    onClick={() => toggleExpanded(key)}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      {expanded ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">
                          {item.templateName} · {item.machineName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.cadence}
                          {item.recurrenceRange ? ` · ${item.recurrenceRange}` : ''}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {summary.completedOccurrences.length > 0 ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                              {summary.completedOccurrences.length} completed
                            </Badge>
                          ) : null}
                          {summary.inProgressOccurrences.length > 0 ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                              {summary.inProgressOccurrences.length} active
                            </Badge>
                          ) : null}
                          {summary.futureDraftCount > 0 ? (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                              {summary.futureDraftCount} upcoming
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onEditTemplate(item.template)}
                        title="Edit template"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <RecurringProgramDeleteButton
                        program={summary}
                        machineName={item.machineName}
                        onDeleted={() => onProgramsChanged?.()}
                      />
                    </div>
                  </div>
                  {expanded ? (
                    <ProgramTimeline summary={summary} onOpenWorkOrder={onOpenWorkOrder} />
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
