import React, { useEffect, useRef, useState } from 'react';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';
import type { OrderApprovalBlockedStatus } from './orderApprovalTypes';

const PILL_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };
const LABEL_TRANSITION = { duration: 0.12, ease: 'easeOut' as const };
const CONTENT_FADE = { duration: 0.12, ease: 'easeOut' as const };
const APPROVE_WIDTH = 88;
const ICON_WIDTH = 28;
const WITHDRAW_WIDTH = 96;

export type OrderApproveInteractionMode = 'desktop' | 'mobile';

export interface OrderApproveActionButtonProps {
  actionButtonId?: string;
  approved: boolean;
  blocked: boolean;
  blockedStatus: OrderApprovalBlockedStatus;
  withdrawBlocked?: boolean;
  withdrawBlockedReason?: string;
  isBusy: boolean;
  onToggle: () => void;
  className?: string;
  withdrawLabel?: string;
  approveLabel?: string;
  interactionMode?: OrderApproveInteractionMode;
  popoverSide?: 'top' | 'right' | 'bottom' | 'left';
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
}

type PillContentKey = 'busy' | 'approve' | 'approved' | 'withdraw';

const OrderApproveActionButton: React.FC<OrderApproveActionButtonProps> = ({
  actionButtonId,
  approved,
  blocked,
  blockedStatus,
  withdrawBlocked = false,
  withdrawBlockedReason = 'Order is complete — approval cannot be withdrawn',
  isBusy,
  onToggle,
  className,
  withdrawLabel = 'Withdraw',
  approveLabel = 'Approve',
  interactionMode = 'desktop',
  popoverSide = 'top',
  highlighted = false,
  onHighlightDismiss,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [withdrawHover, setWithdrawHover] = useState(false);
  const [withdrawTransitionLock, setWithdrawTransitionLock] = useState(false);
  const prevBusyRef = useRef(isBusy);

  const isDesktop = interactionMode === 'desktop';
  const approveBlocked = !approved && blocked;
  const withdrawIsBlocked = approved && withdrawBlocked;
  const canHoverWithdraw = approved && isDesktop && !withdrawIsBlocked;

  const showWithdrawExpanded = confirmOpen || (canHoverWithdraw && withdrawHover);
  const showWithdrawVisual = showWithdrawExpanded || withdrawTransitionLock;

  const pillWidth = !approved
    ? withdrawTransitionLock
      ? WITHDRAW_WIDTH
      : APPROVE_WIDTH
    : showWithdrawVisual
      ? WITHDRAW_WIDTH
      : ICON_WIDTH;

  useEffect(() => {
    if (!approved) {
      setWithdrawTransitionLock(false);
    } else if (prevBusyRef.current && !isBusy && withdrawTransitionLock) {
      setWithdrawTransitionLock(false);
    }
    prevBusyRef.current = isBusy;
  }, [approved, isBusy, withdrawTransitionLock]);

  const handleApprove = () => {
    if (isBusy || approveBlocked) return;
    onToggle();
  };

  const handleWithdrawRequest = () => {
    if (isBusy || withdrawIsBlocked) return;
    setConfirmOpen(true);
  };

  const handleConfirmOpenChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) setWithdrawHover(false);
  };

  const handleConfirmWithdraw = () => {
    handleConfirmOpenChange(false);
    setWithdrawTransitionLock(true);
    onToggle();
  };

  const handlePrimaryClick = () => {
    if (approved) {
      handleWithdrawRequest();
    } else {
      handleApprove();
    }
  };

  const pillClassName = cn(
    'h-7 w-full shrink-0 overflow-hidden border-0 shadow-none !rounded-full transition-colors duration-200',
    !approved &&
      !approveBlocked &&
      'gap-1 px-2.5 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground',
    !approved && approveBlocked && 'gap-1 px-2.5 bg-brand-primary/70 text-primary-foreground',
    approved &&
      !showWithdrawVisual &&
      'p-0 bg-green-600 text-white hover:bg-green-600',
    approved &&
      showWithdrawVisual &&
      'gap-1 px-2.5 bg-destructive text-white hover:bg-destructive/90',
    withdrawIsBlocked && approved && 'opacity-60',
    highlighted && 'po-scroll-target-highlight',
    className
  );

  const contentKey: PillContentKey = isBusy
    ? 'busy'
    : !approved
      ? 'approve'
      : showWithdrawVisual
        ? 'withdraw'
        : 'approved';

  const ariaLabel = isBusy
    ? approved
      ? withdrawLabel
      : approveLabel
    : !approved
      ? approveLabel
      : showWithdrawVisual
        ? withdrawLabel
        : 'Approved — tap to withdraw';

  const renderPillContent = () => (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={contentKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={CONTENT_FADE}
        className={cn(
          'flex w-full items-center justify-center',
          contentKey === 'approve' || contentKey === 'withdraw' ? 'gap-1' : ''
        )}
      >
        {contentKey === 'busy' ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : contentKey === 'approve' ? (
          <>
            <Check className="h-4 w-4 shrink-0" />
            <motion.span
              initial={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={LABEL_TRANSITION}
              className="overflow-hidden whitespace-nowrap text-xs font-medium"
            >
              {approveLabel}
            </motion.span>
          </>
        ) : contentKey === 'withdraw' ? (
          <>
            <X className="h-4 w-4 shrink-0" />
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={LABEL_TRANSITION}
              className="overflow-hidden whitespace-nowrap text-xs font-medium"
            >
              {withdrawLabel}
            </motion.span>
          </>
        ) : (
          <Check className="h-4 w-4 shrink-0" />
        )}
      </motion.div>
    </AnimatePresence>
  );

  if (approveBlocked || withdrawIsBlocked) {
    return (
      <motion.div
        initial={false}
        animate={{ width: approved ? ICON_WIDTH : APPROVE_WIDTH }}
        transition={PILL_SPRING}
        className="inline-flex shrink-0 overflow-hidden"
      >
        <BlockedActionButton
          id={actionButtonId}
          size="sm"
          variant="default"
          blocked
          blockedHint={
            withdrawIsBlocked
              ? { title: 'Cannot withdraw', reason: withdrawBlockedReason }
              : {
                  title: blockedStatus.title,
                  reason: blockedStatus.reason,
                  bullets: blockedStatus.pendingLabels,
                }
          }
          isBusy={isBusy}
          onAction={() => undefined}
          popoverSide={popoverSide}
          className={pillClassName}
          onMouseEnter={() => {
            if (highlighted) onHighlightDismiss?.();
          }}
          aria-label={approved ? withdrawLabel : approveLabel}
        >
          {approved ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <Check className="h-4 w-4 shrink-0" />
              <span className="overflow-hidden whitespace-nowrap text-xs font-medium">{approveLabel}</span>
            </>
          )}
        </BlockedActionButton>
      </motion.div>
    );
  }

  const pillShell = (
    <motion.div
      initial={false}
      animate={{ width: pillWidth }}
      transition={PILL_SPRING}
      className="inline-flex shrink-0 overflow-hidden"
      onMouseEnter={() => {
        if (canHoverWithdraw) setWithdrawHover(true);
        if (highlighted) onHighlightDismiss?.();
      }}
      onMouseLeave={() => {
        if (canHoverWithdraw) setWithdrawHover(false);
      }}
    >
      <Button
        id={actionButtonId}
        type="button"
        size="sm"
        disabled={isBusy}
        className={pillClassName}
        onClick={handlePrimaryClick}
        aria-label={ariaLabel}
        aria-haspopup={approved ? 'dialog' : undefined}
        aria-expanded={approved ? confirmOpen : undefined}
      >
        {renderPillContent()}
      </Button>
    </motion.div>
  );

  return (
    <Popover open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
      <PopoverAnchor asChild>{pillShell}</PopoverAnchor>
      <PopoverContent side={popoverSide} align="end" className="w-64 space-y-3 p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-card-foreground">Withdraw approval?</p>
          <p className="text-xs text-muted-foreground">
            Your approval will be removed from this order.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => handleConfirmOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isBusy}
            onClick={handleConfirmWithdraw}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : withdrawLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrderApproveActionButton;
