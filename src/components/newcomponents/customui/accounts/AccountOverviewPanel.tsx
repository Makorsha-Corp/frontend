import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Account } from '@/types/account';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';
import { formatInvLabel } from './invoiceDisplayUtils';
import { useAccountInvoiceTotals } from './useAccountInvoiceTotals';
import { API_LIMITS } from '@/constants/apiLimits';

export interface AccountOverviewPanelProps {
  account?: Account;
  isLoading?: boolean;
  accountId?: number | null;
  showFinancials?: boolean;
}

const DetailBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="mt-0.5 text-sm text-card-foreground">{children}</div>
  </div>
);

const AccountOverviewPanel: React.FC<AccountOverviewPanelProps> = ({
  account,
  isLoading,
  accountId,
  showFinancials = true,
}) => {
  const resolvedId = account?.id ?? accountId ?? null;
  const {
    totals,
    recentInvoices,
    isLoading: financialsLoading,
  } = useAccountInvoiceTotals(resolvedId, showFinancials && !!resolvedId && !isLoading);

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

  const locationLine = [account.city, account.country, account.postal_code].filter(Boolean).join(', ');

  return (
    <div className="space-y-5">
      <div className="grid gap-6 md:grid-cols-3 md:gap-0">
        <div className="space-y-3 md:border-r md:border-border md:pr-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Account profile
          </p>
          <DetailBlock label="Name">{account.name}</DetailBlock>
          <DetailBlock label="Account code">
            <span className="font-mono">{account.account_code || '—'}</span>
          </DetailBlock>
          <DetailBlock label="Invoicing">
            {account.allow_invoices ? 'Enabled' : 'Disabled for this account'}
          </DetailBlock>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tags</p>
            {account.account_tags && account.account_tags.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {account.account_tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      color: tag.color || undefined,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-muted-foreground">No tags</p>
            )}
          </div>
        </div>

        <div className="space-y-3 md:border-r md:border-border md:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Contact
          </p>
          <DetailBlock label="Primary contact">{account.primary_contact_person || '—'}</DetailBlock>
          <DetailBlock label="Primary email">{account.primary_email || '—'}</DetailBlock>
          <DetailBlock label="Primary phone">{account.primary_phone || '—'}</DetailBlock>
        </div>

        <div className="space-y-3 md:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Finance & address
          </p>
          <DetailBlock label="Payment preferences">{account.payment_preferences || '—'}</DetailBlock>
          <DetailBlock label="Bank details">{account.bank_details || '—'}</DetailBlock>
          <DetailBlock label="Address">
            {account.address || '—'}
            <p className="mt-0.5 text-xs text-muted-foreground">{locationLine || '—'}</p>
          </DetailBlock>
        </div>
      </div>

      {showFinancials ? (
        <>
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Balance
            </p>
            {financialsLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading invoices…
              </div>
            ) : totals.invoiceCount === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                No invoices yet — balance is zero.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="min-w-0 rounded-md border border-border bg-card px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">Invoiced</p>
                    <p className="mt-1 truncate text-base font-semibold tabular-nums">
                      {formatInvoiceCurrency(totals.invoiced)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-border bg-card px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">Paid</p>
                    <p className="mt-1 truncate text-base font-semibold tabular-nums">
                      {formatInvoiceCurrency(totals.paid)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-border bg-card px-3 py-2.5">
                    <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                    <p className="mt-1 truncate text-base font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {formatInvoiceCurrency(totals.outstanding)}
                    </p>
                  </div>
                </div>
                {totals.capped ? (
                  <p className="text-[11px] text-muted-foreground">
                    Totals from first {API_LIMITS.FLEXIBLE_1000} invoices.
                  </p>
                ) : null}
              </>
            )}
          </div>

          {recentInvoices.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recent invoices
              </p>
              <ul className="divide-y divide-border rounded-md border border-border bg-card">
                {recentInvoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {formatInvLabel({
                          id: inv.id,
                          invoice_number: inv.invoice_number,
                        })}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {inv.invoice_type} · {inv.payment_status} ·{' '}
                        {formatInvoiceDate(inv.invoice_date)}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium tabular-nums">
                      {formatInvoiceCurrency(inv.outstanding_amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default AccountOverviewPanel;
