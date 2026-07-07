import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowUpRight, FileText } from 'lucide-react';
import type { AccountInvoice } from '@/types/accountInvoice';
import { formatInvLabel } from './invoiceDisplayUtils';

export interface InvoiceSummaryBadgeProps {
  invoiceId: number;
  invoice?: Pick<AccountInvoice, 'id' | 'invoice_number'> | null;
  onClick: () => void;
  badgeClassName?: string;
  className?: string;
}

const InvoiceSummaryBadge: React.FC<InvoiceSummaryBadgeProps> = ({
  invoiceId,
  invoice,
  onClick,
  badgeClassName,
  className,
}) => {
  const label = invoice ? formatInvLabel(invoice) : formatInvLabel({ id: invoiceId, invoice_number: null });

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={`View invoice ${label}`}
    >
      <Badge
        className={cn(
          'cursor-pointer gap-1 border-transparent bg-brand-primary font-medium text-primary-foreground',
          'hover:bg-brand-primary-hover',
          badgeClassName
        )}
      >
        <FileText className="h-3 w-3 shrink-0" aria-hidden />
        {label}
        <ArrowUpRight className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
      </Badge>
    </button>
  );
};

export default InvoiceSummaryBadge;
