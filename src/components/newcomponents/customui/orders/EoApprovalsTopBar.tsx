import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Wrench } from 'lucide-react';
import {
  OrderApprovalsBarShell,
  OrderApprovalsSummary,
  OrderApprovalsVoidedBadge,
  OrderApproversStrip,
  OrderSelfApproverChip,
} from './approvals';
import type { ExpenseApprovalSummary, ExpenseOrderApprover } from '@/types/expenseOrder';

const UNBLOCKED_STATUS = {
  title: 'Ready to approve',
  reason: 'You can approve this order.',
  pendingLabels: [] as string[],
};

export interface EoApprovalsTopBarProps {
  orderId: number;
  approvers: ExpenseOrderApprover[];
  approvalSummary: ExpenseApprovalSummary;
  currentUserId: number | null;
  myApproval?: ExpenseOrderApprover;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
  onManage: () => void;
  onToggleMyApproval: () => void;
  isVoided?: boolean;
  onVoidOrder?: () => void;
  withdrawBlocked?: boolean;
}

const EoApprovalsTopBar: React.FC<EoApprovalsTopBarProps> = ({
  orderId,
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  highlighted = false,
  onHighlightDismiss,
  onManage,
  onToggleMyApproval,
  isVoided = false,
  onVoidOrder,
  withdrawBlocked = false,
}) => {
  const selfChipProps = {
    blocked: false,
    blockedStatus: UNBLOCKED_STATUS,
    withdrawBlocked,
    withdrawBlockedReason: 'Order is complete — approval cannot be withdrawn',
    isBusy: false,
    popoverSide: 'bottom' as const,
    interactionMode: 'desktop' as const,
  };

  const collapsedSelfChip =
    !isVoided && myApproval != null && currentUserId != null ? (
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

  const manageWrench = !isVoided ? (
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
  ) : null;

  return (
    <TooltipProvider delayDuration={150}>
      <OrderApprovalsBarShell
        id="eo-section-approvals"
        collapseResetKey={orderId}
        highlighted={highlighted}
        onHighlightDismiss={onHighlightDismiss}
        isVoided={isVoided}
        approvalSummary={approvalSummary}
        selfChip={collapsedSelfChip}
        expandedContent={
          <>
            <OrderApproversStrip
              {...stripProps}
              emptyMessage="No approvers assigned — use Manage to add"
              showSelfChip={false}
            />
            <div className="flex flex-wrap items-center gap-2">
              {!isVoided ? (
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={onManage}>
                  <Wrench className="mr-1 h-4 w-4" />
                  Manage approvers
                </Button>
              ) : null}
              {onVoidOrder && !isVoided ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={onVoidOrder}
                >
                  <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                  Void Order
                </Button>
              ) : null}
            </div>
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
                emptyMessage="No approvers assigned — use Manage to add"
                showSelfChip={!isVoided && myApproval != null}
              />
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {isVoided ? (
                <OrderApprovalsVoidedBadge />
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
            </div>
          </>
        }
      />
    </TooltipProvider>
  );
};

export default EoApprovalsTopBar;
