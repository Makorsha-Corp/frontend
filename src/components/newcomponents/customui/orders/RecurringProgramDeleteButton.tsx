import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { useBulkDeleteFutureRecurrenceDraftsMutation } from '@/features/workOrders/workOrdersApi';
import type { BulkDeleteFutureRecurrenceDraftsResponse } from '@/types/workOrder';
import {
  buildBulkDeleteRecurrenceConfirmMessage,
  type RecurrenceProgramSummary,
} from '@/pages/newpages/orders/workOrderRecurrenceProgram';

export interface RecurringProgramDeleteButtonProps {
  program: RecurrenceProgramSummary;
  machineName: string;
  onDeleted?: (result: BulkDeleteFutureRecurrenceDraftsResponse) => void;
  size?: 'sm' | 'default';
  variant?: 'destructive' | 'outline';
  className?: string;
}

const RecurringProgramDeleteButton: React.FC<RecurringProgramDeleteButtonProps> = ({
  program,
  machineName,
  onDeleted,
  size = 'sm',
  variant = 'outline',
  className,
}) => {
  const [bulkDelete, { isLoading }] = useBulkDeleteFutureRecurrenceDraftsMutation();
  const [busy, setBusy] = useState(false);

  const disabled = program.futureDraftCount === 0 || isLoading || busy;

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
      toast.error('Failed to delete remaining drafts');
    } finally {
      setBusy(false);
    }
  };

  return (
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
      Delete remaining drafts
    </Button>
  );
};

export default RecurringProgramDeleteButton;
