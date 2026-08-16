import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceConfirmDialog, InvoiceVoidDialog } from './InvoiceLifecycleDialogs';
import {
  useGetAccountInvoiceByIdQuery,
  useConfirmAccountInvoiceMutation,
  useVoidAccountInvoiceMutation,
  useGetInvoiceEventsQuery,
  useRevertInvoiceToDraftMutation,
} from '@/features/accountInvoices/accountInvoicesApi';
import { useGetInvoicePaymentsByInvoiceQuery } from '@/features/invoicePayments/invoicePaymentsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import AccountInvoiceSummaryCard, {
  INVOICE_DETAIL_SECTION_SHELL,
} from './AccountInvoiceSummaryCard';
import AccountInvoicePaymentsSection from './AccountInvoicePaymentsSection';
import InvoiceEventLogCard from './InvoiceEventLogCard';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoicePaymentStatusBadge from './InvoicePaymentStatusBadge';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatInvLabel } from './invoiceDisplayUtils';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import { canVoidPoInvoice } from '@/components/newcomponents/customui/accounts/invoiceVoidRules';
import { appToast } from '@/lib/appToast';

export interface AccountInvoiceDetailPanelProps {
  invoiceId: number;
  invoice?: AccountInvoice;
  linkedOrderNumber?: string | null;
  showOrderSummary?: boolean;
}

const AccountInvoiceDetailPanel: React.FC<AccountInvoiceDetailPanelProps> = ({
  invoiceId,
  invoice: invoiceProp,
  linkedOrderNumber = null,
}) => {
  const { data: fetchedInvoice, isLoading, isError } = useGetAccountInvoiceByIdQuery(invoiceId);
  const invoice = fetchedInvoice ?? invoiceProp;

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
      appToast.success('Invoice confirmed — payments can now be recorded.');
      setConfirmOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to confirm invoice');
    }
  };

  const handleVoid = async (voidNote: string) => {
    const readiness = canVoidPoInvoice(invoice?.invoice_status ?? null, invoice?.receiving_started ?? false);
    if (!readiness.ok) {
      appToast.error(readiness.reason ?? 'This invoice cannot be voided');
      setVoidOpen(false);
      return;
    }
    try {
      await voidInvoice({ id: invoiceId, void_note: voidNote }).unwrap();
      appToast.success('Invoice voided successfully.');
      setVoidOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to void invoice');
    }
  };

  const handleRevert = async () => {
    try {
      await revertToDraft(invoiceId).unwrap();
      appToast.success('Invoice reverted to draft.');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to revert invoice');
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
  const hasLinkedOrder =
    linkedOrderNumber != null || invoice.order_id != null || invoice.order_type != null;

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-4"
        data-testid="account-invoice-detail-header"
      >
        <h2 className="shrink-0 text-lg font-semibold text-card-foreground">
          {formatInvLabel(invoice)}
        </h2>
        {hasLinkedOrder ? (
          <OrderDetailsSummary
            invoice={invoice}
            linkedOrderNumber={linkedOrderNumber}
            shortLabel
            badgeClassName="text-xs px-2 py-0.5"
          />
        ) : null}
        <div className="ml-auto flex shrink-0 flex-wrap items-center gap-1.5">
          <InvoiceStatusBadge status={invoice.invoice_status} className="text-xs px-2 py-0.5" />
          {!isVoided && isConfirmed ? (
            <InvoicePaymentStatusBadge status={invoice.payment_status} className="text-xs" />
          ) : null}
        </div>
      </div>

      {isDraft && (
        <div
          className={`${INVOICE_DETAIL_SECTION_SHELL} px-4 py-3 flex items-center justify-between gap-4`}
        >
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

      <AccountInvoiceSummaryCard
        invoice={invoice}
        showPaymentsField={isConfirmed}
        amountsVoided={isVoided}
      />

      <InvoiceItemsTable invoiceId={invoiceId} />

      <AccountInvoicePaymentsSection invoice={invoice} />

      {(isFinalized || canRevertToDraft) && (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {canRevertToDraft && (
            <Button
              variant="default"
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
              variant="destructive"
              size="sm"
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
