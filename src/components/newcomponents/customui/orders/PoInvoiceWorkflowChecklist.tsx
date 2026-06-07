import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ClipboardList } from 'lucide-react';
import { SectionConfirmIcon } from './PoSectionConfirmButton';
import type { ApprovalSummary } from '@/types/purchaseOrder';
import type { PoConfirmationsStatus, PoLinkedInvoiceStatus } from './purchaseOrderMilestones';
import type { PoSectionConfirmKey } from './purchaseOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export type PoInvoiceScrollSection = PoSectionConfirmKey;

interface SectionRow {
  section: PoInvoiceScrollSection;
  label: string;
  confirmed: boolean;
  readinessHint?: string;
}

export interface PoInvoiceWorkflowChecklistProps {
  invoiceId: number | null;
  invoiceStatus: PoLinkedInvoiceStatus;
  invoiceConfirmed: boolean;
  hasSupplier: boolean;
  confirmationsStatus: PoConfirmationsStatus;
  approvalSectionsStatus: PoConfirmationsStatus;
  sections: SectionRow[];
  approvalSummary: ApprovalSummary;
  onScrollToSection: (section: PoInvoiceScrollSection) => void;
  onScrollToFinalize?: () => void;
  onScrollToManageApprovals?: () => void;
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

function stepState(complete: boolean, previousComplete: boolean): StepVisualState {
  if (complete) return 'complete';
  if (previousComplete) return 'active';
  return 'pending';
}

const PoInvoiceWorkflowChecklist: React.FC<PoInvoiceWorkflowChecklistProps> = ({
  invoiceId,
  invoiceStatus,
  invoiceConfirmed,
  hasSupplier,
  confirmationsStatus,
  approvalSectionsStatus,
  sections,
  approvalSummary,
  onScrollToSection,
  onScrollToFinalize,
  onScrollToManageApprovals,
}) => {
  const hasDraft = invoiceStatus === 'draft' && invoiceId != null;
  const isConfirmed = invoiceStatus === 'confirmed' && invoiceId != null;
  const sectionsComplete = confirmationsStatus.allConfirmed;
  const approvalComplete = approvalSummary.met;

  const invoiceSectionReady = hasDraft && (invoiceConfirmed || isConfirmed);
  const approvalsUnlocked = approvalSectionsStatus.allConfirmed;

  const step1State = stepState(sectionsComplete, true);
  const step2State = stepState(approvalComplete || isConfirmed, invoiceSectionReady);
  const step3State = isConfirmed
    ? 'complete'
    : hasDraft && approvalComplete && invoiceConfirmed
      ? 'active'
      : 'pending';

  const confirmedCount = sections.filter((s) => s.confirmed).length;
  const showStep1Details =
    !sectionsComplete || (hasDraft && !isConfirmed && !invoiceConfirmed);
  const step2Clickable =
    invoiceSectionReady && !isConfirmed && !approvalComplete && Boolean(onScrollToManageApprovals);
  const step3Clickable =
    hasDraft && !isConfirmed && approvalComplete && Boolean(onScrollToFinalize);

  const step2Description = isConfirmed
    ? 'Approvals were met before invoice was finalized'
    : !hasSupplier
      ? 'Assign a supplier so the draft invoice can sync'
      : !hasDraft
        ? 'Draft invoice syncs automatically from the order'
        : !invoiceConfirmed
          ? 'Complete section and draft invoice confirmation in step 1 first'
          : !approvalsUnlocked
            ? approvalSectionsStatus.reason
            : approvalComplete
              ? 'Required approvals are met — ready to finalize'
              : 'Get the required approvals in the Manage approvals card';

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Invoice checklist
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 rounded-lg border border-border bg-muted/20 overflow-hidden">
          {/* Step 1: Confirm sections */}
          <div className="p-4 space-y-3 border-b border-border/60">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <StepCircle state={step1State} />
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-card-foreground">Confirm sections</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sectionsComplete
                      ? 'Supplier, order details, and items are confirmed'
                      : 'Confirm each section using the checkmarks on the cards above'}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 font-normal',
                  sectionsComplete
                    ? 'text-green-600 border-green-600/30'
                    : 'text-amber-600 border-amber-600/30'
                )}
              >
                {sectionsComplete ? 'Complete' : `${confirmedCount} / ${sections.length}`}
              </Badge>
            </div>

            {!sectionsComplete && (
              <div className="ml-10 space-y-1">
                {sections.map(({ section, label, confirmed, readinessHint }) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => onScrollToSection(section)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Go to ${label} section`}
                  >
                    <SectionConfirmIcon confirmed={confirmed} />
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        confirmed
                          ? 'text-green-700 dark:text-green-300 font-medium'
                          : 'text-card-foreground'
                      )}
                    >
                      {label}
                    </span>
                    {!confirmed && readinessHint && (
                      <span className="text-xs text-muted-foreground truncate max-w-[40%]">
                        {readinessHint}
                      </span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                ))}
              </div>
            )}

            {showStep1Details && hasDraft && !isConfirmed && !invoiceConfirmed && (
              <div className={cn('ml-10 space-y-1', !sectionsComplete && 'pt-1 border-t border-border/60')}>
                {!sectionsComplete && (
                  <p className="px-2 pt-2 text-xs text-muted-foreground">
                    After confirming these, confirm the draft invoice
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onScrollToSection('invoice')}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Go to draft invoice confirmation"
                >
                  <SectionConfirmIcon confirmed={false} />
                  <span className="flex-1 text-sm text-card-foreground">Confirm draft invoice</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Order approval */}
          <ChecklistStep
            clickable={step2Clickable}
            onClick={onScrollToManageApprovals}
            ariaLabel="Go to Manage approvals"
            className={cn(
              'border-b border-border/60',
              !invoiceSectionReady && 'opacity-60',
              step2Clickable && 'cursor-pointer'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <StepCircle state={step2State} />
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-card-foreground">Order approval</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step2Description}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 font-normal',
                  approvalComplete || isConfirmed
                    ? 'text-green-600 border-green-600/30'
                    : invoiceSectionReady
                      ? 'text-amber-600 border-amber-600/30'
                      : 'text-muted-foreground'
                )}
              >
                {approvalSummary.approved_count} / {approvalSummary.required} approved
              </Badge>
            </div>
          </ChecklistStep>

          {/* Step 3: Finalize invoice */}
          <ChecklistStep
            clickable={step3Clickable}
            onClick={onScrollToFinalize}
            ariaLabel="Go to finalize invoice"
            className={cn(step3State === 'pending' && 'opacity-70', step3Clickable && 'cursor-pointer')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <StepCircle state={step3State} />
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-card-foreground">Finalize invoice</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isConfirmed
                      ? 'Invoice confirmed — order and payable are locked'
                      : hasDraft
                        ? approvalComplete
                          ? 'Confirm in the Linked Invoice card to post payable and lock the order'
                          : 'Complete order approvals first'
                        : 'Draft invoice syncs from the order before finalizing'}
                  </p>
                </div>
              </div>

              {isConfirmed && (
                <Badge className="shrink-0 bg-green-600 text-white border-transparent">
                  Complete
                </Badge>
              )}

              {step3Clickable && (
                <Badge
                  variant="outline"
                  className="shrink-0 font-normal text-amber-600 border-amber-600/30"
                >
                  Ready to confirm
                </Badge>
              )}
            </div>
          </ChecklistStep>
        </div>
      </CardContent>
    </Card>
  );
};

export default PoInvoiceWorkflowChecklist;
