import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle, UserPlus, Wrench } from 'lucide-react';
import {
  OrderApprovalsBarShell,
  OrderApprovalsSummary,
  OrderApprovalsVoidedBadge,
  OrderApproversStrip,
  OrderSelfApproverChip,
} from './approvals';
import type { WorkOrderApprovalSummary, WorkOrderApprover } from '@/types/workOrder';

const UNBLOCKED_STATUS = {
  title: 'Ready to approve',
  reason: 'You can approve this order.',
  pendingLabels: [] as string[],
};

export interface WoApprovalsTopBarProps {
  orderId: number;
  approvers: WorkOrderApprover[];
  approvalSummary: WorkOrderApprovalSummary;
  currentUserId: number | null;
  myApproval?: WorkOrderApprover;
  onManage: () => void;
  onToggleMyApproval: () => void;
  isVoided?: boolean;
  isLocked?: boolean;
  onVoidOrder?: () => void;
  /** `header-inline` / `header-mobile` pair for work-order header. `bar`: standalone shell. */
  layout?: 'bar' | 'header-inline' | 'header-mobile';
  className?: string;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
}

function WoInlineStrip({
  approvers,
  isVoided,
  isLocked,
  onManage,
  stripProps,
  showSelfChip,
  emptyInlineMessage,
}: {
  approvers: WorkOrderApprover[];
  isVoided: boolean;
  isLocked: boolean;
  onManage: () => void;
  stripProps: {
    approvers: WorkOrderApprover[];
    currentUserId: number | null;
    myApproval?: WorkOrderApprover;
    onToggleMyApproval: () => void;
    selfChipProps: {
      blocked: boolean;
      blockedStatus: typeof UNBLOCKED_STATUS;
      isBusy: boolean;
      popoverSide: 'bottom';
      interactionMode: 'desktop';
    };
  };
  showSelfChip: boolean;
  emptyInlineMessage: string;
}) {
  if (approvers.length === 0) {
    if (isVoided || isLocked) {
      return <span className="text-xs text-muted-foreground truncate">{emptyInlineMessage}</span>;
    }
    return (
      <Button type="button" size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={onManage}>
        <UserPlus className="mr-1 h-3.5 w-3.5" />
        Assign approvers
      </Button>
    );
  }
  return <OrderApproversStrip {...stripProps} showSelfChip={showSelfChip} />;
}

function WoTrailingActions({
  approvers,
  isVoided,
  isLocked,
  onManage,
  onVoidOrder,
}: {
  approvers: WorkOrderApprover[];
  isVoided: boolean;
  isLocked: boolean;
  onManage: () => void;
  onVoidOrder?: () => void;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {isVoided ? (
        <OrderApprovalsVoidedBadge />
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
      {!isVoided && !isLocked && approvers.length > 0 ? (
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={onManage}>
          <Wrench className="mr-1 h-4 w-4" />
          Edit approvers
        </Button>
      ) : null}
    </div>
  );
}

const WoApprovalsTopBar: React.FC<WoApprovalsTopBarProps> = ({
  orderId,
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  onManage,
  onToggleMyApproval,
  isVoided = false,
  isLocked = false,
  onVoidOrder,
  layout = 'bar',
  highlighted = false,
  onHighlightDismiss,
  className,
}) => {
  const showSelfChip = myApproval != null && !isVoided && !isLocked;

  const selfChipProps = {
    blocked: false,
    blockedStatus: UNBLOCKED_STATUS,
    isBusy: false,
    popoverSide: 'bottom' as const,
    interactionMode: 'desktop' as const,
  };

  const stripProps = {
    approvers,
    currentUserId,
    myApproval,
    onToggleMyApproval,
    selfChipProps,
  };

  const collapsedSelfChip =
    showSelfChip && myApproval != null && currentUserId != null ? (
      <OrderSelfApproverChip
        approver={myApproval}
        currentUserId={currentUserId}
        onToggleMyApproval={onToggleMyApproval}
        {...selfChipProps}
        interactionMode="mobile"
      />
    ) : null;

  const manageWrench = !isVoided && !isLocked ? (
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

  const summaryBlock = <OrderApprovalsSummary approvalSummary={approvalSummary} />;

  const expandedContent = (
    <>
      {approvers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No approvers assigned — this order does not require approval
        </p>
      ) : (
        <OrderApproversStrip {...stripProps} showSelfChip={false} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {!isVoided && !isLocked ? (
          approvers.length === 0 ? (
            <Button type="button" size="sm" variant="outline" className="h-8" onClick={onManage}>
              <UserPlus className="mr-1 h-3.5 w-3.5" />
              Assign approvers
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" className="h-8" onClick={onManage}>
              <Wrench className="mr-1 h-4 w-4" />
              Edit approvers
            </Button>
          )
        ) : null}
        {onVoidOrder && !isVoided && !isLocked ? (
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
  );

  const desktopRow = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        {manageWrench}
        {summaryBlock}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        <WoInlineStrip
          approvers={approvers}
          isVoided={isVoided}
          isLocked={isLocked}
          onManage={onManage}
          stripProps={stripProps}
          showSelfChip={showSelfChip}
          emptyInlineMessage="No approvers assigned — this order does not require approval"
        />
      </div>
      <WoTrailingActions
        approvers={approvers}
        isVoided={isVoided}
        isLocked={isLocked}
        onManage={onManage}
        onVoidOrder={onVoidOrder}
      />
    </>
  );

  if (layout === 'header-inline') {
    return (
      <div
        className={cn(
          'hidden lg:flex min-w-0 flex-1 flex-nowrap items-center gap-x-3 scroll-mt-6',
          className
        )}
      >
        <div className="hidden lg:block h-8 w-px shrink-0 bg-border" aria-hidden />
        <div className="flex shrink-0 items-center gap-2">{summaryBlock}</div>
        <TooltipProvider delayDuration={150}>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            <WoInlineStrip
              approvers={approvers}
              isVoided={isVoided}
              isLocked={isLocked}
              onManage={onManage}
              stripProps={stripProps}
              showSelfChip={showSelfChip}
              emptyInlineMessage="No approvers"
            />
          </div>
        </TooltipProvider>
        <WoTrailingActions
          approvers={approvers}
          isVoided={isVoided}
          isLocked={isLocked}
          onManage={onManage}
          onVoidOrder={onVoidOrder}
        />
      </div>
    );
  }

  if (layout === 'header-mobile') {
    return (
      <TooltipProvider delayDuration={150}>
        <OrderApprovalsBarShell
          id="wo-section-approvals"
          collapseResetKey={orderId}
          highlighted={highlighted}
          onHighlightDismiss={onHighlightDismiss}
          isVoided={isVoided}
          approvalSummary={approvalSummary}
          selfChip={collapsedSelfChip}
          expandedContent={expandedContent}
          desktopRow={desktopRow}
          showDesktop={false}
          className={cn('border-t border-border', className)}
        />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <OrderApprovalsBarShell
        id="wo-section-approvals"
        collapseResetKey={orderId}
        highlighted={highlighted}
        onHighlightDismiss={onHighlightDismiss}
        isVoided={isVoided}
        approvalSummary={approvalSummary}
        selfChip={collapsedSelfChip}
        expandedContent={expandedContent}
        desktopRow={desktopRow}
      />
    </TooltipProvider>
  );
};

export default WoApprovalsTopBar;
