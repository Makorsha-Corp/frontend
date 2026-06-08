import { useMemo } from 'react';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { aggregateAccountInvoiceTotals } from '@/components/newcomponents/customui/accounts/accountInvoiceTotals';
import { API_LIMITS } from '@/constants/apiLimits';

export interface AccountInvoiceTotals {
  invoiced: number;
  paid: number;
  outstanding: number;
  invoiceCount: number;
  capped: boolean;
}

export function useAccountInvoiceTotals(accountId: number | null | undefined, enabled = true) {
  const { data: invoices = [], isLoading } = useGetAccountInvoicesQuery(
    { account_id: accountId!, skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !accountId || !enabled }
  );

  const totals = useMemo<AccountInvoiceTotals>(() => {
    const base = aggregateAccountInvoiceTotals(invoices);
    return {
      ...base,
      invoiceCount: invoices.length,
      capped: invoices.length >= API_LIMITS.FLEXIBLE_1000,
    };
  }, [invoices]);

  const recentInvoices = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
        .slice(0, 5),
    [invoices]
  );

  return { totals, recentInvoices, isLoading };
}
