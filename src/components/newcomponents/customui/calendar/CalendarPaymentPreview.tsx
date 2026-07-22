import React from 'react';
import { Loader2 } from 'lucide-react';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';
import { useGetInvoicePaymentByIdQuery } from '@/features/invoicePayments/invoicePaymentsApi';

export interface CalendarPaymentPreviewProps {
  paymentId: number;
  open: boolean;
}

const CalendarPaymentPreview: React.FC<CalendarPaymentPreviewProps> = ({ paymentId, open }) => {
  const {
    data: payment,
    isLoading,
    isError,
  } = useGetInvoicePaymentByIdQuery(paymentId, { skip: !open });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading payment...
      </div>
    );
  }

  if (isError || !payment) {
    return (
      <p className="px-4 py-6 text-sm text-destructive">Could not load payment #{paymentId}.</p>
    );
  }

  return (
    <AccountInvoiceOverviewPanel
      invoiceId={payment.invoice_id}
      showOrderSummary
      showEventLog={false}
      fetchEnabled={open}
      highlightPaymentId={payment.id}
      paymentsReadOnly
      embedded
    />
  );
};

export default CalendarPaymentPreview;
