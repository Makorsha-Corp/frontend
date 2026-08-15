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
import { AlertTriangle, ShieldCheck, Wrench, XCircle } from 'lucide-react';
import { OrderApproversStrip } from './approvals';
import type { ApprovalSummary, PurchaseOrderApprover } from '@/types/purchaseOrder';
import type { PoConfirmationsStatus } from './purchaseOrderMilestones';
import { ORDER_APPROVALS_BAR_CLASS } from './orderListConstants';

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
  return (
    <TooltipProvider delayDuration={150}>
      <div
        id="po-section-approvals"
        className={cn(ORDER_APPROVALS_BAR_CLASS, highlighted && 'po-scroll-target-highlight')}
        onMouseEnter={() => {
          if (highlighted) onHighlightDismiss?.();
        }}
      >
        <div className="flex shrink-0 items-center gap-2">
          {!isVoided ? (
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
          ) : null}
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
            showSelfChip={!isVoided && myApproval != null}
            onToggleMyApproval={onToggleMyApproval}
            selfChipProps={{
              actionButtonId: 'po-approve-order-btn',
              blocked: !approvalSectionsStatus.allConfirmed,
              blockedStatus: approvalSectionsStatus,
              withdrawBlocked: approvalWithdrawBlocked,
              withdrawBlockedReason: approvalWithdrawBlockedReason,
              withdrawHoverReason: 'Remove your approval from this purchase order.',
              isBusy: isApproving || isUnapproving,
              popoverSide: 'bottom',
            }}
          />
        </div>

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
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PoApprovalsTopBar;

