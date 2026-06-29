import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AccountInvoice } from '@/types/accountInvoice';

type PaymentStatus = AccountInvoice['payment_status'];

interface InvoicePaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const InvoicePaymentStatusBadge: React.FC<InvoicePaymentStatusBadgeProps> = ({
  status,
  className,
}) => {
  const isPaid = status === 'paid';

  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 font-normal capitalize',
        isPaid ? 'status-badge status-badge--confirmed' : 'status-badge status-badge--unconfirmed',
        className
      )}
    >
      {status}
    </Badge>
  );
};

export default InvoicePaymentStatusBadge;
