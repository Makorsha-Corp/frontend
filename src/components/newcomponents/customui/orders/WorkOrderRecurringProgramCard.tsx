import React, { useMemo, useState } from 'react';
import { Loader2, Repeat2 } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTemplatesQuery } from '@/features/workOrderTemplates/workOrderTemplatesApi';
import type { WorkOrder } from '@/types/workOrder';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import {
  buildRecurrenceProgramSummary,
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';
import { formatRecurrenceCadence } from '@/pages/newpages/orders/workOrderTemplateLabels';
import { RecurrenceProgramPopoverSections } from './RecurrenceProgramPopoverSections';

/** Detail header meta badges — ~20% larger than original 10px chips. */
export const workOrderDetailHeaderBadgeClass =
  'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-normal leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const workOrderDetailHeaderBadgeAmberClass = cn(
  workOrderDetailHeaderBadgeClass,
  'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400',
);

export const workOrderDetailHeaderBadgeVioletClass = cn(
  workOrderDetailHeaderBadgeClass,
  'border-violet-500/40 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 dark:text-violet-400',
);

export interface WorkOrderRecurringProgramState {
  template: WorkOrderTemplate;
  cadence: string;
  program: RecurrenceProgramSummary | null;
  isLoading: boolean;
}

export function useWorkOrderRecurringProgram(order: WorkOrder): WorkOrderRecurringProgramState | null {
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

  const shouldFetchProgram = Boolean(templateId && machineId && template?.is_recurring);

  const { data: programOrders = [], isLoading: ordersLoading } = useGetWorkOrdersQuery(
    {
      work_order_template_id: templateId ?? undefined,
      machine_id: machineId ?? undefined,
      limit: 100,
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

  if (!templateId || !machineId || templatesLoading || !template?.is_recurring) {
    return null;
  }

  return {
    template,
    cadence: formatRecurrenceCadence(template) ?? 'Recurring',
    program,
    isLoading: ordersLoading,
  };
}

export interface WorkOrderRecurringProgramBadgeProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  templateName: string;
  cadence: string;
}

export const WorkOrderRecurringProgramBadge = React.forwardRef<
  HTMLButtonElement,
  WorkOrderRecurringProgramBadgeProps
>(function WorkOrderRecurringProgramBadge(
  { templateName, cadence, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={`Recurring program — ${templateName}, ${cadence}. Click for details.`}
      title={`${templateName} · ${cadence}`}
      className={cn(workOrderDetailHeaderBadgeVioletClass, className)}
      {...props}
    >
      <Repeat2 className="h-3 w-3 shrink-0" aria-hidden />
      {cadence}
    </button>
  );
});

export interface WorkOrderRecurringProgramPopoverProps {
  order: WorkOrder;
  machineName: string;
  programState: WorkOrderRecurringProgramState;
  onOccurrenceClick?: (workOrderId: number) => void;
}

export function WorkOrderRecurringProgramPopover({
  order,
  machineName,
  programState,
  onOccurrenceClick,
}: WorkOrderRecurringProgramPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleOccurrenceClick = (workOrderId: number) => {
    setOpen(false);
    onOccurrenceClick?.(workOrderId);
  };

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <WorkOrderRecurringProgramBadge
          templateName={programState.template.template_name}
          cadence={programState.cadence}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        align="end"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onClick={(event) => event.stopPropagation()}
      >
        <WorkOrderRecurringProgramPanel
          order={order}
          machineName={machineName}
          programState={programState}
          onOccurrenceClick={onOccurrenceClick ? handleOccurrenceClick : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface WorkOrderRecurringProgramPanelProps {
  order: WorkOrder;
  machineName: string;
  programState: WorkOrderRecurringProgramState;
  onOccurrenceClick?: (workOrderId: number) => void;
}

export function WorkOrderRecurringProgramPanel({
  order: _order,
  machineName: _machineName,
  programState,
  onOccurrenceClick,
}: WorkOrderRecurringProgramPanelProps) {
  const { template, cadence, program, isLoading } = programState;

  return (
    <div className="space-y-3">
      <div className="min-w-0 pr-2">
        <p className="text-sm font-medium text-foreground">Recurring program</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground break-words">
          {template.template_name} · {cadence}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading program…
        </div>
      ) : !program ? (
        <p className="text-sm text-muted-foreground">No program data.</p>
      ) : (
        <RecurrenceProgramPopoverSections
          program={program}
          variant="detailed"
          onOccurrenceClick={onOccurrenceClick}
        />
      )}

      {program && program.futureDraftCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {program.futureDraftCount} future draft{program.futureDraftCount === 1 ? '' : 's'} in this program.
        </p>
      ) : null}
    </div>
  );
}

export interface WorkOrderRecurringProgramCardProps {
  order: WorkOrder;
  machineName: string;
}

/** @deprecated Use badge + panel in WorkOrderDetailPanel instead. Kept for any legacy imports. */
const WorkOrderRecurringProgramCard: React.FC<WorkOrderRecurringProgramCardProps> = (props) => {
  const programState = useWorkOrderRecurringProgram(props.order);
  if (!programState) return null;
  return (
    <WorkOrderRecurringProgramPanel
      order={props.order}
      machineName={props.machineName}
      programState={programState}
    />
  );
};

export default WorkOrderRecurringProgramCard;
