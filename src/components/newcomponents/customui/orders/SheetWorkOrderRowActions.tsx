import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { appToast } from '@/lib/appToast';
import CompleteWorkOrderDialog from '@/components/newcomponents/customui/orders/CompleteWorkOrderDialog';
import {
  useApproveWorkOrderMutation,
  useCompleteWorkOrderMutation,
  useCompleteWorkOrderAsPlannedMutation,
  useStartWorkOrderMutation,
  useUnapproveWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import type { WorkOrderApprover, WorkOrderCompleteRequest, WorkOrderStatus } from '@/types/workOrder';
import { cn } from '@/lib/utils';
import { canCompleteWorkOrderAsPlanned } from '@/pages/newpages/orders/workOrderPlannedClose';
import { SHEET_ACTION_BTN } from './workOrderSheetTypography';

export interface SheetWorkOrderRowActionsProps {
  workOrderId: number;
  workOrderNumber: string;
  status: WorkOrderStatus;
  plannedDate?: string | null;
  approvalMet: boolean;
  machineId: number | null;
  approvers: WorkOrderApprover[];
  currentUserId: number | null;
  onOpenDetail: () => void;
  onMutated?: () => void;
  className?: string;
}

const SheetWorkOrderRowActions: React.FC<SheetWorkOrderRowActionsProps> = ({
  workOrderId,
  status,
  plannedDate,
  approvalMet,
  machineId,
  approvers,
  currentUserId,
  onMutated,
  className,
}) => {
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeAsPlannedOpen, setCompleteAsPlannedOpen] = useState(false);

  const [approveOrder, { isLoading: isApproving }] = useApproveWorkOrderMutation();
  const [unapproveOrder, { isLoading: isUnapproving }] = useUnapproveWorkOrderMutation();
  const [startOrder, { isLoading: isStarting }] = useStartWorkOrderMutation();
  const [completeOrder, { isLoading: isCompleting }] = useCompleteWorkOrderMutation();
  const [completeAsPlannedOrder, { isLoading: isCompletingAsPlanned }] =
    useCompleteWorkOrderAsPlannedMutation();

  const myApproval =
    currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;

  const isTerminal = status === 'COMPLETED' || status === 'VOIDED';
  const showApprove = status === 'DRAFT' && myApproval != null && !myApproval.approved;
  const showWithdraw = status === 'DRAFT' && myApproval?.approved === true;
  const showStart = status === 'DRAFT';
  const showComplete = status === 'IN_PROGRESS';
  const showCompleteAsPlanned = canCompleteWorkOrderAsPlanned(status, plannedDate, approvalMet);
  const startEnabled = approvalMet;
  const isBusy = isApproving || isUnapproving || isStarting || isCompleting || isCompletingAsPlanned;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const afterSuccess = () => {
    onMutated?.();
  };

  const handleApprove = async () => {
    try {
      await approveOrder(workOrderId).unwrap();
      appToast.success('Approved');
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to approve');
    }
  };

  const handleWithdraw = async () => {
    try {
      await unapproveOrder(workOrderId).unwrap();
      appToast.success('Approval withdrawn');
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to withdraw approval');
    }
  };

  const handleStart = async () => {
    if (!startEnabled) return;
    try {
      await startOrder(workOrderId).unwrap();
      appToast.success('Work started');
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to start work order');
    }
  };

  const handleComplete = async (data: WorkOrderCompleteRequest) => {
    try {
      await completeOrder({ id: workOrderId, data }).unwrap();
      appToast.success('Work order completed');
      setCompleteOpen(false);
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to complete work order');
    }
  };

  const handleCompleteAsPlanned = async (data: WorkOrderCompleteRequest) => {
    try {
      await completeAsPlannedOrder({ id: workOrderId, data }).unwrap();
      appToast.success('Work order directly completed');
      setCompleteAsPlannedOpen(false);
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to direct complete work order');
    }
  };

  const hasWorkflowAction =
    showApprove || showWithdraw || showStart || showComplete || showCompleteAsPlanned;

  if (isTerminal || !hasWorkflowAction) {
    return null;
  }

  return (
    <>
      <div className={cn('flex w-full flex-col gap-1', className)} onClick={stop}>
        {showApprove ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={SHEET_ACTION_BTN}
            disabled={isBusy}
            onClick={() => void handleApprove()}
          >
            {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Approve'}
          </Button>
        ) : null}

        {showWithdraw ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={SHEET_ACTION_BTN}
            disabled={isBusy}
            onClick={() => void handleWithdraw()}
          >
            {isUnapproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Withdraw'}
          </Button>
        ) : null}

        {showStart && startEnabled ? (
          <Button
            type="button"
            size="sm"
            className={cn(SHEET_ACTION_BTN, 'bg-brand-primary hover:bg-brand-primary-hover')}
            disabled={isBusy}
            onClick={() => void handleStart()}
          >
            {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start'}
          </Button>
        ) : null}

        {showCompleteAsPlanned ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              SHEET_ACTION_BTN,
              'border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40',
            )}
            disabled={isBusy}
            onPointerDown={stop}
            onClick={(e) => {
              stop(e);
              setCompleteAsPlannedOpen(true);
            }}
          >
            {isCompletingAsPlanned ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              'Direct Complete'
            )}
          </Button>
        ) : null}

        {showComplete ? (
          <Button
            type="button"
            size="sm"
            className={cn(
              SHEET_ACTION_BTN,
              'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500',
            )}
            disabled={isBusy}
            onPointerDown={stop}
            onClick={(e) => {
              stop(e);
              setCompleteOpen(true);
            }}
          >
            Complete
          </Button>
        ) : null}

        {showStart && !startEnabled ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex w-full">
                  <Button type="button" size="sm" className={SHEET_ACTION_BTN} disabled>
                    Start
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">
                Assigned approvers must approve before work can start
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>

      <CompleteWorkOrderDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onComplete={handleComplete}
        isCompleting={isCompleting}
        hasMachineTarget={machineId != null}
      />

      <CompleteWorkOrderDialog
        open={completeAsPlannedOpen}
        onOpenChange={setCompleteAsPlannedOpen}
        onComplete={handleCompleteAsPlanned}
        isCompleting={isCompletingAsPlanned}
        hasMachineTarget={machineId != null}
        mode="as_planned"
        plannedDate={plannedDate}
      />
    </>
  );
};

export default SheetWorkOrderRowActions;
