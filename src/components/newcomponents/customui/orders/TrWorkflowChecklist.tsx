import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ClipboardList, Loader2 } from 'lucide-react';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';
import type { TransferApprovalSummary } from '@/types/transferOrder';
import {
  getTrChecklistProgress,
} from './transferOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export interface TrWorkflowChecklistProps {
  order: TransferOrder;
  items: TransferOrderItem[];
  approvalSummary: TransferApprovalSummary;
  onScrollToManageApprovals?: () => void;
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
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

const TrWorkflowChecklist: React.FC<TrWorkflowChecklistProps> = ({
  order,
  items,
  approvalSummary,
  onScrollToManageApprovals,
  onMarkComplete,
  isMarkingComplete = false,
  className,
}) => {
  const progress = getTrChecklistProgress(order, items, approvalSummary);
  const { phase } = progress;

  const approvalRatio = `${approvalSummary.approved_count}/${approvalSummary.required}`;

  const approvalDescription = !progress.hasItems
    ? 'Add line items before requesting approval'
    : !progress.routeDefined
      ? 'Set source and destination before requesting approval'
      : 'Get required approvals in the bar above';

  const renderCompletedApproval = ['complete', 'done'].includes(phase) && progress.approvalsComplete;
  const renderCompletedMarkOrder = phase === 'done';

  const completeStepDescription =
    'Record transfers manually on with Manage Transfers, or mark the order complete to record all remaining transfers.';

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Order Checklist
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Approve · Complete</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col pt-0 min-h-0">
        <div className="flex flex-1 flex-col space-y-0 rounded-lg border border-border bg-muted/20 overflow-hidden">
          {renderCompletedApproval && (
            <CompletedStepRow
              title="Order approval"
              badge={ratioBadge(approvalRatio, 'green')}
            />
          )}

          {renderCompletedMarkOrder && (
            <CompletedStepRow title="Mark order complete" isLast={phase === 'done'} />
          )}

          {phase === 'approve' && (
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
                badge={ratioBadge(approvalRatio, progress.approvalsComplete ? 'green' : 'amber')}
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
              <div className="ml-10">
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                  disabled={!onMarkComplete || isMarkingComplete || items.length === 0}
                  onClick={onMarkComplete}
                >
                  {isMarkingComplete ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking complete…
                    </>
                  ) : (
                    'Mark order complete'
                  )}
                </Button>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="border-t border-border/60 bg-green-50/80 px-4 py-3 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Order is complete!
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
