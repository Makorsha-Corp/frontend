import React from 'react';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';

export interface CalendarInvoicePreviewProps {
  invoiceId: number;
  open: boolean;
}

const CalendarInvoicePreview: React.FC<CalendarInvoicePreviewProps> = ({ invoiceId, open }) => {
  return (
    <AccountInvoiceOverviewPanel
      invoiceId={invoiceId}
      showOrderSummary
      showEventLog={false}
      fetchEnabled={open}
      embedded
    />
  );
};

export default CalendarInvoicePreview;
