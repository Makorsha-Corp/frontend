import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ShieldCheck, Wrench } from 'lucide-react';
import { OrderApproversStrip } from './approvals';
import type { TransferApprovalSummary, TransferOrderApprover } from '@/types/transferOrder';
import { ORDER_APPROVALS_BAR_CLASS } from './orderListConstants';

export interface ToApprovalsTopBarProps {
  approvers: TransferOrderApprover[];
  approvalSummary: TransferApprovalSummary;
  currentUserId: number | null;
  myApproval?: TransferOrderApprover;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
  onManage: () => void;
  onToggleMyApproval: () => void;
  canApprove?: boolean;
  approveBlockedReason?: string;
}

const ToApprovalsTopBar: React.FC<ToApprovalsTopBarProps> = ({
  approvers,
  approvalSummary,
  currentUserId,
  myApproval,
  highlighted = false,
  onHighlightDismiss,
  onManage,
  onToggleMyApproval,
  canApprove = true,
  approveBlockedReason,
}) => {
  const blockedStatus = {
    title: 'Cannot approve yet',
    reason: approveBlockedReason ?? 'Complete required steps before approving.',
    pendingLabels: [] as string[],
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div
        id="tr-section-approvals"
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

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <OrderApproversStrip
            approvers={approvers}
            currentUserId={currentUserId}
            myApproval={myApproval}
            emptyMessage="No approvers assigned — use Manage to add"
            showSelfChip={myApproval != null}
            onToggleMyApproval={onToggleMyApproval}
            selfChipProps={{
              actionButtonId: 'to-approve-order-btn',
              blocked: !canApprove,
              blockedStatus,
              withdrawHoverReason: 'Remove your approval from this transfer order.',
              isBusy: false,
              popoverSide: 'bottom',
            }}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={onManage}>
            <Wrench className="mr-1 h-4 w-4" />
            Manage
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ToApprovalsTopBar;

