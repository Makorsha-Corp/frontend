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
import { Check, Clock, ShieldCheck, Wrench } from 'lucide-react';
import SoApproveOrderButton from './SoApproveOrderButton';
import type { SalesOrderApprovalSummary, SalesOrderApprover } from '@/types/salesOrder';
import type { SoConfirmationsStatus } from './salesOrderMilestones';
import { ORDER_APPROVALS_BAR_CLASS } from './orderListConstants';

const AVATAR_COLORS = [
  'bg-brand-primary',
  'bg-green-600',
  'bg-amber-600',
  'bg-sky-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-teal-600',
];

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarColor = (userId: number): string => AVATAR_COLORS[userId % AVATAR_COLORS.length];

export interface SoApprovalsTopBarProps {
  approvers: SalesOrderApprover[];
  approvalSummary: SalesOrderApprovalSummary;
  currentUserId: number | null;
  myApproval?: SalesOrderApprover;
  approvalSectionsStatus: SoConfirmationsStatus;
  approvalWithdrawBlocked?: boolean;
  approvalWithdrawBlockedReason?: string;
  isApproving: boolean;
  isUnapproving: boolean;
  onManage: () => void;
  onToggleMyApproval: () => void;
}

const SoApprovalsTopBar: React.FC<SoApprovalsTopBarProps> = ({
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  approvalSectionsStatus,
  approvalWithdrawBlocked = false,
  approvalWithdrawBlockedReason,
  isApproving,
  isUnapproving,
  onManage,
  onToggleMyApproval,
}) => {
  const sortedApprovers = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));

  return (
    <TooltipProvider delayDuration={150}>
      <div
        id="so-section-approvals"
        className={ORDER_APPROVALS_BAR_CLASS}
      >
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onManage}
                aria-label="Manage approvers"
              >
                <Wrench className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Manage approvers</TooltipContent>
          </Tooltip>
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-card-foreground">Approvals</span>
          <Badge
            variant="outline"
            className={cn(
              'font-normal shrink-0',
              approvalSummary.met ? 'text-green-600 border-green-600/30' : 'text-amber-600 border-amber-600/30'
            )}
          >
            {approvalSummary.approved_count} / {approvalSummary.required}
          </Badge>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {sortedApprovers.length === 0 ? (
            <span className="text-xs text-muted-foreground">No approvers assigned</span>
          ) : (
            sortedApprovers.map((approver) => {
              const isSelf = myApproval != null && approver.user_id === currentUserId;

              return (
                <div
                  key={approver.id}
                  className={cn(
                    'flex shrink-0 items-center gap-1',
                    isSelf && 'rounded-full border border-border/70 bg-muted/20 py-0.5 pl-0.5 pr-1'
                  )}
                >
                  <Tooltip>
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
                  {isSelf ? (
                    <SoApproveOrderButton
                      iconOnly
                      approved={myApproval.approved}
                      blocked={!approvalSectionsStatus.allConfirmed}
                      blockedStatus={approvalSectionsStatus}
                      withdrawBlocked={approvalWithdrawBlocked}
                      withdrawBlockedReason={approvalWithdrawBlockedReason}
                      isBusy={isApproving || isUnapproving}
                      onToggle={onToggleMyApproval}
                      popoverSide="bottom"
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SoApprovalsTopBar;
