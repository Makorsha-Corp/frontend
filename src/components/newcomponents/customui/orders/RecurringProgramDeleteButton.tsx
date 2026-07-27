import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useBulkDeleteFutureRecurrenceDraftsMutation } from '@/features/workOrders/workOrdersApi';
import type { BulkDeleteFutureRecurrenceDraftsResponse } from '@/types/workOrder';
import {
  buildBulkDeleteRecurrenceConfirmMessage,
  formatRecurrenceDeleteTargetDates,
  RECURRENCE_DELETE_SCOPE_HELPER,
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';

export interface RecurringProgramDeleteButtonProps {
  program: RecurrenceProgramSummary;
  machineName: string;
  onDeleted?: (result: BulkDeleteFutureRecurrenceDraftsResponse) => void;
  size?: 'sm' | 'default';
  variant?: 'destructive' | 'outline';
  className?: string;
  /** Show delete-scope copy on hover (default true). */
  showScopeTooltip?: boolean;
}

const RecurringProgramDeleteButton: React.FC<RecurringProgramDeleteButtonProps> = ({
  program,
  machineName,
  onDeleted,
  size = 'sm',
  variant = 'outline',
  className,
  showScopeTooltip = true,
}) => {
  const [bulkDelete, { isLoading }] = useBulkDeleteFutureRecurrenceDraftsMutation();
  const [busy, setBusy] = useState(false);

  const disabled = program.futureDraftCount === 0 || isLoading || busy;
  const deleteTargetDates = formatRecurrenceDeleteTargetDates(program);

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (disabled) return;

    const confirmed = window.confirm(
      buildBulkDeleteRecurrenceConfirmMessage({
        futureDraftCount: program.futureDraftCount,
        templateName: program.templateName,
        machineName,
      }),
    );
    if (!confirmed) return;

    setBusy(true);
    try {
      const result = await bulkDelete({
        work_order_template_id: program.templateId,
        machine_id: program.machineId,
      }).unwrap();
      toast.success(
        result.deleted_count === 1
          ? '1 draft deleted'
          : `${result.deleted_count} drafts deleted`,
      );
      onDeleted?.(result);
    } catch {
      toast.error('Failed to delete remaining');
    } finally {
      setBusy(false);
    }
  };

  const button = (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={disabled}
      onClick={handleClick}
    >
      {isLoading || busy ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      )}
      Delete remaining
    </Button>
  );

  if (!showScopeTooltip) {
    return button;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" className="max-w-xs space-y-1.5 text-xs leading-snug">
          {deleteTargetDates.dates.length > 0 ? (
            <>
              <p className="font-medium text-foreground">
                {program.futureDraftCount === 1
                  ? 'Will delete 1 draft:'
                  : `Will delete ${program.futureDraftCount} drafts:`}
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-foreground">
                {deleteTargetDates.dates.map((dateLabel, index) => (
                  <li key={`${dateLabel}-${index}`}>{dateLabel}</li>
                ))}
              </ul>
              {deleteTargetDates.remainingCount > 0 ? (
                <p className="text-muted-foreground">+ {deleteTargetDates.remainingCount} more</p>
              ) : null}
            </>
          ) : null}
          <p className="text-muted-foreground">{RECURRENCE_DELETE_SCOPE_HELPER}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RecurringProgramDeleteButton;
