import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CompleteWorkOrderDialog from '@/components/newcomponents/customui/orders/CompleteWorkOrderDialog';
import {
  useApproveWorkOrderMutation,
  useCompleteWorkOrderMutation,
  useStartWorkOrderMutation,
  useUnapproveWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import type { WorkOrderApprover, WorkOrderCompleteRequest, WorkOrderStatus } from '@/types/workOrder';
import { cn } from '@/lib/utils';
import { SHEET_ACTION_BTN } from './workOrderSheetTypography';

export interface SheetWorkOrderRowActionsProps {
  workOrderId: number;
  workOrderNumber: string;
  status: WorkOrderStatus;
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
  approvalMet,
  machineId,
  approvers,
  currentUserId,
  onMutated,
  className,
}) => {
  const [completeOpen, setCompleteOpen] = useState(false);

  const [approveOrder, { isLoading: isApproving }] = useApproveWorkOrderMutation();
  const [unapproveOrder, { isLoading: isUnapproving }] = useUnapproveWorkOrderMutation();
  const [startOrder, { isLoading: isStarting }] = useStartWorkOrderMutation();
  const [completeOrder, { isLoading: isCompleting }] = useCompleteWorkOrderMutation();

  const myApproval =
    currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;

  const isTerminal = status === 'COMPLETED' || status === 'VOIDED';
  const showApprove = status === 'DRAFT' && myApproval != null && !myApproval.approved;
  const showWithdraw = status === 'DRAFT' && myApproval?.approved === true;
  const showStart = status === 'DRAFT';
  const showComplete = status === 'IN_PROGRESS';
  const startEnabled = approvalMet;
  const isBusy = isApproving || isUnapproving || isStarting || isCompleting;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const afterSuccess = () => {
    onMutated?.();
  };

  const handleApprove = async () => {
    try {
      await approveOrder(workOrderId).unwrap();
      toast.success('Approved');
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to approve');
    }
  };

  const handleWithdraw = async () => {
    try {
      await unapproveOrder(workOrderId).unwrap();
      toast.success('Approval withdrawn');
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to withdraw approval');
    }
  };

  const handleStart = async () => {
    if (!startEnabled) return;
    try {
      await startOrder(workOrderId).unwrap();
      toast.success('Work started');
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to start work order');
    }
  };

  const handleComplete = async (data: WorkOrderCompleteRequest) => {
    try {
      await completeOrder({ id: workOrderId, data }).unwrap();
      toast.success('Work order completed');
      setCompleteOpen(false);
      afterSuccess();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to complete work order');
    }
  };

  const hasWorkflowAction =
    showApprove || showWithdraw || showStart || showComplete;

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

        {showComplete ? (
          <Button
            type="button"
            size="sm"
            className={cn(SHEET_ACTION_BTN, 'bg-brand-primary hover:bg-brand-primary-hover')}
            disabled={isBusy}
            onClick={() => setCompleteOpen(true)}
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
    </>
  );
};

export default SheetWorkOrderRowActions;
