import React from 'react';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import type { SoConfirmationsStatus } from './salesOrderMilestones';

export interface SoApproveOrderButtonProps {
  approved: boolean;
  blocked: boolean;
  blockedStatus: SoConfirmationsStatus;
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

const SoApproveOrderButton: React.FC<SoApproveOrderButtonProps> = ({
  approved,
  blocked,
  blockedStatus,
  withdrawBlocked = false,
  withdrawBlockedReason = 'Order is complete — approval cannot be withdrawn',
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
  const actionBlocked = approveBlocked || withdrawIsBlocked;

  const hoverHint =
    iconOnly && !actionBlocked
      ? approved
        ? { title: withdrawLabel, reason: 'Remove your approval from this sales order.' }
        : { title: approveLabel, reason: 'Record your approval on this sales order.' }
      : undefined;

  return (
    <BlockedActionButton
      id="so-approve-order-btn"
      size={iconOnly ? 'icon' : size}
      variant={approved ? 'outline' : 'default'}
      blocked={actionBlocked}
      blockedHint={
        withdrawIsBlocked
          ? { title: 'Cannot withdraw', reason: withdrawBlockedReason }
          : approveBlocked
            ? { title: blockedStatus.title, reason: blockedStatus.reason, bullets: blockedStatus.pendingLabels }
            : undefined
      }
      hoverHint={hoverHint}
      isBusy={isBusy}
      onAction={onToggle}
      popoverSide={popoverSide}
      className={cn(
        !approved && !blocked && 'bg-brand-primary hover:bg-brand-primary-hover',
        withdrawIsBlocked && 'opacity-60',
        iconOnly && 'h-7 w-7 shrink-0 rounded-full p-0',
        approved && iconOnly && 'border-muted-foreground/40 text-muted-foreground hover:text-destructive hover:border-destructive/40',
        className
      )}
      aria-label={approved ? withdrawLabel : approveLabel}
    >
      {approved ? <X className={cn('h-4 w-4', !iconOnly && 'mr-1')} /> : <Check className={cn('h-4 w-4', !iconOnly && 'mr-1')} />}
      {iconOnly ? <span className="sr-only">{approved ? withdrawLabel : approveLabel}</span> : approved ? withdrawLabel : approveLabel}
    </BlockedActionButton>
  );
};

export default SoApproveOrderButton;
