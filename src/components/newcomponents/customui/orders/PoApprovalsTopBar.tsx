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
import { AlertTriangle, Check, Clock, ShieldCheck, Wrench, XCircle } from 'lucide-react';
import PoApproveOrderButton from './PoApproveOrderButton';
import type { ApprovalSummary, PurchaseOrderApprover } from '@/types/purchaseOrder';
import type { PoConfirmationsStatus } from './purchaseOrderMilestones';
import { ORDER_PANEL_HEADER_CLASS } from './orderListConstants';

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

export interface PoApprovalsTopBarProps {
  approvers: PurchaseOrderApprover[];
  approvalSummary: ApprovalSummary;
  currentUserId: number | null;
  myApproval?: PurchaseOrderApprover;
  approvalSectionsStatus: PoConfirmationsStatus;
  approvalWithdrawBlocked?: boolean;
  approvalWithdrawBlockedReason?: string;
  isApproving: boolean;
  isUnapproving: boolean;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
  onManage: () => void;
  onToggleMyApproval: () => void;
  isVoided?: boolean;
  onVoidOrder?: () => void;
}

const PoApprovalsTopBar: React.FC<PoApprovalsTopBarProps> = ({
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  approvalSectionsStatus,
  approvalWithdrawBlocked = false,
  approvalWithdrawBlockedReason,
  isApproving,
  isUnapproving,
  highlighted = false,
  onHighlightDismiss,
  onManage,
  onToggleMyApproval,
  isVoided = false,
  onVoidOrder,
}) => {
  const sortedApprovers = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));

  return (
    <div
      id="po-section-approvals"
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

      <TooltipProvider delayDuration={150}>
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
      </TooltipProvider>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isVoided ? (
          <Badge variant="outline" className="h-8 px-2.5 gap-1.5 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 font-normal">
            <XCircle className="h-3.5 w-3.5" />
            Voided
          </Badge>
        ) : (
          onVoidOrder && (
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
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={onManage}>
          <Wrench className="mr-1 h-4 w-4" />
          Manage
        </Button>
        {myApproval && !isVoided && (
          <PoApproveOrderButton
            className="h-8 shrink-0"
            approved={myApproval.approved}
            blocked={!approvalSectionsStatus.allConfirmed}
            blockedStatus={approvalSectionsStatus}
            withdrawBlocked={approvalWithdrawBlocked}
            withdrawBlockedReason={approvalWithdrawBlockedReason}
            isBusy={isApproving || isUnapproving}
            onToggle={onToggleMyApproval}
            popoverSide="bottom"
          />
        )}
      </div>
    </div>
  );
};

export default PoApprovalsTopBar;
