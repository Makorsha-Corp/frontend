import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { SectionConfirmIcon } from './PoSectionConfirmButton';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';
import type { TransferApprovalSummary } from '@/types/transferOrder';
import {
  getTrChecklistProgress,
  type TrScrollSection,
} from './transferOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export interface TrWorkflowChecklistProps {
  order: TransferOrder;
  items: TransferOrderItem[];
  approvalSummary: TransferApprovalSummary;
  routeConfirmed: boolean;
  itemsConfirmed: boolean;
  onScrollToSection: (section: TrScrollSection) => void;
  onManageTransfers?: () => void;
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

const TrWorkflowChecklist: React.FC<TrWorkflowChecklistProps> = ({
  order,
  items,
  approvalSummary,
  routeConfirmed,
  itemsConfirmed,
  onScrollToSection,
  onManageTransfers,
  onMarkComplete,
  isMarkingComplete = false,
  className,
}) => {
  const progress = getTrChecklistProgress(
    order,
    items,
    approvalSummary,
    { route_confirmed: routeConfirmed, items_confirmed: itemsConfirmed }
  );
  const { phase } = progress;

  const executeDescription = !progress.approvalsComplete
    ? approvalSummary.required === 0
      ? 'Add approvers in the bar above, then record item transfers'
      : `Get ${progress.approvalRatio} approvals, then record item transfers`
    : progress.transfersComplete
      ? 'All line items have been transferred'
      : items.length === 0
        ? 'Add line items before recording transfers'
        : `${progress.transferRatio} line items transferred — open Manage transfers to record`;

  const renderCompletedPrepare = phase !== 'prepare';
  const renderCompletedApprovals = ['mark_complete', 'done'].includes(phase) && progress.approvalsComplete;
  const renderCompletedTransfers = ['mark_complete', 'done'].includes(phase) && progress.transfersComplete;
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
              title="Prepare transfer"
              badge={ratioBadge(progress.prepareRatio, 'green')}
            />
          )}

          {renderCompletedApprovals && (
            <CompletedStepRow
              title="Approvals"
              badge={ratioBadge(progress.approvalRatio, 'green')}
            />
          )}

          {renderCompletedTransfers && (
            <CompletedStepRow
              title="Items transferred"
              badge={ratioBadge(progress.transferRatio, 'green')}
            />
          )}

          {renderCompletedMark && (
            <CompletedStepRow title="Mark complete" isLast={phase === 'done'} />
          )}

          {phase === 'prepare' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Prepare transfer"
                description="Confirm order details and transfer items using the checkmarks on each card"
                badge={ratioBadge(
                  progress.prepareRatio,
                  progress.prepareComplete ? 'green' : 'amber'
                )}
              />
              <div className="ml-10 space-y-1">
                {!progress.routeConfirmed && (
                  <PrepareSubRow
                    label="Order details"
                    done={false}
                    hint={
                      progress.routeDefined ? 'Ready to confirm' : 'Set source and destination'
                    }
                    onClick={() => onScrollToSection('route')}
                  />
                )}
                {!progress.itemsConfirmed && (
                  <PrepareSubRow
                    label="Transfer items"
                    done={false}
                    hint={
                      progress.hasItems
                        ? `${items.length} item${items.length !== 1 ? 's' : ''}`
                        : 'Add at least one item'
                    }
                    onClick={() => onScrollToSection('items')}
                  />
                )}
              </div>
            </div>
          )}

          {phase === 'execute' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Approvals & execute"
                description={executeDescription}
                badge={ratioBadge(
                  progress.transfersComplete ? progress.transferRatio : progress.approvalRatio,
                  progress.approvalsComplete && progress.transfersComplete ? 'green' : 'amber'
                )}
              />
              <div className="ml-10 space-y-1">
                <PrepareSubRow
                  label="Get approvals"
                  done={progress.approvalsComplete}
                  hint={progress.approvalRatio}
                  onClick={() => onScrollToSection('approvals')}
                />
                <PrepareSubRow
                  label="Record item transfers"
                  done={progress.transfersComplete}
                  hint={progress.transferRatio}
                  onClick={() => (onManageTransfers ? onManageTransfers() : onScrollToSection('items'))}
                />
              </div>
            </div>
          )}

          {phase === 'mark_complete' && (
            <div className="space-y-3 border-b border-border/60 p-4 last:border-b-0">
              <ChecklistStepHeader
                state="active"
                title="Mark complete"
                description="All items are transferred. Close this transfer order when ready."
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
                    'Mark transfer complete'
                  )}
                </Button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="border-t border-border/60 bg-green-50/80 px-4 py-3 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Transfer is complete!
              </p>
              <p className="mt-0.5 text-xs text-green-700/90 dark:text-green-400/90">
                {order.completed_at
                  ? `Completed ${new Date(order.completed_at).toLocaleDateString()}`
                  : 'All items transferred and order marked complete.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrWorkflowChecklist;
