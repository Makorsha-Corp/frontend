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
import { ShieldCheck, Wrench } from 'lucide-react';
import { OrderApproversStrip } from './approvals';
import type { SalesOrderApprovalSummary, SalesOrderApprover } from '@/types/salesOrder';
import type { SoConfirmationsStatus } from './salesOrderMilestones';
import { ORDER_APPROVALS_BAR_CLASS } from './orderListConstants';

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
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
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
  highlighted = false,
  onHighlightDismiss,
  onManage,
  onToggleMyApproval,
}) => {
  return (
    <TooltipProvider delayDuration={150}>
      <div
        id="so-section-approvals"
        className={cn(ORDER_APPROVALS_BAR_CLASS, highlighted && 'po-scroll-target-highlight')}
        onMouseEnter={() => {
          if (highlighted) onHighlightDismiss?.();
        }}
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

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <OrderApproversStrip
            approvers={approvers}
            currentUserId={currentUserId}
            myApproval={myApproval}
            emptyMessage="No approvers assigned"
            showSelfChip={myApproval != null}
            onToggleMyApproval={onToggleMyApproval}
            selfChipProps={{
              actionButtonId: 'so-approve-order-btn',
              blocked: !approvalSectionsStatus.allConfirmed,
              blockedStatus: approvalSectionsStatus,
              withdrawBlocked: approvalWithdrawBlocked,
              withdrawBlockedReason: approvalWithdrawBlockedReason,
              withdrawHoverReason: 'Remove your approval from this sales order.',
              isBusy: isApproving || isUnapproving,
              popoverSide: 'bottom',
            }}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SoApprovalsTopBar;

