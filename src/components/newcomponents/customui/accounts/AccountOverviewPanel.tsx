import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Account } from '@/types/account';
import AccountContextPanel from './AccountContextPanel';
import AccountInvoiceKpiStrip from './AccountInvoiceKpiStrip';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import { formatInvLabel } from './invoiceDisplayUtils';
import { useGetAccountInvoiceSummaryQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { isOpenInvoiceBalance } from './accountInvoiceTotals';

export interface AccountOverviewPanelProps {
  account?: Account;
  isLoading?: boolean;
  accountId?: number | null;
  showFinancials?: boolean;
}

const AccountOverviewPanel: React.FC<AccountOverviewPanelProps> = ({
  account,
  isLoading,
  accountId,
  showFinancials = true,
}) => {
  const resolvedId = account?.id ?? accountId ?? null;

  const { data: summary, isLoading: summaryLoading } = useGetAccountInvoiceSummaryQuery(
    { account_id: resolvedId! },
    { skip: !resolvedId || !showFinancials || isLoading }
  );

  const { data: openInvoices = [], isLoading: openInvoicesLoading } = useGetAccountInvoicesQuery(
    {
      account_id: resolvedId!,
      skip: 0,
      limit: 20,
    },
    { skip: !resolvedId || !showFinancials || isLoading }
  );

  const recentOpenInvoices = React.useMemo(
    () =>
      openInvoices
        .filter(isOpenInvoiceBalance)
        .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
        .slice(0, 5),
    [openInvoices]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {accountId != null ? `Account #${accountId} not found.` : 'No account selected.'}
      </p>
    );
  }

  const financialsLoading = summaryLoading || openInvoicesLoading;

  return (
    <div className="space-y-5">
      {showFinancials ? (
        <AccountInvoiceKpiStrip
          invoiced={summary?.invoiced ?? 0}
          paid={summary?.paid ?? 0}
          outstanding={summary?.outstanding ?? 0}
          invoiceCount={summary?.invoiceCount}
          isLoading={financialsLoading}
        />
      ) : null}

      <AccountContextPanel account={account} />

      {showFinancials && recentOpenInvoices.length > 0 ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Open invoices
          </p>
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {recentOpenInvoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                data-testid={`account-dialog-open-invoice-${inv.id}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{formatInvLabel(inv)}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {inv.invoice_type} · {inv.payment_status} · {formatInvoiceDate(inv.invoice_date)}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">
                  {formatInvoiceCurrency(inv.invoice_amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default AccountOverviewPanel;
