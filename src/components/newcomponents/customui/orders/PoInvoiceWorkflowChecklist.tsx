import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { SectionConfirmIcon } from './PoSectionConfirmButton';
import type { ApprovalSummary, PurchaseOrderItem } from '@/types/purchaseOrder';
import type { PoConfirmationsStatus, PoLinkedInvoiceStatus } from './purchaseOrderMilestones';
import type { PoSectionConfirmKey } from './purchaseOrderMilestones';
import { isPoInvoiceFinalized } from './purchaseOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export type PoInvoiceScrollSection = PoSectionConfirmKey;

type ChecklistPhase = 'sections' | 'approval' | 'finalize' | 'receiving' | 'payment' | 'complete' | 'done';

interface SectionRow {
  section: PoInvoiceScrollSection;
  label: string;
  confirmed: boolean;
  readinessHint?: string;
}

export interface PoInvoiceWorkflowChecklistProps {
  invoiceId: number | null;
  invoiceStatus: PoLinkedInvoiceStatus;
  hasSupplier: boolean;
  confirmationsStatus: PoConfirmationsStatus;
  sections: SectionRow[];
  approvalSummary: ApprovalSummary;
  items: PurchaseOrderItem[];
  invoicePaymentStatus?: string | null;
  orderCompleted: boolean;
  markCompleteReadiness?: { ok: boolean; reason?: string };
  onMarkOrderComplete?: () => void;
  isMarkingOrderComplete?: boolean;
  destinationType?: string;
  storageFactoryName?: string | null;
  onScrollToSection: (section: PoInvoiceScrollSection) => void;
  onScrollToFinalize?: () => void;
  onScrollToManageApprovals?: () => void;
  onScrollToReceiving?: () => void;
  onScrollToPayments?: () => void;
  className?: string;
}

interface ChecklistStepProps {
  clickable?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  children: React.ReactNode;
}

function ChecklistStep({
  clickable,
  onClick,
  ariaLabel,
  className,
  children,
}: ChecklistStepProps) {
  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          'w-full p-4 space-y-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          className
        )}
      >
        {children}
      </button>
    );
  }

  return <div className={cn('p-4 space-y-3', className)}>{children}</div>;
}

function StepCircle({ state }: { state: StepVisualState }) {
  if (state === 'complete') {
    return (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white ring-2 ring-brand-primary/20"
        aria-hidden
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </div>
    );
  }
  if (state === 'active') {
    return (
      <div
        className="h-7 w-7 shrink-0 rounded-full border-2 border-brand-primary bg-background ring-2 ring-brand-primary/20"
        aria-hidden
      />
    );
  }
  return (
    <div
      className="h-7 w-7 shrink-0 rounded-full border-2 border-muted-foreground/30 bg-background"
      aria-hidden
    />
  );
}

function ChecklistStepHeader({
  state,
  title,
  description,
  badge,
}: {
  state: StepVisualState;
  title: string;
  description: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <StepCircle state={state} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-card-foreground">{title}</p>
          {badge}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CompletedStepRow({
  title,
  badge,
  isLast = false,
}: {
  title: string;
  badge?: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        !isLast && 'border-b border-border/60'
      )}
    >
      <StepCircle state="complete" />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <p className="text-sm font-medium text-card-foreground">{title}</p>
        {badge}
      </div>
    </div>
  );
}

function ratioBadge(value: string, tone: 'green' | 'amber' | 'muted' = 'green') {
  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 font-normal tabular-nums',
        tone === 'green' && 'status-badge status-badge--confirmed',
        tone === 'amber' && 'status-badge status-badge--unconfirmed',
        tone === 'muted' &&
          'border-border bg-muted/30 text-muted-foreground dark:border-border dark:bg-muted/20 dark:text-muted-foreground'
      )}
    >
      {value}
    </Badge>
  );
}

function getReceivingTotals(items: PurchaseOrderItem[]) {
  const totalOrdered = items.reduce((sum, item) => sum + Number(item.quantity_ordered), 0);
  const totalReceived = items.reduce((sum, item) => sum + Number(item.quantity_received), 0);
  const receivingComplete =
    items.length > 0 && totalReceived >= totalOrdered && totalOrdered > 0;

  return { totalOrdered, totalReceived, receivingComplete };
}

function getChecklistPhase(
  sectionsComplete: boolean,
  approvalComplete: boolean,
  isFinalized: boolean,
  receivingComplete: boolean,
  orderCompleted: boolean,
  paymentComplete: boolean
): ChecklistPhase {
  if (!sectionsComplete) return 'sections';
  if (!approvalComplete && !isFinalized) return 'approval';
  if (!isFinalized) return 'finalize';
  if (!receivingComplete) return 'receiving';
  if (!orderCompleted) return 'complete';
  if (!paymentComplete) return 'payment';
  return 'done';
}

function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'partial':
      return 'Partial';
    case 'overdue':
      return 'Overdue';
    case 'unpaid':
      return 'Not paid';
    default:
      return 'Not paid';
  }
}

function paymentStatusBadgeTone(
  status: string | null | undefined
): 'green' | 'amber' | 'muted' {
  if (status === 'paid') return 'green';
  if (status === 'partial' || status === 'overdue' || status === 'unpaid') return 'amber';
  return 'muted';
}

const PoInvoiceWorkflowChecklist: React.FC<PoInvoiceWorkflowChecklistProps> = ({
  invoiceId,
  invoiceStatus,
  hasSupplier,
  confirmationsStatus,
  sections,
  approvalSummary,
  items,
  invoicePaymentStatus = null,
  orderCompleted,
  markCompleteReadiness = { ok: true },
  onMarkOrderComplete,
  isMarkingOrderComplete = false,
  destinationType,
  storageFactoryName,
  onScrollToSection,
  onScrollToFinalize,
  onScrollToManageApprovals,
  onScrollToReceiving,
  onScrollToPayments,
  className,
}) => {
  const hasDraft = invoiceStatus === 'draft' && invoiceId != null;
  const isFinalized = isPoInvoiceFinalized(invoiceStatus) && invoiceId != null;
  const sectionsComplete = confirmationsStatus.allConfirmed;
  const approvalComplete = approvalSummary.met || isFinalized;
  const { totalOrdered, totalReceived, receivingComplete } = getReceivingTotals(items);
  const paymentComplete = invoicePaymentStatus === 'paid';
  const phase = getChecklistPhase(
    sectionsComplete,
    approvalComplete,
    isFinalized,
    receivingComplete,
    orderCompleted,
    paymentComplete
  );

  const confirmedCount = sections.filter((s) => s.confirmed).length;
  const pendingSections = sections.filter((s) => !s.confirmed);

  const approvalRatio = `${approvalSummary.approved_count}/${approvalSummary.required}`;
  const sectionsRatio = `${confirmedCount}/${sections.length}`;
  const receivingRatio =
    items.length > 0 ? `${totalReceived}/${totalOrdered}` : `0/0`;

  const completeStepDescription =
    destinationType === 'storage'
      ? storageFactoryName
        ? `All items are received. Close this order to add items to ${storageFactoryName} storage. The order moves to Complete; payment status syncs from the linked invoice.`
        : 'All items are received. Close this order to add items to factory storage. The order moves to Complete; payment status syncs from the linked invoice.'
      : 'All items are received. Close this order to move it to Complete. If the invoice is already paid, the order is marked paid automatically.';

  const renderCompletedSections = phase !== 'sections';
  const renderCompletedApproval = ['finalize', 'receiving', 'complete', 'payment', 'done'].includes(phase);
  const renderCompletedFinalize = ['receiving', 'complete', 'payment', 'done'].includes(phase);
  const renderCompletedReceiving = ['complete', 'payment', 'done'].includes(phase);
  const renderCompletedMarkOrder = ['payment', 'done'].includes(phase);
  const renderCompletedPayment = phase === 'done' && paymentComplete;

  const approvalDescription = !sectionsComplete
    ? confirmationsStatus.reason
    : !hasDraft
      ? 'Draft invoice syncs automatically once all sections are confirmed'
      : 'Get required approvals in the bar above';

  const finalizeDescription = hasDraft
    ? 'Confirm in the Linked Invoice card to post payable and lock the order'
    : 'Confirm all sections — draft invoice syncs automatically after that';

  const receivingDescription =
    items.length === 0
      ? 'Add line items before recording receiving'
      : totalReceived <= 0
        ? 'Record quantities received on order items'
        : receivingComplete
          ? 'All ordered units have been received'
          : `${totalOrdered - totalReceived} unit(s) still outstanding across this order`;

  const paymentDescription =
    invoicePaymentStatus === 'partial'
      ? 'Partial payment recorded — pay the remaining invoice balance to mark this order as paid'
      : invoicePaymentStatus === 'overdue'
        ? 'Payment is overdue — record the full invoice balance to mark this order as paid'
        : 'Payment not finished — record the full invoice balance to mark this order as paid';

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-4 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Order Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="space-y-0 rounded-lg border border-border bg-muted/20 overflow-hidden">
          {renderCompletedSections && (
            <CompletedStepRow
              title="Confirm sections"
              badge={ratioBadge(sectionsRatio, 'green')}
            />
          )}

          {renderCompletedApproval && (
            <CompletedStepRow
              title="Order approval"
              badge={ratioBadge(approvalRatio, 'green')}
            />
          )}

          {renderCompletedFinalize && (
            <CompletedStepRow title="Invoice finalized" />
          )}

          {renderCompletedReceiving && (
            <CompletedStepRow
              title="Received items"
              badge={ratioBadge(receivingRatio, 'green')}
            />
          )}

          {renderCompletedMarkOrder && (
            <CompletedStepRow title="Mark order complete" />
          )}

          {renderCompletedPayment && (
            <CompletedStepRow
              title="Record payment"
              badge={ratioBadge(paymentStatusLabel(invoicePaymentStatus), 'green')}
              isLast={phase === 'done'}
            />
          )}

          {phase === 'sections' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Confirm sections"
                description="Confirm each section using the checkmarks on the cards"
                badge={ratioBadge(sectionsRatio, sectionsComplete ? 'green' : 'amber')}
              />
              <div className="ml-10 space-y-1">
                {pendingSections.map(({ section, label, readinessHint }) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => onScrollToSection(section)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Go to ${label} section`}
                  >
                    <SectionConfirmIcon confirmed={false} />
                    <span className="flex-1 text-sm text-card-foreground">{label}</span>
                    {readinessHint && (
                      <span className="max-w-[40%] truncate text-xs text-muted-foreground">
                        {readinessHint}
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'approval' && (
            <ChecklistStep
              clickable={Boolean(onScrollToManageApprovals)}
              onClick={onScrollToManageApprovals}
              ariaLabel="Go to approvals"
              className={cn(
                'border-b border-border/60 last:border-b-0',
                onScrollToManageApprovals && 'cursor-pointer'
              )}
            >
              <ChecklistStepHeader
                state="active"
                title="Order approval"
                description={approvalDescription}
                badge={ratioBadge(approvalRatio, approvalComplete ? 'green' : 'amber')}
              />
            </ChecklistStep>
          )}

          {phase === 'finalize' && (
            <ChecklistStep
              clickable={Boolean(onScrollToFinalize)}
              onClick={onScrollToFinalize}
              ariaLabel="Go to finalize invoice"
              className={cn(
                'border-b border-border/60 last:border-b-0',
                onScrollToFinalize && 'cursor-pointer'
              )}
            >
              <ChecklistStepHeader
                state="active"
                title="Finalize invoice"
                description={finalizeDescription}
                badge={ratioBadge('Ready', 'amber')}
              />
            </ChecklistStep>
          )}

          {phase === 'receiving' && (
            <ChecklistStep
              clickable={Boolean(onScrollToReceiving)}
              onClick={onScrollToReceiving}
              ariaLabel="Go to order items receiving"
              className={cn('last:border-b-0', onScrollToReceiving && 'cursor-pointer')}
            >
              <ChecklistStepHeader
                state="active"
                title="Record receiving"
                description={receivingDescription}
                badge={ratioBadge(
                  items.length > 0 ? receivingRatio : '0/0',
                  totalReceived > 0 && !receivingComplete ? 'amber' : 'muted'
                )}
              />
            </ChecklistStep>
          )}

          {phase === 'payment' && (
            <ChecklistStep
              clickable={Boolean(onScrollToPayments)}
              onClick={onScrollToPayments}
              ariaLabel="Go to invoice payments"
              className={cn('last:border-b-0', onScrollToPayments && 'cursor-pointer')}
            >
              <ChecklistStepHeader
                state="active"
                title="Record payment"
                description={paymentDescription}
                badge={ratioBadge(
                  paymentStatusLabel(invoicePaymentStatus),
                  paymentStatusBadgeTone(invoicePaymentStatus)
                )}
              />
            </ChecklistStep>
          )}

          {phase === 'complete' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Mark order complete"
                description={completeStepDescription}
              />
              <div className="ml-10 space-y-2">
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  disabled={
                    !onMarkOrderComplete || isMarkingOrderComplete || !markCompleteReadiness.ok
                  }
                  onClick={onMarkOrderComplete}
                >
                  {isMarkingOrderComplete ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking complete…
                    </>
                  ) : (
                    'Mark order complete'
                  )}
                </Button>
                {!markCompleteReadiness.ok && markCompleteReadiness.reason ? (
                  <p className="text-xs text-muted-foreground">{markCompleteReadiness.reason}</p>
                ) : null}
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="border-t border-border/60 bg-green-50/80 px-4 py-3 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Order is complete!
              </p>
              <p className="mt-0.5 text-xs text-green-700/90 dark:text-green-400/90">
                All sections confirmed, invoice finalized, items received, order closed, and payment
                recorded.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PoInvoiceWorkflowChecklist;
