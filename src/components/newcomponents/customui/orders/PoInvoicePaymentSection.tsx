import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';
import { SectionConfirmIcon } from './PoSectionConfirmButton';
import type { ApprovalSummary, PurchaseOrderApprover } from '@/types/purchaseOrder';
import type { PoConfirmationsStatus } from './purchaseOrderMilestones';
import type { PoSectionConfirmKey } from './purchaseOrderMilestones';

type StepVisualState = 'complete' | 'active' | 'pending';

export type PoInvoiceScrollSection = PoSectionConfirmKey;

interface SectionRow {
  section: PoInvoiceScrollSection;
  label: string;
  confirmed: boolean;
  readinessHint?: string;
}

export interface PoInvoicePaymentSectionProps {
  invoiceId: number | null;
  confirmationsStatus: PoConfirmationsStatus;
  sections: SectionRow[];
  approvalSummary: ApprovalSummary;
  headerApprovers: PurchaseOrderApprover[];
  myApproval?: PurchaseOrderApprover;
  isApproving?: boolean;
  isUnapproving?: boolean;
  onToggleMyApproval?: () => void;
  onManageApprovals: () => void;
  invoiceReadiness: { ok: boolean; reason?: string };
  isCreatingInvoice?: boolean;
  onCreateInvoice: () => void;
  onViewInvoice: () => void;
  onScrollToSection: (section: PoInvoiceScrollSection) => void;
  initialsOf: (name: string | null | undefined) => string;
  avatarColor: (userId: number) => string;
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

function stepState(
  complete: boolean,
  previousComplete: boolean
): StepVisualState {
  if (complete) return 'complete';
  if (previousComplete) return 'active';
  return 'pending';
}

const PoInvoicePaymentSection: React.FC<PoInvoicePaymentSectionProps> = ({
  invoiceId,
  confirmationsStatus,
  sections,
  approvalSummary,
  headerApprovers,
  myApproval,
  isApproving = false,
  isUnapproving = false,
  onToggleMyApproval,
  onManageApprovals,
  invoiceReadiness,
  isCreatingInvoice = false,
  onCreateInvoice,
  onViewInvoice,
  onScrollToSection,
  initialsOf,
  avatarColor,
}) => {
  const invoiceLinked = invoiceId != null;
  const sectionsComplete = invoiceLinked || confirmationsStatus.allConfirmed;
  const approvalComplete = invoiceLinked || approvalSummary.met;

  const step1State = stepState(sectionsComplete, true);
  const step2State = stepState(approvalComplete, sectionsComplete);
  const step3State = invoiceLinked
    ? 'complete'
    : sectionsComplete && approvalComplete
      ? 'active'
      : 'pending';

  const confirmedCount = sections.filter((s) => s.confirmed).length;

  return (
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
                    confirmed ? 'text-green-700 dark:text-green-300 font-medium' : 'text-card-foreground'
                  )}
                >
                  {label}
                </span>
                {!confirmed && readinessHint && (
                  <span className="text-xs text-muted-foreground truncate max-w-[40%]">{readinessHint}</span>
                )}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Order approval */}
      <div className="p-4 space-y-3 border-b border-border/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <StepCircle state={step2State} />
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-card-foreground">Order approval</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {approvalComplete
                  ? 'Required approvals are met'
                  : sectionsComplete
                    ? 'Assign approvers and collect signatures before invoicing'
                    : 'Complete section confirmations first'}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 font-normal',
              approvalComplete
                ? 'text-green-600 border-green-600/30'
                : step2State === 'active'
                  ? 'text-amber-600 border-amber-600/30'
                  : 'text-muted-foreground'
            )}
          >
            {approvalSummary.approved_count} / {approvalSummary.required} approved
          </Badge>
        </div>

        {step2State !== 'pending' && !invoiceLinked && (
          <div className="ml-10 flex flex-wrap items-center gap-3">
            {headerApprovers.length > 0 && (
              <div className="flex -space-x-2">
                {headerApprovers.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'relative flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-card',
                      avatarColor(a.user_id),
                      !a.approved && 'opacity-50'
                    )}
                    title={`${a.user_name ?? `User #${a.user_id}`}${a.approved ? ' (approved)' : ' (pending)'}`}
                  >
                    {initialsOf(a.user_name)}
                    {a.approved && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-green-500 ring-2 ring-card">
                        <Check className="h-1.5 w-1.5 text-white" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onManageApprovals} className="h-8">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                Manage approvals
              </Button>

              {myApproval && onToggleMyApproval && (
                <Button
                  type="button"
                  size="sm"
                  variant={myApproval.approved ? 'outline' : 'default'}
                  onClick={onToggleMyApproval}
                  disabled={isApproving || isUnapproving}
                  className={cn(
                    'h-8',
                    !myApproval.approved && 'bg-brand-primary hover:bg-brand-primary-hover'
                  )}
                >
                  {isApproving || isUnapproving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : myApproval.approved ? (
                    <X className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1" />
                  )}
                  {myApproval.approved ? 'Withdraw approval' : 'Approve'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Create invoice */}
      <div
        className={cn(
          'p-4',
          step3State === 'pending' && 'opacity-70'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <StepCircle state={step3State} />
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-semibold text-card-foreground">Create invoice</p>
              {invoiceLinked ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invoice #{invoiceId} — supplier, order details, and items are locked
                </p>
              ) : invoiceReadiness.ok ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create an invoice to track payment
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Lock className="h-3 w-3 shrink-0" />
                  {invoiceReadiness.reason ?? 'Complete previous steps first'}
                </p>
              )}
            </div>
          </div>

          {invoiceLinked ? (
            <button
              type="button"
              onClick={onViewInvoice}
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`View linked invoice #${invoiceId}`}
            >
              <Badge className="bg-green-600 hover:bg-green-700 text-white border-transparent cursor-pointer">
                Linked #{invoiceId}
              </Badge>
            </button>
          ) : (
            <Button
              size="sm"
              disabled={!invoiceReadiness.ok || isCreatingInvoice}
              onClick={onCreateInvoice}
              className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
            >
              {isCreatingInvoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Create Invoice
                </>
              )}
            </Button>
          )}
        </div>

        {!invoiceLinked && !invoiceReadiness.ok && (
          <p className="ml-10 mt-2 text-xs text-muted-foreground">
            {!sectionsComplete
              ? `Pending: ${confirmationsStatus.pendingLabels.join(', ') || 'section confirmations'}`
              : !approvalComplete
                ? 'Pending: order approvals'
                : null}
          </p>
        )}
      </div>
    </div>
  );
};

export default PoInvoicePaymentSection;
