import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Account } from '@/types/account';
import AccountContextPanel from './AccountContextPanel';
import AccountInvoiceKpiStrip from './AccountInvoiceKpiStrip';
import {
  useGetAccountInvoiceSummaryQuery,
  useGetAccountOpenInvoicesPageQuery,
} from '@/features/accounts/accountsApi';
import { useInvoiceOrderNumberMap } from './useInvoiceOrderNumberMap';
import AccountOpenInvoiceRow, { OPEN_INVOICE_ROW_GRID } from './AccountOpenInvoiceRow';
import type { AccountViewHighlightContext } from './accountViewContext';
import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';

const OPEN_INVOICES_PAGE_SIZE = 10;

export interface AccountOverviewPanelProps {
  account?: Account;
  isLoading?: boolean;
  accountId?: number | null;
  showFinancials?: boolean;
  highlightContext?: AccountViewHighlightContext;
}

const AccountOverviewPanel: React.FC<AccountOverviewPanelProps> = ({
  account,
  isLoading,
  accountId,
  showFinancials = true,
  highlightContext,
}) => {
  const resolvedId = account?.id ?? accountId ?? null;
  const [openInvoicesPage, setOpenInvoicesPage] = React.useState(1);

  React.useEffect(() => {
    setOpenInvoicesPage(1);
  }, [resolvedId, highlightContext?.purchaseOrderId, highlightContext?.itemId]);

  const { data: summary, isLoading: summaryLoading } = useGetAccountInvoiceSummaryQuery(
    { account_id: resolvedId! },
    { skip: !resolvedId || !showFinancials || isLoading }
  );

  const openInvoicesSkip = (openInvoicesPage - 1) * OPEN_INVOICES_PAGE_SIZE;
  const {
    data: openInvoicesPageData,
    isLoading: openInvoicesLoading,
    isFetching: openInvoicesFetching,
  } = useGetAccountOpenInvoicesPageQuery(
    {
      account_id: resolvedId!,
      skip: openInvoicesSkip,
      limit: OPEN_INVOICES_PAGE_SIZE,
      prioritize_purchase_order_id: highlightContext?.purchaseOrderId ?? undefined,
    },
    { skip: !resolvedId || !showFinancials || isLoading }
  );

  const openInvoices = openInvoicesPageData?.items ?? [];
  const openInvoicesTotal = openInvoicesPageData?.total ?? 0;

  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(openInvoicesTotal / OPEN_INVOICES_PAGE_SIZE));
    if (openInvoicesPage > maxPage) {
      setOpenInvoicesPage(maxPage);
    }
  }, [openInvoicesTotal, openInvoicesPage]);

  const invoiceOrderNumberMap = useInvoiceOrderNumberMap(openInvoices);

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

      {showFinancials && openInvoicesTotal > 0 ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Open invoices
            <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/80">
              ({openInvoicesTotal})
            </span>
          </p>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <div
              className={`${OPEN_INVOICE_ROW_GRID} border-b border-border bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`}
            >
              <span>Invoice</span>
              <span>Items</span>
              <span className="text-right">Amount</span>
            </div>
            <ul className="divide-y divide-border">
              {openInvoices.map((inv) => (
                <AccountOpenInvoiceRow
                  key={inv.id}
                  invoice={inv}
                  orderNumber={invoiceOrderNumberMap.get(inv.id) ?? null}
                  fetchEnabled={showFinancials && !isLoading}
                  highlightItemId={highlightContext?.itemId}
                  highlightItemName={highlightContext?.itemName}
                />
              ))}
            </ul>
            {openInvoicesTotal > OPEN_INVOICES_PAGE_SIZE ? (
              <ListPagePagination
                page={openInvoicesPage}
                total={openInvoicesTotal}
                pageSize={OPEN_INVOICES_PAGE_SIZE}
                isFetching={openInvoicesFetching}
                onPageChange={setOpenInvoicesPage}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AccountOverviewPanel;
