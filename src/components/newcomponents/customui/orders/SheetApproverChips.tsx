import React from 'react';
import { Check, Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { WorkOrderApprover } from '@/types/workOrder';
import { avatarColor, initialsOf } from './transferOrderApprovals';

export interface SheetApproverChipsProps {
  approvers: WorkOrderApprover[];
  maxVisible?: number;
  className?: string;
}

function approvalProgress(approvers: WorkOrderApprover[]) {
  const approved = approvers.filter((a) => a.approved).length;
  return { approved, total: approvers.length };
}

const SheetApproverChips: React.FC<SheetApproverChipsProps> = ({
  approvers,
  maxVisible = 4,
  className,
}) => {
  if (approvers.length === 0) {
    return (
      <span className="text-xs italic text-muted-foreground/80">Not required</span>
    );
  }

  const sorted = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));
  const visible = sorted.slice(0, maxVisible);
  const overflow = sorted.length - visible.length;
  const { approved, total } = approvalProgress(approvers);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span
        className={cn(
          'text-[10px] font-medium leading-none',
          approved === total ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
        )}
      >
        {approved}/{total} approved
      </span>

      <TooltipProvider delayDuration={150}>
        <div className="flex flex-wrap items-center gap-1">
          {visible.map((approver) => (
            <Tooltip key={approver.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white',
                    approver.approved ? avatarColor(approver.user_id) : 'bg-muted-foreground/35',
                  )}
                >
                  {initialsOf(approver.user_name)}
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -left-0.5 flex h-3 w-3 items-center justify-center rounded-full ring-1 ring-background',
                      approver.approved ? 'bg-emerald-600' : 'bg-amber-500',
                    )}
                  >
                    {approver.approved ? (
                      <Check className="h-2 w-2 text-white" strokeWidth={3} />
                    ) : (
                      <Clock className="h-2 w-2 text-white" strokeWidth={2.5} />
                    )}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[14rem] text-xs">
                <p className="font-medium">{approver.user_name ?? `User #${approver.user_id}`}</p>
                <p className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                  {approver.approved ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      Approved
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-amber-600" />
                      Pending
                    </>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {overflow > 0 ? (
            <span className="text-[10px] text-muted-foreground">+{overflow}</span>
          ) : null}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default SheetApproverChips;
