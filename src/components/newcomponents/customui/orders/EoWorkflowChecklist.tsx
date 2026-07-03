import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { SectionConfirmIcon } from './PoSectionConfirmButton';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseApprovalSummary } from '@/types/expenseOrder';
import {
  getEoChecklistProgress,
  paymentStatusLabel,
  paymentStatusBadgeTone,
  type EoScrollSection,
} from './expenseOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export interface EoWorkflowChecklistProps {
  order: ExpenseOrder;
  itemCount: number;
  approvalSummary: ExpenseApprovalSummary;
  linkedInvoice?: AccountInvoice | null;
  onScrollToSection: (section: EoScrollSection) => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  className?: string;
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

function PrepareSubRow({
  label,
  done,
  hint,
  onClick,
}: {
  label: string;
  done: boolean;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Go to ${label}`}
    >
      <SectionConfirmIcon confirmed={done} />
      <span className="flex-1 text-sm text-card-foreground">{label}</span>
      {hint ? (
        <span className="max-w-[40%] truncate text-xs text-muted-foreground">{hint}</span>
      ) : null}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

const EoWorkflowChecklist: React.FC<EoWorkflowChecklistProps> = ({
  order,
  itemCount,
  approvalSummary,
  linkedInvoice,
  onScrollToSection,
  onMarkComplete,
  isMarkingComplete = false,
  className,
}) => {
  const progress = getEoChecklistProgress(order, itemCount, approvalSummary, linkedInvoice);
  const { phase } = progress;

  const invoiceBlockedDescription = !order.account_id
    ? 'Set an account on this order so the invoice can be created automatically'
    : !progress.hasItems
      ? 'Add at least one expense line so the invoice can be created automatically'
      : 'Invoice will be created automatically once approvals are met';

  const renderCompletedApprovals = ['invoice_blocked', 'mark_complete', 'payment', 'done'].includes(phase) && progress.approvalsComplete;
  const renderCompletedInvoice = ['mark_complete', 'payment', 'done'].includes(phase) && progress.hasInvoice;
  const renderCompletedMark = ['payment', 'done'].includes(phase);

  const paymentDescription =
    progress.invoicePaymentStatus === 'partial'
      ? 'Partial payment recorded — pay the remaining invoice balance to mark this order as paid'
      : progress.invoicePaymentStatus === 'overdue'
        ? 'Payment is overdue — record the full invoice balance to mark this order as paid'
        : 'Payment not finished — record the full invoice balance to mark this order as paid';

  return (
    <Card className={cn('flex flex-col h-fit', className)}>
      <CardHeader className="pb-4 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Order Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="space-y-0 rounded-lg border border-border bg-muted/20 overflow-hidden">
          {renderCompletedApprovals && (
            <CompletedStepRow
              title="Approvals"
              badge={ratioBadge(progress.approvalRatio, 'green')}
            />
          )}

          {renderCompletedInvoice && (
            <CompletedStepRow title="Invoice" badge={ratioBadge(progress.invoiceFinalized ? 'Finalized' : 'Draft', 'green')} />
          )}

          {renderCompletedMark && (
            <CompletedStepRow title="Mark complete" isLast={phase === 'done'} />
          )}

          {phase === 'approval' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Approvals"
                description={
                  approvalSummary.required === 0
                    ? 'Add approvers in the bar above, then collect approvals'
                    : `Get ${progress.approvalRatio} approvals before invoicing`
                }
                badge={ratioBadge(progress.approvalRatio, progress.approvalsComplete ? 'green' : 'amber')}
              />
              <div className="ml-10 space-y-1">
                <PrepareSubRow
                  label="Get approvals"
                  done={progress.approvalsComplete}
                  hint={progress.approvalRatio}
                  onClick={() => onScrollToSection('approvals')}
                />
              </div>
            </div>
          )}

          {phase === 'invoice_blocked' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Waiting on invoice"
                description={invoiceBlockedDescription}
                badge={ratioBadge('None', 'amber')}
              />
              <div className="ml-10 space-y-1">
                <PrepareSubRow
                  label="Linked invoice"
                  done={false}
                  hint="Not created"
                  onClick={() => onScrollToSection('invoice')}
                />
              </div>
            </div>
          )}

          {phase === 'mark_complete' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Mark complete"
                description="Approvals are met and a draft invoice exists. Completing will finalize the invoice and close the order."
              />
              <div className="ml-10">
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  disabled={!onMarkComplete || isMarkingComplete}
                  onClick={onMarkComplete}
                >
                  {isMarkingComplete ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking complete…
                    </>
                  ) : (
                    'Mark expense complete'
                  )}
                </Button>
              </div>
            </div>
          )}

          {phase === 'payment' && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => onScrollToSection('invoice')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onScrollToSection('invoice');
              }}
              className="cursor-pointer space-y-3 border-b border-border/60 p-4 last:border-b-0"
            >
              <ChecklistStepHeader
                state="active"
                title="Record payment"
                description={paymentDescription}
                badge={ratioBadge(
                  paymentStatusLabel(progress.invoicePaymentStatus),
                  paymentStatusBadgeTone(progress.invoicePaymentStatus)
                )}
              />
            </div>
          )}

          {phase === 'done' && (
            <div className="border-t border-border/60 bg-green-50/80 px-4 py-3 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Expense order is complete!
              </p>
              <p className="mt-0.5 text-xs text-green-700/90 dark:text-green-400/90">
                Invoice confirmed, order closed, and payment recorded.
                {order.completed_at
                  ? ` Completed ${new Date(order.completed_at).toLocaleDateString()}.`
                  : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EoWorkflowChecklist;
