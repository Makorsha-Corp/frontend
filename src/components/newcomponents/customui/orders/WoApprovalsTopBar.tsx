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
import { AlertTriangle, Check, Clock, ShieldCheck, Wrench, X, XCircle } from 'lucide-react';
import type { WorkOrderApprovalSummary, WorkOrderApprover } from '@/types/workOrder';
import { avatarColor, initialsOf } from './transferOrderApprovals';
import { ORDER_PANEL_HEADER_CLASS } from './orderListConstants';

export interface WoApprovalsTopBarProps {
  approvers: WorkOrderApprover[];
  approvalSummary: WorkOrderApprovalSummary;
  currentUserId: number | null;
  myApproval?: WorkOrderApprover;
  onManage: () => void;
  onToggleMyApproval: () => void;
  isVoided?: boolean;
  isLocked?: boolean;
  onVoidOrder?: () => void;
}

const WoApprovalsTopBar: React.FC<WoApprovalsTopBarProps> = ({
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  onManage,
  onToggleMyApproval,
  isVoided = false,
  isLocked = false,
  onVoidOrder,
}) => {
  const sortedApprovers = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));

  return (
    <div
      id="wo-section-approvals"
      className={cn(ORDER_PANEL_HEADER_CLASS, '-mx-6 -mt-6 mb-2 flex-nowrap gap-x-4 bg-card/40 px-6 scroll-mt-6')}
    >
      <div className="flex shrink-0 items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-semibold text-card-foreground">Approvals</span>
        <Badge
          variant="outline"
          className={cn(
            'font-normal shrink-0',
            approvalSummary.met ? 'text-green-600 border-green-600/30' : 'text-amber-600 border-amber-600/30'
          )}
        >
          {approvalSummary.required === 0
            ? 'Not required'
            : `${approvalSummary.approved_count} / ${approvalSummary.required}`}
        </Badge>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {sortedApprovers.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              No approvers assigned — this order does not require approval
            </span>
          ) : (
            sortedApprovers.map((approver) => (
              <Tooltip key={approver.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white',
                      approver.approved ? avatarColor(approver.user_id) : 'bg-muted-foreground/40 opacity-60'
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
                    <p className="text-xs text-muted-foreground">{approver.user_position || approver.user_email}</p>
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
      </TooltipProvider>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isVoided ? (
          <Badge
            variant="outline"
            className="h-8 px-2.5 gap-1.5 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 font-normal"
          >
            <XCircle className="h-3.5 w-3.5" />
            Voided
          </Badge>
        ) : (
          onVoidOrder &&
          !isLocked && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={onVoidOrder}
            >
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              Void Order
            </Button>
          )
        )}
        {!isVoided && !isLocked && (
          <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={onManage}>
            <Wrench className="mr-1 h-4 w-4" />
            Manage
          </Button>
        )}
        {myApproval && !isVoided && !isLocked && (
          <Button
            type="button"
            size="sm"
            variant={myApproval.approved ? 'outline' : 'default'}
            className={cn('h-8 shrink-0', !myApproval.approved && 'bg-brand-primary hover:bg-brand-primary-hover')}
            onClick={onToggleMyApproval}
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
        )}
      </div>
    </div>
  );
};

export default WoApprovalsTopBar;
