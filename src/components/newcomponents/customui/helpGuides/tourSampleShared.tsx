import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, MessageSquare, Paperclip, ShieldCheck } from 'lucide-react';
import {
  ORDER_APPROVALS_BAR_CLASS,
  ORDER_APPROVALS_BAR_OUTER_CLASS,
} from '@/components/newcomponents/customui/orders/orderListConstants';
import { OrderApprovalsSummary } from '@/components/newcomponents/customui/orders/approvals/OrderApprovalsBarShell';
import { OrderWorkflowChecklistHeader } from '@/components/newcomponents/customui/orders/OrderWorkflowChecklistHeader';
import { SectionConfirmActions, SectionConfirmIcon } from '@/components/newcomponents/customui/orders/PoSectionConfirmButton';
import { ORDER_DISCUSSION_SECTION_ID } from '@/constants/discussion';

/** Tour preview panels look real but cannot be edited or saved. */
export const TOUR_SAMPLE_INERT_CLASS = 'pointer-events-none select-none';

export function TourSampleField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

export function TourSampleDashedValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 text-sm text-card-foreground">
      {children}
    </div>
  );
}

export function TourSampleApprovalsBar({
  id,
  approvedCount = 1,
  required = 2,
}: {
  id: string;
  approvedCount?: number;
  required?: number;
}) {
  const approvalSummary = {
    approved_count: approvedCount,
    required,
    met: approvedCount >= required,
  };

  return (
    <div className={ORDER_APPROVALS_BAR_OUTER_CLASS}>
      <div id={id} className={ORDER_APPROVALS_BAR_CLASS}>
        <OrderApprovalsSummary approvalSummary={approvalSummary} />
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {['AK', 'FM'].map((initials, i) => (
            <span
              key={initials}
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                i < approvedCount
                  ? 'border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400'
                  : 'border-border bg-muted/50 text-muted-foreground',
              )}
              aria-hidden
            >
              {initials}
            </span>
          ))}
        </div>
        <Badge variant="outline" className="ml-auto shrink-0 font-normal text-muted-foreground">
          <ShieldCheck className="mr-1 h-3 w-3" aria-hidden />
          Preview
        </Badge>
      </div>
    </div>
  );
}

export function TourSampleWorkflowCard({
  title = 'Next steps',
  className,
}: {
  title?: string;
  className?: string;
}) {
  const steps = [
    { label: 'Confirm order details', done: true },
    { label: 'Confirm supplier', done: false },
    { label: 'Team approvals', done: false, active: true },
  ];

  return (
    <Card className={cn('flex h-full flex-col scroll-mt-6', className)}>
      <OrderWorkflowChecklistHeader title={title} />
      <CardContent className="flex-1 space-y-0 p-0 pt-0">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              'flex items-start gap-3 border-t border-border p-4 first:border-t-0',
              step.active && 'bg-brand-primary/5',
            )}
          >
            {step.done ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              </span>
            ) : (
              <span
                className={cn(
                  'h-7 w-7 shrink-0 rounded-full border-2 bg-background',
                  step.active ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-muted-foreground/30',
                )}
                aria-hidden
              />
            )}
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-card-foreground">{step.label}</p>
              {step.active ? (
                <p className="text-xs text-muted-foreground mt-0.5">Waiting on approvers</p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TourSampleCollaborationSection({ className }: { className?: string }) {
  return (
    <div
      id={ORDER_DISCUSSION_SECTION_ID}
      className={cn('grid grid-cols-1 items-stretch gap-4 scroll-mt-6 lg:grid-cols-3', className)}
    >
      <Card className="flex min-h-0 flex-col lg:col-span-2">
        <CardHeader className="p-4 pb-2 shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
          <div className="min-h-[11rem] space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="max-w-[85%] rounded-lg bg-card border border-border px-3 py-2 text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">Finance · yesterday</p>
              <p className="text-card-foreground">Please confirm supplier before we approve.</p>
            </div>
            <div className="ml-auto max-w-[85%] rounded-lg bg-brand-primary/10 border border-brand-primary/20 px-3 py-2 text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">You · today</p>
              <p className="text-card-foreground">Updated expected delivery — review when ready.</p>
            </div>
          </div>
          <div className="h-10 rounded-md border border-dashed border-border bg-muted/30 px-3 text-sm text-muted-foreground flex items-center">
            Add a comment…
          </div>
        </CardContent>
      </Card>
      <Card className="flex min-h-0 flex-col lg:col-span-1">
        <CardHeader className="p-4 pb-2 shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4 pt-0">
          <div className="flex min-h-[11rem] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center">
            <Paperclip className="h-6 w-6 text-muted-foreground/50 mb-2" aria-hidden />
            <p className="text-sm text-muted-foreground">No files yet</p>
            <p className="text-xs text-muted-foreground mt-1">Quotes and invoices attach here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TourSampleSectionConfirm({
  label,
  confirmed = false,
  id,
}: {
  label: string;
  confirmed?: boolean;
  id?: string;
}) {
  return (
    <SectionConfirmActions
      id={id}
      confirmed={confirmed}
      invoiceLocked={false}
      onToggle={() => {}}
      isLoading={false}
      label={label}
    />
  );
}

export function TourSampleConfirmIconRow({ label, confirmed }: { label: string; confirmed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <SectionConfirmIcon confirmed={confirmed} size="md" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
