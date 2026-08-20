import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle, Wrench } from 'lucide-react';
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
  const canManage = !isVoided && !isLocked;

  const selfChipProps = {
    blocked: false,
    blockedStatus: UNBLOCKED_STATUS,
    isBusy: false,
    popoverSide: 'bottom' as const,
    interactionMode: 'desktop' as const,
  };

  const collapsedSelfChip =
    canManage && myApproval != null && currentUserId != null ? (
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

  const manageWrench = canManage ? (
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

  const expandedContent = (
    <>
      <OrderApproversStrip
        {...stripProps}
        emptyMessage="No approvers assigned"
        showSelfChip={false}
      />
      <div className="flex flex-wrap items-center gap-2">
        {canManage ? (
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={onManage}>
            <Wrench className="mr-1 h-4 w-4" />
            Manage approvers
          </Button>
        ) : null}
        {onVoidOrder && canManage ? (
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
        <OrderApprovalsSummary approvalSummary={approvalSummary} />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        <OrderApproversStrip
          {...stripProps}
          emptyMessage="No approvers assigned"
          showSelfChip={canManage && myApproval != null}
        />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isVoided ? (
          <OrderApprovalsVoidedBadge />
        ) : (
          onVoidOrder &&
          canManage && (
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
  );

  if (layout === 'header-inline') {
    return (
      <TooltipProvider delayDuration={150}>
        <div
          className={cn(
            'hidden lg:flex min-w-0 flex-1 flex-nowrap items-center gap-x-3 scroll-mt-6',
            className,
          )}
        >
          <div className="hidden lg:block h-8 w-px shrink-0 bg-border" aria-hidden />
          {desktopRow}
        </div>
      </TooltipProvider>
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
