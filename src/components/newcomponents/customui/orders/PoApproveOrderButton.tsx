import React from 'react';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import type { PoConfirmationsStatus } from './purchaseOrderMilestones';

export interface PoApproveOrderButtonProps {
  approved: boolean;
  blocked: boolean;
  blockedStatus: PoConfirmationsStatus;
  isBusy: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'default';
  withdrawLabel?: string;
  approveLabel?: string;
}

const PoApproveOrderButton: React.FC<PoApproveOrderButtonProps> = ({
  approved,
  blocked,
  blockedStatus,
  isBusy,
  onToggle,
  className,
  size = 'sm',
  withdrawLabel = 'Withdraw',
  approveLabel = 'Approve',
}) => (
  <BlockedActionButton
    size={size}
    variant={approved ? 'outline' : 'default'}
    blocked={!approved && blocked}
    blockedHint={
      !approved && blocked
        ? {
            title: blockedStatus.title,
            reason: blockedStatus.reason,
            bullets: blockedStatus.pendingLabels,
          }
        : undefined
    }
    isBusy={isBusy}
    onAction={onToggle}
    className={cn(
      !approved && !blocked && 'bg-brand-primary hover:bg-brand-primary-hover',
      className
    )}
  >
    {approved ? <X className="h-4 w-4 mr-1" /> : <Check className="h-4 w-4 mr-1" />}
    {approved ? withdrawLabel : approveLabel}
  </BlockedActionButton>
);

export default PoApproveOrderButton;
