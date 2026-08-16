import React, { useEffect, useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ShieldCheck, XCircle } from 'lucide-react';
import {
  ORDER_APPROVALS_BAR_CLASS,
  ORDER_APPROVALS_BAR_COLLAPSED_CLASS,
  ORDER_APPROVALS_BAR_EXPANDED_CLASS,
  ORDER_APPROVALS_BAR_OUTER_CLASS,
} from '../orderListConstants';

export interface OrderApprovalsBarSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface OrderApprovalsBarShellProps {
  id: string;
  /** Resets mobile expand state when order changes. */
  collapseResetKey?: string | number;
  highlighted?: boolean;
  onHighlightDismiss?: () => void;
  isVoided?: boolean;
  approvalSummary: OrderApprovalsBarSummary;
  /** Self Approve chip — visible in mobile collapsed row when assigned. */
  selfChip?: React.ReactNode;
  expandedContent: React.ReactNode;
  desktopRow: React.ReactNode;
  className?: string;
  /** When false, desktop row is omitted (e.g. work-order mobile-only shell). */
  showDesktop?: boolean;
  /** When false, mobile collapsed/expanded UI is omitted. */
  showMobile?: boolean;
}

export function OrderApprovalsSummary({
  approvalSummary,
}: {
  approvalSummary: OrderApprovalsBarSummary;
}) {
  return (
    <>
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
    </>
  );
}

export function OrderApprovalsVoidedBadge() {
  return (
    <Badge
      variant="outline"
      className="h-8 px-2.5 gap-1.5 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 font-normal"
    >
      <XCircle className="h-3.5 w-3.5" />
      Voided
    </Badge>
  );
}

const OrderApprovalsBarShell: React.FC<OrderApprovalsBarShellProps> = ({
  id,
  collapseResetKey,
  highlighted = false,
  onHighlightDismiss,
  isVoided = false,
  approvalSummary,
  selfChip,
  expandedContent,
  desktopRow,
  className,
  showDesktop = true,
  showMobile = true,
}) => {
  const expandedPanelId = useId();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [collapseResetKey]);

  useEffect(() => {
    if (highlighted) setExpanded(true);
  }, [highlighted]);

  return (
    <div
      id={id}
      className={cn(ORDER_APPROVALS_BAR_OUTER_CLASS, highlighted && 'po-scroll-target-highlight', className)}
      onMouseEnter={() => {
        if (highlighted) onHighlightDismiss?.();
      }}
    >
      <div className={cn(showDesktop ? ORDER_APPROVALS_BAR_CLASS : 'hidden')}>{desktopRow}</div>

      {showMobile ? (
        <>
          <div className={ORDER_APPROVALS_BAR_COLLAPSED_CLASS}>
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              <OrderApprovalsSummary approvalSummary={approvalSummary} />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {!isVoided ? selfChip : null}
              {isVoided ? (
                <OrderApprovalsVoidedBadge />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-expanded={expanded}
                  aria-controls={expandedPanelId}
                  aria-label={expanded ? 'Collapse approvals' : 'Expand approvals'}
                  onClick={() => setExpanded((v) => !v)}
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')}
                  />
                </Button>
              )}
            </div>
          </div>

          {!isVoided && expanded ? (
            <div id={expandedPanelId} className={ORDER_APPROVALS_BAR_EXPANDED_CLASS}>
              {expandedContent}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default OrderApprovalsBarShell;
