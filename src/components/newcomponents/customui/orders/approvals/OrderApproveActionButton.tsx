import React from 'react';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { OrderApprovalBlockedStatus } from './orderApprovalTypes';

const PILL_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };
const LABEL_TRANSITION = { duration: 0.12, ease: 'easeOut' as const };
const EXPANDED_WIDTH = 88;
const COMPACT_WIDTH = 28;

export interface OrderApproveActionButtonProps {
  actionButtonId?: string;
  approved: boolean;
  blocked: boolean;
  blockedStatus: OrderApprovalBlockedStatus;
  withdrawBlocked?: boolean;
  withdrawBlockedReason?: string;
  withdrawHoverReason?: string;
  isBusy: boolean;
  onToggle: () => void;
  className?: string;
  withdrawLabel?: string;
  approveLabel?: string;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
}

const OrderApproveActionButton: React.FC<OrderApproveActionButtonProps> = ({
  actionButtonId,
  approved,
  blocked,
  blockedStatus,
  withdrawBlocked = false,
  withdrawBlockedReason = 'Order is complete — approval cannot be withdrawn',
  withdrawHoverReason = 'Remove your approval from this order.',
  isBusy,
  onToggle,
  className,
  withdrawLabel = 'Withdraw',
  approveLabel = 'Approve',
  popoverSide = 'top',
  highlighted = false,
  onHighlightDismiss,
}) => {
  const compact = approved;
  const approveBlocked = !approved && blocked;
  const withdrawIsBlocked = approved && withdrawBlocked;
  const actionBlocked = approveBlocked || withdrawIsBlocked;

  const hoverHint =
    compact && !actionBlocked ? { title: withdrawLabel, reason: withdrawHoverReason } : undefined;

  return (
    <motion.div
      initial={false}
      animate={{ width: compact ? COMPACT_WIDTH : EXPANDED_WIDTH }}
      transition={PILL_SPRING}
      className="inline-flex shrink-0 overflow-hidden"
    >
      <BlockedActionButton
        id={actionButtonId}
        size="sm"
        variant={approved ? 'outline' : 'default'}
        blocked={actionBlocked}
        blockedHint={
          withdrawIsBlocked
            ? { title: 'Cannot withdraw', reason: withdrawBlockedReason }
            : approveBlocked
              ? {
                  title: blockedStatus.title,
                  reason: blockedStatus.reason,
                  bullets: blockedStatus.pendingLabels,
                }
              : undefined
        }
        hoverHint={hoverHint}
        isBusy={isBusy}
        onAction={onToggle}
        popoverSide={popoverSide}
        className={cn(
          'h-7 w-full shrink-0 rounded-full overflow-hidden',
          compact ? 'p-0' : 'gap-1 px-2.5',
          !approved && !blocked && 'bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground',
          withdrawIsBlocked && 'opacity-60',
          compact &&
            'border-muted-foreground/40 text-muted-foreground hover:text-destructive hover:border-destructive/40',
          highlighted && 'po-scroll-target-highlight',
          className
        )}
        onMouseEnter={() => {
          if (highlighted) onHighlightDismiss?.();
        }}
        aria-label={approved ? withdrawLabel : approveLabel}
      >
        {approved ? (
          <X className="h-4 w-4 shrink-0" />
        ) : (
          <>
            <Check className="h-4 w-4 shrink-0" />
            <AnimatePresence initial={false}>
              {!approved ? (
                <motion.span
                  key="approve-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={LABEL_TRANSITION}
                  className="overflow-hidden whitespace-nowrap text-xs font-medium"
                >
                  {approveLabel}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </>
        )}
        {compact ? <span className="sr-only">{withdrawLabel}</span> : null}
      </BlockedActionButton>
    </motion.div>
  );
};

export default OrderApproveActionButton;
