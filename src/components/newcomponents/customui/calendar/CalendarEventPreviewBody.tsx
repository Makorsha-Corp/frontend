import React from 'react';
import type { CalendarEvent } from '@/types/calendar';
import CalendarGenericEventPreview from './CalendarGenericEventPreview';
import CalendarInvoicePreview from './CalendarInvoicePreview';
import CalendarPaymentPreview from './CalendarPaymentPreview';
import CalendarPurchaseOrderPreview from './CalendarPurchaseOrderPreview';

export interface CalendarEventPreviewBodyProps {
  event: CalendarEvent;
  open: boolean;
}

const CalendarEventPreviewBody: React.FC<CalendarEventPreviewBodyProps> = ({ event, open }) => {
  if (event.source_type === 'account_invoice') {
    return <CalendarInvoicePreview invoiceId={event.record_id} open={open} />;
  }

  if (event.source_type === 'invoice_payment') {
    return <CalendarPaymentPreview paymentId={event.record_id} open={open} />;
  }

  if (event.source_type === 'purchase_order') {
    return <CalendarPurchaseOrderPreview purchaseOrderId={event.record_id} open={open} />;
  }

  return <CalendarGenericEventPreview event={event} />;
};

export default CalendarEventPreviewBody;
