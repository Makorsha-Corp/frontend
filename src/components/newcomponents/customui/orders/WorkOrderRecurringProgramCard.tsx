import React, { useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { Loader2, Repeat2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  useGetWorkOrdersQuery,
} from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTemplatesQuery } from '@/features/workOrderTemplates/workOrderTemplatesApi';
import type { BulkDeleteFutureRecurrenceDraftsResponse, WorkOrder } from '@/types/workOrder';
import {
  buildRecurrenceProgramSummary,
  formatRecurrenceProgramDateLabel,
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import { formatRecurrenceCadence } from '@/pages/newpages/orders/workOrderTemplateLabels';
import RecurringProgramDeleteButton from './RecurringProgramDeleteButton';

export interface WorkOrderRecurringProgramCardProps {
  order: WorkOrder;
  machineName: string;
  onProgramChanged?: (result: BulkDeleteFutureRecurrenceDraftsResponse) => void;
}

const WorkOrderRecurringProgramCard: React.FC<WorkOrderRecurringProgramCardProps> = ({
  order,
  machineName,
  onProgramChanged,
}) => {
  const templateId = order.work_order_template_id;
  const machineId = order.machine_id;

  const { data: templates = [], isLoading: templatesLoading } = useGetWorkOrderTemplatesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
    is_active: true,
  });

  const template = useMemo(
    () => (templateId != null ? templates.find((t) => t.id === templateId) : undefined),
    [templateId, templates],
  );

  const shouldFetchProgram =
    Boolean(templateId && machineId && template?.is_recurring);

  const { data: programOrders = [], isLoading: ordersLoading } = useGetWorkOrdersQuery(
    {
      work_order_template_id: templateId ?? undefined,
      machine_id: machineId ?? undefined,
      status: 'DRAFT',
      limit: API_LIMITS.FLEXIBLE_1000,
    },
    { skip: !shouldFetchProgram },
  );

  const program = useMemo((): RecurrenceProgramSummary | null => {
    if (!templateId || !machineId || !template?.is_recurring) return null;
    const templateById = new Map([[template.id, template]]);
    return buildRecurrenceProgramSummary({
      currentOrder: order,
      allOrders: programOrders,
      templateById,
    });
  }, [order, programOrders, template, templateId, machineId]);

  if (!templateId || !machineId) return null;
  if (templatesLoading) return null;
  if (!template?.is_recurring) return null;

  const cadence = formatRecurrenceCadence(template) ?? 'Recurring';
  const isLoading = ordersLoading;
  const canDelete = order.status === 'DRAFT';

  return (
    <Card>
      <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-muted-foreground shrink-0" />
            Recurring program
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {template.template_name} · {cadence}
          </p>
        </div>
        {program && canDelete ? (
          <RecurringProgramDeleteButton
            program={program}
            machineName={machineName}
            onDeleted={onProgramChanged}
            className="shrink-0"
          />
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading program drafts…
          </div>
        ) : !program || program.allDrafts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No draft orders in this program.</p>
        ) : (
          <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {program.allDrafts.map((draft) => {
              const isFuture = draft.isFuture;
              const isToday =
                draft.plannedDate === format(startOfDay(new Date()), 'yyyy-MM-dd');
              return (
                <li
                  key={draft.workOrderId}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-sm',
                    draft.isCurrentRow && 'border-violet-500/40 bg-violet-500/5',
                  )}
                >
                  <span className="font-medium">{formatRecurrenceProgramDateLabel(draft.plannedDate)}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {draft.isCurrentRow ? (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                        This order
                      </Badge>
                    ) : null}
                    {isFuture ? (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                        Future
                      </Badge>
                    ) : isToday ? (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                        Today
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
                        Past
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {program && program.futureDraftCount > 0 && !canDelete ? (
          <p className="text-xs text-muted-foreground mt-3">
            {program.futureDraftCount} future draft{program.futureDraftCount === 1 ? '' : 's'} in this program.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default WorkOrderRecurringProgramCard;
