import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList, Loader2, XCircle } from 'lucide-react';
import type { WorkOrder, WorkOrderApprovalSummary } from '@/types/workOrder';

type StepVisualState = 'complete' | 'active' | 'pending';
type ChecklistPhase = 'approval' | 'start' | 'in_progress' | 'invoice_blocked' | 'complete' | 'done' | 'voided';

export interface WoWorkflowChecklistProps {
  order: WorkOrder;
  approvalSummary: WorkOrderApprovalSummary;
  onScrollToApprovals: () => void;
  onStart?: () => void;
  isStarting?: boolean;
  onComplete?: () => void;
  isCompleting?: boolean;
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
  return <div className="h-7 w-7 shrink-0 rounded-full border-2 border-muted-foreground/30 bg-background" aria-hidden />;
}

function CompletedStepRow({ title, badge, isLast = false }: { title: string; badge?: React.ReactNode; isLast?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', !isLast && 'border-b border-border/60')}>
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
        tone === 'muted' && 'border-border bg-muted/30 text-muted-foreground'
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

function derivePhase(order: WorkOrder, approvalSummary: WorkOrderApprovalSummary): ChecklistPhase {
  if (order.status === 'VOIDED') return 'voided';
  if (order.status === 'COMPLETED') return 'done';
  if (order.status === 'IN_PROGRESS') {
    if (order.account_id && !order.invoice_id) return 'invoice_blocked';
    return 'in_progress';
  }
  // DRAFT: approvals (if any are assigned) gate Start rather than being their own status.
  if (!approvalSummary.met) return 'approval';
  return 'start';
}

const WoWorkflowChecklist: React.FC<WoWorkflowChecklistProps> = ({
  order,
  approvalSummary,
  onScrollToApprovals,
  onStart,
  isStarting = false,
  onComplete,
  isCompleting = false,
  className,
}) => {
  const phase = derivePhase(order, approvalSummary);
  const approvalRatio =
    approvalSummary.required === 0 ? 'Not required' : `${approvalSummary.approved_count}/${approvalSummary.required}`;

  const renderCompletedApprovals = ['start', 'in_progress', 'invoice_blocked', 'done'].includes(phase);

  return (
    <Card className={cn('flex flex-col h-fit', className)}>
      <CardHeader className="pb-4 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Work Order Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <div className="space-y-0 rounded-lg border border-border bg-muted/20 overflow-hidden">
          {phase === 'voided' && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Work order voided</p>
                {order.void_note && <p className="text-xs text-muted-foreground mt-0.5">{order.void_note}</p>}
              </div>
            </div>
          )}

          {phase !== 'voided' && renderCompletedApprovals && (
            <CompletedStepRow title="Approvals" badge={ratioBadge(approvalRatio, 'green')} />
          )}

          {phase !== 'voided' && ['in_progress', 'invoice_blocked', 'done'].includes(phase) && (
            <CompletedStepRow title="Start work" isLast={phase === 'done'} />
          )}

          {phase === 'approval' && (
            <div className="space-y-3 p-4">
              <ChecklistStepHeader
                state="active"
                title="Approvals"
                description={
                  approvalSummary.required === 0
                    ? 'No approvers assigned — add some in the bar above if this order needs sign-off'
                    : `Get ${approvalRatio} approvals before work can start`
                }
                badge={ratioBadge(approvalRatio, 'amber')}
              />
              <div className="ml-10">
                <button
                  type="button"
                  onClick={onScrollToApprovals}
                  className="flex items-center gap-1 text-sm text-brand-primary hover:underline"
                >
                  Go to approvals
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {phase === 'start' && (
            <div className="space-y-3 p-4">
              <ChecklistStepHeader
                state="active"
                title="Start work"
                description="Approved and ready. Starting will consume any inventory items marked for this order."
              />
              <div className="ml-10">
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  disabled={!onStart || isStarting}
                  onClick={onStart}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    'Start work'
                  )}
                </Button>
              </div>
            </div>
          )}

          {phase === 'invoice_blocked' && (
            <div className="p-4">
              <ChecklistStepHeader
                state="active"
                title="Waiting on invoice"
                description="This work is billed to an external account — create an invoice before marking it complete."
                badge={ratioBadge('None', 'amber')}
              />
            </div>
          )}

          {phase === 'in_progress' && (
            <div className="space-y-3 p-4">
              <ChecklistStepHeader
                state="active"
                title="Mark complete"
                description="Work is in progress. Completing will log the finished work against its target and (if billed) finalize the invoice."
              />
              <div className="ml-10">
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  disabled={!onComplete || isCompleting}
                  onClick={onComplete}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing…
                    </>
                  ) : (
                    'Mark complete'
                  )}
                </Button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="border-t border-border/60 bg-green-50/80 px-4 py-3 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Work order is complete!</p>
              <p className="mt-0.5 text-xs text-green-700/90 dark:text-green-400/90">
                {order.completed_at ? `Completed ${new Date(order.completed_at).toLocaleDateString()}.` : ''}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WoWorkflowChecklist;
