import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, Clock, ShieldCheck, Wrench, X } from 'lucide-react';
import type { TransferApprovalSummary, TransferOrderApprover } from '@/types/transferOrder';
import { avatarColor, initialsOf } from './transferOrderApprovals';
import { ORDER_PANEL_HEADER_CLASS } from './orderListConstants';

export interface ToApprovalsTopBarProps {
  approvers: TransferOrderApprover[];
  approvalSummary: TransferApprovalSummary;
  currentUserId: number | null;
  myApproval?: TransferOrderApprover;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
  onManage: () => void;
  onToggleMyApproval: () => void;
  canApprove?: boolean;
  approveBlockedReason?: string;
}

const ToApprovalsTopBar: React.FC<ToApprovalsTopBarProps> = ({
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  highlighted = false,
  onHighlightDismiss,
  onManage,
  onToggleMyApproval,
  canApprove = true,
  approveBlockedReason,
}) => {
  const sortedApprovers = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));

  return (
    <TooltipProvider delayDuration={150}>
    <div
      id="tr-section-approvals"
      className={cn(
        ORDER_PANEL_HEADER_CLASS,
        '-mx-6 -mt-6 mb-2 flex-nowrap gap-x-4 bg-card/40 px-6 scroll-mt-6',
        highlighted && 'po-scroll-target-highlight'
      )}
      onMouseEnter={() => {
        if (highlighted) onHighlightDismiss?.();
      }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-semibold text-card-foreground">Approvals</span>
        <Badge
          variant="outline"
          className={cn(
            'font-normal shrink-0',
            approvalSummary.met
              ? 'text-green-600 border-green-600/30'
              : 'text-amber-600 border-amber-600/30'
          )}
        >
          {approvalSummary.approved_count} / {approvalSummary.required}
        </Badge>
      </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {sortedApprovers.length === 0 ? (
            <span className="text-xs text-muted-foreground">No approvers assigned — use Manage to add</span>
          ) : (
            sortedApprovers.map((approver) => (
              <Tooltip key={approver.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
                      approver.approved
                        ? avatarColor(approver.user_id)
                        : 'bg-muted-foreground/40 opacity-60'
                    )}
                  >
                    {initialsOf(approver.user_name)}
                    {approver.approved && (
                      <span className="absolute bottom-0 left-0 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-600 ring-1 ring-background">
                        <Check className="h-1.5 w-1.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[14rem]">
                  <p className="font-medium">
                    {approver.user_name ?? `User #${approver.user_id}`}
                    {approver.user_id === currentUserId ? ' (you)' : ''}
                  </p>
                  {(approver.user_position || approver.user_email) && (
                    <p className="text-xs text-muted-foreground">
                      {approver.user_position || approver.user_email}
                    </p>
                  )}
                  <p className="mt-1 flex items-center gap-1 text-xs">
                    {approver.approved ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Pending
                      </>
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))
          )}
        </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={onManage}>
          <Wrench className="mr-1 h-4 w-4" />
          Manage
        </Button>
        {myApproval && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  size="sm"
                  variant={myApproval.approved ? 'outline' : 'default'}
                  className={cn(
                    'h-8 shrink-0',
                    !myApproval.approved && 'bg-brand-primary hover:bg-brand-primary-hover'
                  )}
                  onClick={onToggleMyApproval}
                  disabled={!myApproval.approved && !canApprove}
                >
                  {myApproval.approved ? (
                    <>
                      <X className="mr-1 h-4 w-4" />
                      Withdraw
                    </>
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {!myApproval.approved && !canApprove && approveBlockedReason ? (
              <TooltipContent>{approveBlockedReason}</TooltipContent>
            ) : null}
          </Tooltip>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default ToApprovalsTopBar;
