import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldCheck, UserPlus, Wrench, XCircle } from 'lucide-react';
import { OrderApproversStrip } from './approvals';
import type { WorkOrderApprovalSummary, WorkOrderApprover } from '@/types/workOrder';
import { ORDER_PANEL_HEADER_CLASS } from './orderListConstants';

const UNBLOCKED_STATUS = {
  title: 'Ready to approve',
  reason: 'You can approve this order.',
  pendingLabels: [] as string[],
};

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
  /** Inline with identity row in detail header (no separate sub-bar). */
  layout?: 'bar' | 'inline';
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
  layout = 'bar',
}) => {
  const isInline = layout === 'inline';
  const showApprovalBadge = approvers.length > 0 || approvalSummary.required > 0;
  const showSelfChip = myApproval != null && !isVoided && !isLocked;

  return (
    <div
      id="wo-section-approvals"
      className={cn(
        'flex min-w-0 flex-nowrap items-center gap-x-3 scroll-mt-6',
        isInline ? 'flex-1' : cn(ORDER_PANEL_HEADER_CLASS, 'gap-x-4 px-6')
      )}
    >
      <div className="flex shrink-0 items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-semibold text-card-foreground">Approvals</span>
        {showApprovalBadge && (
          <Badge
            variant="outline"
            className={cn(
              'font-normal shrink-0',
              approvalSummary.met ? 'text-green-600 border-green-600/30' : 'text-amber-600 border-amber-600/30'
            )}
          >
            {`${approvalSummary.approved_count} / ${approvalSummary.required}`}
          </Badge>
        )}
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {approvers.length === 0 ? (
            !isVoided && !isLocked ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={onManage}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Assign approvers
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground truncate">
                {isInline ? 'No approvers' : 'No approvers assigned — this order does not require approval'}
              </span>
            )
          ) : (
            <OrderApproversStrip
              approvers={approvers}
              currentUserId={currentUserId}
              myApproval={myApproval}
              showSelfChip={showSelfChip}
              onToggleMyApproval={onToggleMyApproval}
              selfChipProps={{
                blocked: false,
                blockedStatus: UNBLOCKED_STATUS,
                withdrawHoverReason: 'Remove your approval from this work order.',
                isBusy: false,
                popoverSide: 'bottom',
              }}
            />
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
        {!isVoided && !isLocked && approvers.length > 0 && (
          <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={onManage}>
            <Wrench className="mr-1 h-4 w-4" />
            Edit approvers
          </Button>
        )}
      </div>
    </div>
  );
};

export default WoApprovalsTopBar;
