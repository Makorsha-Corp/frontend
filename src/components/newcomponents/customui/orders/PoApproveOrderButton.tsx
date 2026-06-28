import React from 'react';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import type { PoConfirmationsStatus } from './purchaseOrderMilestones';

export interface PoApproveOrderButtonProps {
  approved: boolean;
  blocked: boolean;
  blockedStatus: PoConfirmationsStatus;
  withdrawBlocked?: boolean;
  withdrawBlockedReason?: string;
  isBusy: boolean;
  onToggle: () => void;
  className?: string;
  size?: 'sm' | 'default';
  withdrawLabel?: string;
  approveLabel?: string;
  iconOnly?: boolean;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
}

const PoApproveOrderButton: React.FC<PoApproveOrderButtonProps> = ({
  approved,
  blocked,
  blockedStatus,
  withdrawBlocked = false,
  withdrawBlockedReason = 'Receiving has started — approval cannot be withdrawn',
  isBusy,
  onToggle,
  className,
  size = 'sm',
  withdrawLabel = 'Withdraw',
  approveLabel = 'Approve',
  iconOnly = false,
  popoverSide = 'top',
}) => {
  const approveBlocked = !approved && blocked;
  const withdrawIsBlocked = approved && withdrawBlocked;

  return (
  <BlockedActionButton
    size={size}
    variant={approved ? 'outline' : 'default'}
    blocked={approveBlocked || withdrawIsBlocked}
    blockedHint={
      withdrawIsBlocked
        ? {
            title: 'Cannot withdraw',
            reason: withdrawBlockedReason,
          }
        : approveBlocked
          ? {
              title: blockedStatus.title,
              reason: blockedStatus.reason,
              bullets: blockedStatus.pendingLabels,
            }
          : undefined
    }
    isBusy={isBusy}
    onAction={onToggle}
    popoverSide={popoverSide}
    className={cn(
      !approved && !blocked && 'bg-brand-primary hover:bg-brand-primary-hover',
      withdrawIsBlocked && 'opacity-60',
      iconOnly && 'px-0',
      className
    )}
    aria-label={approved ? withdrawLabel : approveLabel}
  >
    {approved ? <X className={cn('h-4 w-4', !iconOnly && 'mr-1')} /> : <Check className={cn('h-4 w-4', !iconOnly && 'mr-1')} />}
    {iconOnly ? <span className="sr-only">{approved ? withdrawLabel : approveLabel}</span> : approved ? withdrawLabel : approveLabel}
  </BlockedActionButton>
  );
};

export default PoApproveOrderButton;
