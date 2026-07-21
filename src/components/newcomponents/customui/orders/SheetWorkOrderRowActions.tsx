import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, MoreHorizontal } from 'lucide-react';
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
  workOrderNumber,
  status,
  approvalMet,
  machineId,
  approvers,
  currentUserId,
  onOpenDetail,
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

  const primaryAction =
    showComplete ? ('complete' as const) : showStart && startEnabled ? ('start' as const) : null;

  if (isTerminal && !showWithdraw) {
    return (
      <div className={cn('flex w-full flex-col gap-1', className)} onClick={stop}>
        <Button type="button" variant="outline" size="sm" className="h-7 w-full text-xs" onClick={onOpenDetail}>
          Open
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex w-full flex-col gap-1', className)} onClick={stop}>
        {showApprove ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full text-xs"
            disabled={isBusy}
            onClick={() => void handleApprove()}
          >
            {isApproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Approve'}
          </Button>
        ) : null}

        {primaryAction === 'start' ? (
          <Button
            type="button"
            size="sm"
            className="h-7 w-full text-xs bg-brand-primary hover:bg-brand-primary-hover"
            disabled={isBusy}
            onClick={() => void handleStart()}
          >
            {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start'}
          </Button>
        ) : null}

        {primaryAction === 'complete' ? (
          <Button
            type="button"
            size="sm"
            className="h-7 w-full text-xs bg-brand-primary hover:bg-brand-primary-hover"
            disabled={isBusy}
            onClick={() => setCompleteOpen(true)}
          >
            Complete
          </Button>
        ) : null}

        {showStart && !startEnabled && status === 'DRAFT' ? (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex w-full">
                  <Button type="button" size="sm" className="h-7 w-full text-xs" disabled>
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

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 min-w-0 flex-1 px-2 text-xs"
            onClick={onOpenDetail}
          >
            Open
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={isBusy}
                aria-label={`Actions for ${workOrderNumber}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {showWithdraw ? (
                <DropdownMenuItem onClick={() => void handleWithdraw()} disabled={isUnapproving}>
                  Withdraw approval
                </DropdownMenuItem>
              ) : null}
              {showStart && primaryAction !== 'start' && startEnabled ? (
                <DropdownMenuItem onClick={() => void handleStart()} disabled={isStarting}>
                  Start work
                </DropdownMenuItem>
              ) : null}
              {showComplete && primaryAction !== 'complete' ? (
                <DropdownMenuItem onClick={() => setCompleteOpen(true)}>Complete</DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onOpenDetail}>Open detail</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
