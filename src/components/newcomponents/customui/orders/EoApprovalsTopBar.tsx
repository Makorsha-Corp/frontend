import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldCheck, Wrench, XCircle } from 'lucide-react';
import { OrderApproversStrip } from './approvals';
import type { ExpenseApprovalSummary, ExpenseOrderApprover } from '@/types/expenseOrder';
import { ORDER_APPROVALS_BAR_CLASS } from './orderListConstants';

const UNBLOCKED_STATUS = {
  title: 'Ready to approve',
  reason: 'You can approve this order.',
  pendingLabels: [] as string[],
};

export interface EoApprovalsTopBarProps {
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
  return (
    <div
      id="eo-section-approvals"
      className={cn(ORDER_APPROVALS_BAR_CLASS, highlighted && 'po-scroll-target-highlight')}
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
            approvalSummary.met ? 'text-green-600 border-green-600/30' : 'text-amber-600 border-amber-600/30'
          )}
        >
          {approvalSummary.approved_count} / {approvalSummary.required}
        </Badge>
      </div>

      <TooltipProvider delayDuration={150}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <OrderApproversStrip
            approvers={approvers}
            currentUserId={currentUserId}
            myApproval={myApproval}
            emptyMessage="No approvers assigned — use Manage to add"
            showSelfChip={!isVoided && myApproval != null}
            onToggleMyApproval={onToggleMyApproval}
            selfChipProps={{
              blocked: false,
              blockedStatus: UNBLOCKED_STATUS,
              withdrawBlocked,
              withdrawBlockedReason: 'Order is complete — approval cannot be withdrawn',
              withdrawHoverReason: 'Remove your approval from this expense order.',
              isBusy: false,
              popoverSide: 'bottom',
            }}
          />
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
      </div>
    </div>
  );
};

export default EoApprovalsTopBar;
