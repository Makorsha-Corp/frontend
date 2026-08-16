import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wrench } from 'lucide-react';
import {
  OrderApprovalsBarShell,
  OrderApprovalsSummary,
  OrderApproversStrip,
  OrderSelfApproverChip,
} from './approvals';
import type { SalesOrderApprovalSummary, SalesOrderApprover } from '@/types/salesOrder';
import type { SoConfirmationsStatus } from './salesOrderMilestones';

export interface SoApprovalsTopBarProps {
  orderId: number;
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
  orderId,
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
  const selfChipProps = {
    actionButtonId: 'so-approve-order-btn',
    blocked: !approvalSectionsStatus.allConfirmed,
    blockedStatus: approvalSectionsStatus,
    withdrawBlocked: approvalWithdrawBlocked,
    withdrawBlockedReason: approvalWithdrawBlockedReason,
    isBusy: isApproving || isUnapproving,
    popoverSide: 'bottom' as const,
    interactionMode: 'desktop' as const,
  };

  const collapsedSelfChip =
    myApproval != null && currentUserId != null ? (
      <OrderSelfApproverChip
        approver={myApproval}
        currentUserId={currentUserId}
        onToggleMyApproval={onToggleMyApproval}
        {...selfChipProps}
        interactionMode="mobile"
      />
    ) : null;

  const stripProps = {
    approvers,
    currentUserId,
    myApproval,
    onToggleMyApproval,
    selfChipProps,
  };

  const manageWrench = (
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
  );

  return (
    <TooltipProvider delayDuration={150}>
      <OrderApprovalsBarShell
        id="so-section-approvals"
        collapseResetKey={orderId}
        highlighted={highlighted}
        onHighlightDismiss={onHighlightDismiss}
        approvalSummary={approvalSummary}
        selfChip={collapsedSelfChip}
        expandedContent={
          <>
            <OrderApproversStrip
              {...stripProps}
              emptyMessage="No approvers assigned"
              showSelfChip={false}
            />
            <Button type="button" size="sm" variant="outline" className="h-8" onClick={onManage}>
              <Wrench className="mr-1 h-4 w-4" />
              Manage approvers
            </Button>
          </>
        }
        desktopRow={
          <>
            <div className="flex shrink-0 items-center gap-2">
              {manageWrench}
              <OrderApprovalsSummary approvalSummary={approvalSummary} />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
              <OrderApproversStrip
                {...stripProps}
                emptyMessage="No approvers assigned"
                showSelfChip={myApproval != null}
              />
            </div>
          </>
        }
      />
    </TooltipProvider>
  );
};

export default SoApprovalsTopBar;
