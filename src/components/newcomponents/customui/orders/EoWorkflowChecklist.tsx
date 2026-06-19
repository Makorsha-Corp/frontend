import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { SectionConfirmIcon } from './PoSectionConfirmButton';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseApprovalSummary } from '@/types/expenseOrder';
import { getEoChecklistProgress, type EoScrollSection } from './expenseOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export interface EoWorkflowChecklistProps {
  order: ExpenseOrder;
  itemCount: number;
  approvalSummary: ExpenseApprovalSummary;
  detailsConfirmed: boolean;
  itemsConfirmed: boolean;
  invoiceConfirmed: boolean;
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
  detailsConfirmed,
  itemsConfirmed,
  invoiceConfirmed,
  onScrollToSection,
  onMarkComplete,
  isMarkingComplete = false,
  className,
}) => {
  const progress = getEoChecklistProgress(order, itemCount, approvalSummary, {
    details_confirmed: detailsConfirmed,
    items_confirmed: itemsConfirmed,
    invoice_confirmed: invoiceConfirmed,
  });
  const { phase } = progress;

  const invoiceDescription = !progress.hasInvoice
    ? 'Create a draft invoice from this expense order'
    : !progress.invoiceConfirmed
      ? 'Finalize the invoice, then confirm the linked invoice section'
      : 'Invoice confirmed on this order';

  const renderCompletedPrepare = phase !== 'prepare';
  const renderCompletedApprovals = ['invoice', 'mark_complete', 'done'].includes(phase) && progress.approvalsComplete;
  const renderCompletedInvoice = ['mark_complete', 'done'].includes(phase) && progress.invoiceComplete;
  const renderCompletedMark = phase === 'done';

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
          {renderCompletedPrepare && (
            <CompletedStepRow
              title="Confirm details & expenses"
              badge={ratioBadge(progress.prepareRatio, 'green')}
            />
          )}

          {renderCompletedApprovals && (
            <CompletedStepRow
              title="Approvals"
              badge={ratioBadge(progress.approvalRatio, 'green')}
            />
          )}

          {renderCompletedInvoice && (
            <CompletedStepRow title="Invoice" badge={ratioBadge('Done', 'green')} />
          )}

          {renderCompletedMark && (
            <CompletedStepRow title="Mark complete" isLast={phase === 'done'} />
          )}

          {phase === 'prepare' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Confirm details & expenses"
                description="Confirm order details and expense lines using the checkmarks on each card"
                badge={ratioBadge(
                  progress.prepareRatio,
                  progress.prepareComplete ? 'green' : 'amber'
                )}
              />
              <div className="ml-10 space-y-1">
                {!progress.detailsConfirmed && (
                  <PrepareSubRow
                    label="Order details"
                    done={false}
                    hint={progress.hasDetails ? 'Ready to confirm' : 'Set category and date'}
                    onClick={() => onScrollToSection('details')}
                  />
                )}
                {!progress.itemsConfirmed && (
                  <PrepareSubRow
                    label="Expenses"
                    done={false}
                    hint={
                      progress.hasItems
                        ? `${itemCount} line${itemCount !== 1 ? 's' : ''}`
                        : 'Add at least one expense'
                    }
                    onClick={() => onScrollToSection('items')}
                  />
                )}
              </div>
            </div>
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

          {phase === 'invoice' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Create & confirm invoice"
                description={invoiceDescription}
                badge={ratioBadge(
                  progress.invoiceComplete ? 'Done' : progress.hasInvoice ? 'Draft' : 'None',
                  progress.invoiceComplete ? 'green' : 'amber'
                )}
              />
              <div className="ml-10 space-y-1">
                <PrepareSubRow
                  label="Linked invoice"
                  done={progress.invoiceComplete}
                  hint={progress.hasInvoice ? (progress.invoiceConfirmed ? 'Confirmed' : 'Pending') : 'Not created'}
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
                description="All steps are done. Close this expense order when ready."
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

          {phase === 'done' && (
            <div className="border-t border-border/60 bg-green-50/80 px-4 py-3 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Expense order is complete!
              </p>
              <p className="mt-0.5 text-xs text-green-700/90 dark:text-green-400/90">
                {order.completed_at
                  ? `Completed ${new Date(order.completed_at).toLocaleDateString()}`
                  : 'Invoice confirmed and order marked complete.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EoWorkflowChecklist;
