import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from 'lucide-react';
import InvoiceLockedBadge from './InvoiceLockedBadge';
import { Button } from '@/components/ui/button';
import { InvoiceConfirmDialog, InvoiceVoidDialog } from './InvoiceLifecycleDialogs';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
import {
  useGetAccountInvoiceByIdQuery,
  useConfirmAccountInvoiceMutation,
  useVoidAccountInvoiceMutation,
  useGetInvoiceEventsQuery,
  useRevertInvoiceToDraftMutation,
} from '@/features/accountInvoices/accountInvoicesApi';
import { useGetInvoicePaymentsByInvoiceQuery } from '@/features/invoicePayments/invoicePaymentsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { formatInvLabel } from './invoiceDisplayUtils';
import { useLinkedOrderForInvoice } from './useLinkedOrderForInvoice';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import AccountInvoicePaymentsSection from './AccountInvoicePaymentsSection';
import InvoiceDueDateField from './InvoiceDueDateField';
import InvoiceEventLogCard from './InvoiceEventLogCard';
import InvoicePaymentStatusBadge from './InvoicePaymentStatusBadge';
import InvoiceItemsTable from './InvoiceItemsTable';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { canVoidPoInvoice } from '@/components/newcomponents/customui/accounts/invoiceVoidRules';
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
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
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

  const { orderNumber: fetchedOrderNumber, isLoading: isOrderLoading } =
    useLinkedOrderForInvoice(invoiceId, { skipExpenseLookup: linkedOrderNumberProp !== undefined });
  const linkedOrderNumber =
    linkedOrderNumberProp !== undefined ? linkedOrderNumberProp : fetchedOrderNumber;

  const { data: events = [] } = useGetInvoiceEventsQuery(invoiceId);

  const { data: paymentsForCount = [] } = useGetInvoicePaymentsByInvoiceQuery(
    { invoice_id: invoiceId, skip: 0, limit: 100 },
    { skip: !invoiceId }
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const [confirmInvoice, { isLoading: isConfirming }] = useConfirmAccountInvoiceMutation();
  const [voidInvoice, { isLoading: isVoiding }] = useVoidAccountInvoiceMutation();
  const [revertToDraft, { isLoading: isReverting }] = useRevertInvoiceToDraftMutation();

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
    const readiness = canVoidPoInvoice(invoice?.invoice_status ?? null, invoice?.receiving_started ?? false);
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

  const handleRevert = async () => {
    try {
      await revertToDraft(invoiceId).unwrap();
      toast.success('Invoice reverted to draft.');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to revert invoice');
    }
  };



  const activePaymentCount = paymentsForCount.filter((p) => !p.is_voided).length;

  const voidedByName = useMemo(() => {
    const voidEvents = events.filter((e) => e.event_type === 'voided');
    if (voidEvents.length === 0) return null;
    const latest = voidEvents.reduce((a, b) =>
      new Date(a.created_at) >= new Date(b.created_at) ? a : b
    );
    return latest.performed_by_name;
  }, [events]);

  const resolvedInvoice = fetchedInvoice ?? invoiceProp;
  const linkedOrderId = resolvedInvoice?.order_id ?? null;
  const linkedOrderType = resolvedInvoice?.order_type ?? null;


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
  const isFinalized = isConfirmed;
  const isVoided = invoice.invoice_status === 'voided';
  const receivingStarted = invoice.receiving_started;
  const voidReadiness = canVoidPoInvoice(invoice.invoice_status, receivingStarted);
  const canRevertToDraft = isConfirmed && !receivingStarted && invoice.paid_amount === 0;


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
          {isConfirmed && receivingStarted && <InvoiceLockedBadge />}
          {isFinalized && <InvoicePaymentStatusBadge status={invoice.payment_status} />}
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
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              This invoice has been voided{voidedByName ? ` by ${voidedByName}` : ''}
            </p>
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

      {/* ── Invoice items ── */}
      <InvoiceItemsTable invoiceId={invoiceId} />

      {/* ── Details grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
          <p className="mt-0.5 text-sm text-card-foreground">{formatInvoiceDate(invoice.invoice_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Due Date</p>
          <InvoiceDueDateField invoice={invoice} />
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

      {/* ── Actions (revert to draft + void) ── */}
      {(isFinalized || canRevertToDraft) && (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {canRevertToDraft && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevert}
              disabled={isReverting}
            >
              {isReverting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-1.5 h-4 w-4" />
              )}
              Revert to Draft
            </Button>
          )}
          {isFinalized && (
            <BlockedActionButton
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              blocked={!voidReadiness.ok}
              blockedHint={
                !voidReadiness.ok
                  ? {
                      title: 'Cannot void',
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
          )}
        </div>
      )}

      {/* ── Invoice logs ── */}
      <InvoiceEventLogCard events={events} invoice={invoice} />

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
