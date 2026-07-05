import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Loader2, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import {
  useCreateInvoicePaymentMutation,
  useGetInvoicePaymentsByInvoiceQuery,
  useVoidInvoicePaymentMutation,
} from '@/features/invoicePayments/invoicePaymentsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { InvoicePayment } from '@/types/invoicePayment';
import { formatInvoiceCurrency } from './accountInvoiceFormatters';
import { INVOICE_EVENT_VISUALS } from './invoiceEventVisuals';
import { cn } from '@/lib/utils';

function formatPaymentDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PAYMENT_ICON = INVOICE_EVENT_VISUALS.payment_recorded;

interface AccountInvoicePaymentsSectionProps {
  invoice: AccountInvoice;
  embedded?: boolean;
}

const AccountInvoicePaymentsSection: React.FC<AccountInvoicePaymentsSectionProps> = ({
  invoice,
  embedded = false,
}) => {
  const { data: payments = [], isLoading: isLoadingPayments } = useGetInvoicePaymentsByInvoiceQuery(
    { invoice_id: invoice.id, skip: 0, limit: 100 },
    { skip: !invoice.id }
  );

  const [createPayment, { isLoading: isCreatingPayment }] = useCreateInvoicePaymentMutation();
  const [voidPayment, { isLoading: isVoidingPayment }] = useVoidInvoicePaymentMutation();

  // Make payment dialog
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Void payment dialog
  const [voidTargetPayment, setVoidTargetPayment] = useState<InvoicePayment | null>(null);
  const [voidNote, setVoidNote] = useState('');
  const [voidAcknowledged, setVoidAcknowledged] = useState(false);

  // Show voided toggle — expanded by default on voided invoices
  const [showVoided, setShowVoided] = useState(
    () => invoice.invoice_status === 'voided'
  );

  const isConfirmed = invoice.invoice_status === 'confirmed';
  const isFinalized = isConfirmed;
  const isDraft = invoice.invoice_status === 'draft';
  const isVoided = invoice.invoice_status === 'voided';

  useEffect(() => {
    setShowVoided(invoice.invoice_status === 'voided');
  }, [invoice.id, invoice.invoice_status]);

  const activePayments = payments.filter((p) => !p.is_voided);
  const voidedPayments = payments.filter((p) => p.is_voided);

  const openPaymentDialog = () => {
    setPaymentAmount(invoice.outstanding_amount > 0 ? String(invoice.outstanding_amount) : '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('');
    setPaymentReference('');
    setPaymentNotes('');
    setPaymentOpen(true);
  };

  const handleCreatePayment = async () => {
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    try {
      await createPayment({
        invoice_id: invoice.id,
        payment_amount: amount,
        payment_date: paymentDate,
        payment_method: paymentMethod || undefined,
        payment_reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      }).unwrap();
      toast.success('Payment recorded successfully');
      setPaymentOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to record payment');
    }
  };

  const openVoidDialog = (payment: InvoicePayment) => {
    setVoidTargetPayment(payment);
    setVoidNote('');
    setVoidAcknowledged(false);
  };

  const handleVoidPayment = async () => {
    if (!voidTargetPayment) return;
    if (!voidNote.trim()) { toast.error('A void reason is required'); return; }
    if (!voidAcknowledged) { toast.error('Please confirm you understand the consequences'); return; }
    try {
      await voidPayment({ id: voidTargetPayment.id, void_note: voidNote.trim() }).unwrap();
      toast.success('Payment voided successfully');
      setVoidTargetPayment(null);
      setVoidNote('');
      setVoidAcknowledged(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to void payment');
    }
  };

  const canAddPayment = isFinalized && invoice.allow_payments && !isVoided;
  const addPaymentDisabledReason = isDraft
    ? 'Invoice must be finalized before payments can be recorded'
    : !invoice.allow_payments
      ? invoice.payment_locked_reason || 'Payments are locked for this invoice'
      : null;

  return (
    <>
      <Card className={cn(embedded && 'border-0 bg-transparent shadow-none')}>
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Payments
              <Badge variant="outline" className="ml-1 font-normal">
                {activePayments.length}
              </Badge>
            </CardTitle>
            {!isVoided && (
              <div className="relative group shrink-0">
                <Button
                  size="sm"
                  onClick={canAddPayment ? openPaymentDialog : undefined}
                  disabled={!canAddPayment}
                  className={cn(!canAddPayment && 'opacity-50 cursor-not-allowed')}
                >
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  Make Payment
                </Button>
                {addPaymentDisabledReason && (
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 w-56 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    {addPaymentDisabledReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent
          className={cn(
            'pt-0',
            activePayments.length > 4 && 'max-h-[min(16rem,30vh)] overflow-y-auto'
          )}
        >
          {isLoadingPayments ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payments...
            </div>
          ) : activePayments.length === 0 && voidedPayments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
              <CreditCard className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activePayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        PAYMENT_ICON.wrap
                      )}
                    >
                      <CreditCard className={cn('h-4 w-4', PAYMENT_ICON.color)} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-card-foreground">
                          {formatInvoiceCurrency(p.payment_amount)}
                        </span>
                        <span className="text-muted-foreground">{formatPaymentDate(p.payment_date)}</span>
                        {p.payment_method && (
                          <span className="text-muted-foreground capitalize">
                            · {p.payment_method.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {p.payment_reference && (
                        <p className="text-xs text-muted-foreground">Ref: {p.payment_reference}</p>
                      )}
                      {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                    </div>
                  </div>
                  {isFinalized && (
                    <button
                      type="button"
                      onClick={() => openVoidDialog(p)}
                      className="shrink-0 pt-0.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
                      title="Void this payment"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {voidedPayments.length > 0 && (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowVoided((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-card-foreground"
                  >
                    {showVoided ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showVoided ? 'Hide' : 'Show'} {voidedPayments.length} voided payment
                    {voidedPayments.length !== 1 ? 's' : ''}
                  </button>

                  {showVoided &&
                    voidedPayments.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm opacity-60"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-muted-foreground line-through">
                            {formatInvoiceCurrency(p.payment_amount)}
                          </span>
                          <span className="text-muted-foreground">{formatPaymentDate(p.payment_date)}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                            <XCircle className="h-2.5 w-2.5" />
                            Voided
                          </span>
                        </div>
                        {p.void_note && (
                          <p className="mt-1 text-xs text-muted-foreground">Reason: {p.void_note}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Make payment dialog ── */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="w-[min(34rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {invoice.invoice_number || `Invoice #${invoice.id}`} · Outstanding{' '}
              {formatInvoiceCurrency(invoice.outstanding_amount)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor={`payment-amount-${invoice.id}`}>Amount <span className="text-destructive">*</span></Label>
              <Input
                id={`payment-amount-${invoice.id}`}
                type="number"
                min="0.01"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor={`payment-date-${invoice.id}`}>Payment Date <span className="text-destructive">*</span></Label>
              <Input
                id={`payment-date-${invoice.id}`}
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor={`payment-method-${invoice.id}`}>Method</Label>
                <Input
                  id={`payment-method-${invoice.id}`}
                  placeholder="cash / bank_transfer / cheque / card"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`payment-reference-${invoice.id}`}>Reference</Label>
                <Input
                  id={`payment-reference-${invoice.id}`}
                  placeholder="Transaction ID / Cheque no."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1">
              <Label htmlFor={`payment-notes-${invoice.id}`}>Notes</Label>
              <Textarea
                id={`payment-notes-${invoice.id}`}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={isCreatingPayment}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={isCreatingPayment}>
              {isCreatingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Void payment dialog ── */}
      <Dialog
        open={!!voidTargetPayment}
        onOpenChange={(o) => { if (!o) { setVoidTargetPayment(null); setVoidNote(''); setVoidAcknowledged(false); } }}
      >
        <DialogContent className="w-[min(30rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Void Payment
            </DialogTitle>
            {voidTargetPayment && (
              <DialogDescription>
                You are voiding a payment of{' '}
                <strong>{formatInvoiceCurrency(voidTargetPayment.payment_amount)}</strong>. The invoice balance will be recalculated automatically.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="void-payment-note">
                Reason for voiding <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="void-payment-note"
                placeholder="Describe why this payment is being voided..."
                value={voidNote}
                onChange={(e) => setVoidNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={voidAcknowledged}
                onChange={(e) => setVoidAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-destructive cursor-pointer"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                I understand this payment will be permanently voided and cannot be reversed.
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setVoidTargetPayment(null); setVoidNote(''); setVoidAcknowledged(false); }}
              disabled={isVoidingPayment}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidPayment}
              disabled={isVoidingPayment || !voidNote.trim() || !voidAcknowledged}
            >
              {isVoidingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Voiding...</> : 'Void Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountInvoicePaymentsSection;
