import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceConfirmDialog, InvoiceVoidDialog } from './InvoiceLifecycleDialogs';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
import {
  useGetAccountInvoiceByIdQuery,
  useConfirmAccountInvoiceMutation,
  useVoidAccountInvoiceMutation,
  useGetInvoiceStatusHistoryQuery,
} from '@/features/accountInvoices/accountInvoicesApi';
import { useGetInvoicePaymentsByInvoiceQuery } from '@/features/invoicePayments/invoicePaymentsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { formatInvLabel } from './invoiceDisplayUtils';
import { useLinkedOrderForInvoice } from './useLinkedOrderForInvoice';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import AccountInvoicePaymentsSection from './AccountInvoicePaymentsSection';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { canVoidPoInvoice } from '@/components/newcomponents/customui/accounts/invoiceVoidRules';
import InvoiceLockedBadge from '@/components/newcomponents/customui/accounts/InvoiceLockedBadge';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface AccountInvoiceDetailPanelProps {
  invoiceId: number;
  invoice?: AccountInvoice;
  linkedOrderNumber?: string | null;
  showOrderSummary?: boolean;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    icon: CheckCircle2,
  },
  voided: {
    label: 'Voided',
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },
} as const;

function InvoiceStatusBadge({ status }: { status: string }) {
  if (status === 'locked') {
    return <InvoiceLockedBadge />;
  }

  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ─── Status history row ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  locked: 'Locked',
  voided: 'Voided',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  confirmed: 'bg-green-500',
  locked: 'bg-amber-500',
  voided: 'bg-red-500',
};

function formatHistoryDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

// ─── Main component ────────────────────────────────────────────────────────────

const AccountInvoiceDetailPanel: React.FC<AccountInvoiceDetailPanelProps> = ({
  invoiceId,
  invoice: invoiceProp,
  linkedOrderNumber: linkedOrderNumberProp,
  showOrderSummary = true,
}) => {
  const { data: fetchedInvoice, isLoading, isError } = useGetAccountInvoiceByIdQuery(invoiceId);
  const invoice = fetchedInvoice ?? invoiceProp;

  const { orderNumber: fetchedOrderNumber, poItems, isLoading: isOrderLoading } = useLinkedOrderForInvoice(
    invoiceId,
    { skipExpenseLookup: linkedOrderNumberProp !== undefined }
  );
  const linkedOrderNumber =
    linkedOrderNumberProp !== undefined ? linkedOrderNumberProp : fetchedOrderNumber;

  const { data: statusHistory = [] } = useGetInvoiceStatusHistoryQuery(invoiceId);

  // Fetch payments to show accurate count in void dialog.
  // Shares the same RTK cache key as AccountInvoicePaymentsSection — no extra network request.
  const { data: paymentsForCount = [] } = useGetInvoicePaymentsByInvoiceQuery(
    { invoice_id: invoiceId, skip: 0, limit: 100 },
    { skip: !invoiceId }
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const [confirmInvoice, { isLoading: isConfirming }] = useConfirmAccountInvoiceMutation();
  const [voidInvoice, { isLoading: isVoiding }] = useVoidAccountInvoiceMutation();

  const handleConfirm = async () => {
    try {
      await confirmInvoice(invoiceId).unwrap();
      toast.success('Invoice confirmed — payments can now be recorded.');
      setConfirmOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to confirm invoice');
    }
  };

  const handleVoid = async (voidNote: string) => {
    const readiness = canVoidPoInvoice(invoice?.invoice_status ?? null, poItems);
    if (!readiness.ok) {
      toast.error(readiness.reason ?? 'This invoice cannot be voided');
      setVoidOpen(false);
      return;
    }
    try {
      await voidInvoice({ id: invoiceId, void_note: voidNote }).unwrap();
      toast.success('Invoice voided successfully.');
      setVoidOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to void invoice');
    }
  };

  const activePaymentCount = paymentsForCount.filter((p) => !p.is_voided).length;

  if (isLoading && !invoice) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading invoice...
      </div>
    );
  }

  if (isError || !invoice) {
    return <p className="text-sm text-destructive py-4">Could not load invoice #{invoiceId}.</p>;
  }

  const isDraft = invoice.invoice_status === 'draft';
  const isConfirmed = invoice.invoice_status === 'confirmed';
  const isLocked = invoice.invoice_status === 'locked';
  const isFinalized = isConfirmed || isLocked;
  const isVoided = invoice.invoice_status === 'voided';
  const voidReadiness = canVoidPoInvoice(invoice.invoice_status, poItems);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 pr-2">
          <p className="text-base font-semibold text-card-foreground">{formatInvLabel(invoice)}</p>
          {invoice.vendor_invoice_number ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Supplier invoice #{invoice.vendor_invoice_number}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {showOrderSummary ? (
            <OrderDetailsSummary
              invoice={invoice}
              linkedOrderNumber={
                linkedOrderNumberProp !== undefined ? linkedOrderNumberProp
                  : isOrderLoading ? undefined : linkedOrderNumber
              }
            />
          ) : null}
          <InvoiceStatusBadge status={invoice.invoice_status} />
          {isFinalized && (
            <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {invoice.payment_status}
            </span>
          )}
        </div>
      </div>

      {/* ── Draft notice + Confirm action ── */}
      {isDraft && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground">This invoice is a draft</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confirm it to lock it for editing and enable payment recording.
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setConfirmOpen(true)}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Confirm Invoice
          </Button>
        </div>
      )}

      {/* ── Voided notice ── */}
      {isVoided && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">This invoice has been voided</p>
          </div>
          {invoice.void_note && (
            <p className="text-xs text-red-600 dark:text-red-400 pl-6">
              Reason: {invoice.void_note}
            </p>
          )}
        </div>
      )}

      {/* ── Amounts ── */}
      <div className="rounded-md border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Invoice amount</p>
            <p className={cn('mt-0.5 text-base font-semibold tabular-nums leading-tight', isVoided ? 'text-muted-foreground line-through' : 'text-card-foreground')}>
              {formatInvoiceCurrency(invoice.invoice_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Paid</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
              {formatInvoiceCurrency(invoice.paid_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
            <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
              {formatInvoiceCurrency(invoice.outstanding_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Details grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
          <p className="mt-0.5 text-sm text-card-foreground">{formatInvoiceDate(invoice.invoice_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Due Date</p>
          <p className="mt-0.5 text-sm text-card-foreground">{formatInvoiceDate(invoice.due_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Type</p>
          <p className="mt-0.5 text-sm capitalize text-card-foreground">{invoice.invoice_type}</p>
        </div>
        {isConfirmed && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Payments</p>
            <p className={cn('mt-0.5 text-sm font-medium', invoice.allow_payments ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400')}>
              {invoice.allow_payments ? 'Allowed' : 'Locked'}
            </p>
          </div>
        )}
      </div>

      {/* ── Payments section ── */}
      <AccountInvoicePaymentsSection invoice={invoice} />

      {/* ── Notes ── */}
      {invoice.notes ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
          <span className="font-medium mr-2">Notes:</span>
          {invoice.notes}
        </div>
      ) : null}

      {/* ── Void action ── */}
      {isFinalized && (
        <div className="flex justify-end pt-1">
          <BlockedActionButton
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            blocked={!voidReadiness.ok}
            blockedHint={
              !voidReadiness.ok
                ? {
                    title: 'Cannot void anymore',
                    reason:
                      voidReadiness.reason ??
                      'Receiving has started — this invoice can no longer be voided',
                  }
                : undefined
            }
            isBusy={isVoiding}
            onAction={() => setVoidOpen(true)}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Void Invoice
          </BlockedActionButton>
        </div>
      )}

      {/* ── Status history ── */}
      {statusHistory.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice History</p>
          <div className="relative space-y-0 pl-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            {statusHistory.map((entry) => (
              <div key={entry.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
                <span className={cn('absolute -left-[1px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background', STATUS_COLORS[entry.to_status] ?? 'bg-muted-foreground')} />
                <div className="pl-4 min-w-0">
                  <p className="text-sm text-card-foreground">
                    <span className="font-medium">{STATUS_LABELS[entry.from_status] ?? entry.from_status}</span>
                    <span className="text-muted-foreground mx-1.5">→</span>
                    <span className="font-medium">{STATUS_LABELS[entry.to_status] ?? entry.to_status}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.changed_by_name ?? 'Unknown'} · {formatHistoryDate(entry.changed_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <InvoiceConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        isConfirming={isConfirming}
      />

      <InvoiceVoidDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        onVoid={handleVoid}
        isVoiding={isVoiding}
        activePaymentCount={activePaymentCount}
      />
    </div>
  );
};

export default AccountInvoiceDetailPanel;
