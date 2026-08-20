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
import { SHEET_META } from './workOrderSheetTypography';

export interface SheetApproverChipsProps {
  approvers: WorkOrderApprover[];
  maxVisible?: number;
  className?: string;
  /** Tighter avatars for sheet table cells (default true). */
  compact?: boolean;
}

function approvalProgress(approvers: WorkOrderApprover[]) {
  const approved = approvers.filter((a) => a.approved).length;
  return { approved, total: approvers.length };
}

const SheetApproverChips: React.FC<SheetApproverChipsProps> = ({
  approvers,
  maxVisible = 4,
  className,
  compact = true,
}) => {
  if (approvers.length === 0) {
    return (
      <span className={cn(SHEET_META, 'italic')}>No approvers required</span>
    );
  }

  const sorted = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));
  const visible = sorted.slice(0, maxVisible);
  const overflow = sorted.length - visible.length;
  const { approved, total } = approvalProgress(approvers);
  const avatarSize = compact ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-[11px]';
  const statusSize = compact ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const statusIcon = compact ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('flex flex-wrap items-center gap-1 leading-none', className)}>
        {visible.map((approver) => (
          <Tooltip key={approver.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'relative flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
                  avatarSize,
                  approver.approved ? avatarColor(approver.user_id) : 'bg-muted-foreground/35',
                )}
              >
                {initialsOf(approver.user_name)}
                <span
                  className={cn(
                    'absolute bottom-0 right-0 flex items-center justify-center rounded-full ring-1 ring-background',
                    statusSize,
                    approver.approved ? 'bg-emerald-600' : 'bg-amber-500',
                  )}
                >
                  {approver.approved ? (
                    <Check className={cn(statusIcon, 'text-white')} strokeWidth={3} />
                  ) : (
                    <Clock className={cn(statusIcon, 'text-white')} strokeWidth={2.5} />
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
        <span
          className={cn(
            'shrink-0 font-medium tabular-nums',
            compact ? 'text-[10px]' : 'text-[11px]',
            approved === total ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
          )}
        >
          {approved}/{total}
        </span>
      </div>
    </TooltipProvider>
  );
};

export default SheetApproverChips;
