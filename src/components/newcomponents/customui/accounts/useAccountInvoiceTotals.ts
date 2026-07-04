import { useGetAccountInvoiceSummaryQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';

export interface AccountInvoiceTotals {
  invoiced: number;
  paid: number;
  outstanding: number;
  invoiceCount: number;
  capped: boolean;
}

/** @deprecated Prefer useGetAccountInvoiceSummaryQuery directly. */
export function useAccountInvoiceTotals(accountId: number | null | undefined, enabled = true) {
  const { data: summary, isLoading: summaryLoading } = useGetAccountInvoiceSummaryQuery(
    { account_id: accountId! },
    { skip: !accountId || !enabled }
  );

  const { data: invoices = [], isLoading: listLoading } = useGetAccountInvoicesQuery(
    { account_id: accountId!, skip: 0, limit: 5 },
    { skip: !accountId || !enabled }
  );

  const totals: AccountInvoiceTotals = {
    invoiced: summary?.invoiced ?? 0,
    paid: summary?.paid ?? 0,
    outstanding: summary?.outstanding ?? 0,
    invoiceCount: summary?.invoiceCount ?? 0,
    capped: false,
  };

  const recentInvoices = invoices;

  return { totals, recentInvoices, isLoading: summaryLoading || listLoading };
}
