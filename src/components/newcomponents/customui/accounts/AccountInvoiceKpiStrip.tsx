import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatInvoiceCurrency } from './accountInvoiceFormatters';
import { cn } from '@/lib/utils';

export interface AccountInvoiceKpiStripProps {
  invoiced: number;
  paid: number;
  outstanding: number;
  invoiceCount?: number;
  isLoading?: boolean;
  compact?: boolean;
  /** Fill available width in a toolbar row (each KPI card grows equally). */
  expand?: boolean;
  className?: string;
}

const AccountInvoiceKpiStrip: React.FC<AccountInvoiceKpiStripProps> = ({
  invoiced,
  paid,
  outstanding,
  invoiceCount,
  isLoading,
  compact,
  expand,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading totals…
      </div>
    );
  }

  const cardClass = compact
    ? cn(
        'min-w-0 rounded-md border border-border bg-card',
        expand ? 'px-3 py-2' : 'px-2 py-1.5'
      )
    : 'min-w-0 rounded-md border border-border bg-card px-3 py-2';

  const valueClass = compact
    ? 'mt-0.5 text-sm font-semibold tabular-nums truncate'
    : 'mt-1 text-sm font-semibold tabular-nums truncate sm:text-base';

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        expand && 'w-full flex-1',
        className
      )}
    >
      {invoiceCount != null ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          {invoiceCount} invoice{invoiceCount === 1 ? '' : 's'}
        </span>
      ) : null}
      <div
        className={cn(
          'grid min-w-0 gap-2',
          expand ? 'grid-cols-3 flex-1' : compact ? 'w-full grid-cols-3' : 'grid-cols-3 flex-1 min-w-[240px]'
        )}
      >
        <div className={cardClass} data-testid="account-detail-kpi-invoiced">
          <p className="text-xs font-medium text-muted-foreground">Invoiced</p>
          <p className={cn(valueClass, 'text-card-foreground')}>{formatInvoiceCurrency(invoiced)}</p>
        </div>
        <div className={cardClass} data-testid="account-detail-kpi-paid">
          <p className="text-xs font-medium text-muted-foreground">Paid</p>
          <p className={cn(valueClass, 'text-card-foreground')}>{formatInvoiceCurrency(paid)}</p>
        </div>
        <div className={cardClass} data-testid="account-detail-kpi-outstanding">
          <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
          <p className={cn(valueClass, 'text-amber-700 dark:text-amber-400')}>
            {formatInvoiceCurrency(outstanding)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountInvoiceKpiStrip;
