import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
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
import { CreditCard, Loader2 } from 'lucide-react';
import {
  useCreateInvoicePaymentMutation,
  useGetInvoicePaymentsByInvoiceQuery,
} from '@/features/invoicePayments/invoicePaymentsApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { formatInvoiceCurrency } from './accountInvoiceFormatters';

interface AccountInvoicePaymentsSectionProps {
  invoice: AccountInvoice;
}

const AccountInvoicePaymentsSection: React.FC<AccountInvoicePaymentsSectionProps> = ({ invoice }) => {
  const {
    data: payments = [],
    isLoading: isLoadingPayments,
  } = useGetInvoicePaymentsByInvoiceQuery(
    { invoice_id: invoice.id, skip: 0, limit: 100 },
    { skip: !invoice.id }
  );

  const [createPayment, { isLoading: isCreatingPayment }] = useCreateInvoicePaymentMutation();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

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
      toast.success('Payment created');
      setPaymentOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create payment');
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-card-foreground">Payments</p>
          <Button size="sm" onClick={openPaymentDialog} disabled={!invoice.allow_payments}>
            <CreditCard className="mr-1 h-4 w-4" />
            Add Payment
          </Button>
        </div>
        {isLoadingPayments ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments for this invoice yet.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-md border border-border bg-white dark:bg-card px-3 py-2 text-sm"
              >
                <span className="font-medium">{formatInvoiceCurrency(p.payment_amount)}</span>
                <span className="text-muted-foreground ml-2">
                  on {new Date(p.payment_date).toLocaleDateString()}
                </span>
                {p.payment_method && (
                  <span className="text-muted-foreground ml-2">({p.payment_method})</span>
                )}
                {p.payment_reference && (
                  <span className="text-muted-foreground ml-2">Ref: {p.payment_reference}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="w-[min(34rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>Add Invoice Payment</DialogTitle>
            <DialogDescription>
              Invoice {invoice.invoice_number || `#${invoice.id}`} · Outstanding{' '}
              {formatInvoiceCurrency(invoice.outstanding_amount)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor={`payment-amount-${invoice.id}`}>Amount *</Label>
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
              <Label htmlFor={`payment-date-${invoice.id}`}>Payment Date *</Label>
              <Input
                id={`payment-date-${invoice.id}`}
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
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
            <div className="grid gap-1">
              <Label htmlFor={`payment-notes-${invoice.id}`}>Notes</Label>
              <Textarea
                id={`payment-notes-${invoice.id}`}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={isCreatingPayment}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={isCreatingPayment}>
              {isCreatingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountInvoicePaymentsSection;
