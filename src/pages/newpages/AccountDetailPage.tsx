import React, { useEffect, useMemo, useState } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { Users, Pencil, Loader2, FileText, ChevronLeft, ChevronRight, ChevronUp, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import ManageAccountsDialog from '@/components/newcomponents/customui/ManageAccountsDialog';
import AccountInvoiceDetailPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceDetailPanel';
import {
  buildInvoiceOrderNumberMap,
  formatInvLabel,
  formatOrderLabel,
} from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { API_LIMITS } from '@/constants/apiLimits';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [invoicePage, setInvoicePage] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const accountId = id ? parseInt(id, 10) : null;
  const { data: account, isLoading, error } = useGetAccountByIdQuery(accountId!, {
    skip: !accountId || isNaN(accountId),
  });
  const pageSize = API_LIMITS.ACCOUNT_INVOICE_PAGE_SIZE;

  const invoiceListParams = useMemo(() => {
    const base = {
      account_id: accountId!,
      skip: invoicePage * pageSize,
      limit: pageSize,
    } as const;
    if (invoiceTypeFilter === 'all') return { ...base };
    return { ...base, invoice_type: invoiceTypeFilter };
  }, [accountId, invoicePage, pageSize, invoiceTypeFilter]);

  /** Up to backend max: used for summary totals and approximate invoice count (not for the list rows). */
  const invoiceTotalsParams = useMemo(() => {
    const base = {
      account_id: accountId!,
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    } as const;
    if (invoiceTypeFilter === 'all') return { ...base };
    return { ...base, invoice_type: invoiceTypeFilter };
  }, [accountId, invoiceTypeFilter]);

  const { data: invoices = [], isLoading: invoiceListLoading } = useGetAccountInvoicesQuery(invoiceListParams, {
    skip: !accountId || isNaN(accountId),
  });

  const { data: invoicesForTotals = [], isLoading: invoiceTotalsLoading } = useGetAccountInvoicesQuery(
    invoiceTotalsParams,
    {
      skip: !accountId || isNaN(accountId),
    }
  );

  const linkedOrdersParams = useMemo(
    () => ({
      account_id: accountId!,
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    }),
    [accountId]
  );

  const { data: purchaseOrdersForInvoices = [] } = useGetPurchaseOrdersQuery(linkedOrdersParams, {
    skip: !accountId || isNaN(accountId),
  });
  const { data: expenseOrdersForInvoices = [] } = useGetExpenseOrdersQuery(linkedOrdersParams, {
    skip: !accountId || isNaN(accountId),
  });

  const invoiceOrderNumberMap = useMemo(
    () => buildInvoiceOrderNumberMap(purchaseOrdersForInvoices, expenseOrdersForInvoices),
    [purchaseOrdersForInvoices, expenseOrdersForInvoices]
  );

  const invoicesPanelReady = !invoiceListLoading && !invoiceTotalsLoading;
  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const haystack = [
        inv.invoice_number,
        inv.vendor_invoice_number,
        inv.invoice_type,
        inv.payment_status,
        inv.notes,
        String(inv.id),
        invoiceOrderNumberMap.get(inv.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [invoices, invoiceSearch, invoiceOrderNumberMap]);

  const selectedInvoiceFromList = useMemo(
    () =>
      selectedInvoiceId != null
        ? filteredInvoices.find((inv) => inv.id === selectedInvoiceId) ?? null
        : null,
    [filteredInvoices, selectedInvoiceId]
  );

  useEffect(() => {
    const param = searchParams.get('invoiceId');
    if (param) {
      const parsed = parseInt(param, 10);
      if (!isNaN(parsed)) {
        setSelectedInvoiceId(parsed);
        return;
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!filteredInvoices.length || selectedInvoiceId != null) return;
    setSelectedInvoiceId(filteredInvoices[0].id);
  }, [filteredInvoices, selectedInvoiceId]);

  const invoiceTotals = useMemo(() => {
    return invoicesForTotals.reduce(
      (acc, inv) => ({
        invoiced: acc.invoiced + inv.invoice_amount,
        paid: acc.paid + inv.paid_amount,
        outstanding: acc.outstanding + inv.outstanding_amount,
      }),
      { invoiced: 0, paid: 0, outstanding: 0 }
    );
  }, [invoicesForTotals]);

  const invoiceCountLabel = useMemo(() => {
    const n = invoicesForTotals.length;
    if (n >= API_LIMITS.FLEXIBLE_1000) return `${API_LIMITS.FLEXIBLE_1000}+`;
    return String(n);
  }, [invoicesForTotals.length]);

  const totalsCapped = invoicesForTotals.length >= API_LIMITS.FLEXIBLE_1000;

  const canInvoicePrev = invoicePage > 0;
  const canInvoiceNext = invoices.length === pageSize;

  /** When capped at FLEXIBLE_1000, true total pages are unknown — omit "of N". */
  const invoiceTotalPagesKnown =
    invoicesForTotals.length > 0 && invoicesForTotals.length < API_LIMITS.FLEXIBLE_1000
      ? Math.max(1, Math.ceil(invoicesForTotals.length / pageSize))
      : null;

  useEffect(() => {
    setInvoicePage(0);
  }, [invoiceTypeFilter, accountId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  if (!accountId || isNaN(accountId)) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">
          Invalid account ID. <Link to="/accounts" className="underline">Back to accounts</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className={`${appShellHeaderLeftGroupClass} shrink-0`}>
                <div className={appShellHeaderIconTileClass}>
                  <Users className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className={appShellHeaderTitleClass}>
                  <Link
                    to="/accounts"
                    className="hover:text-brand-primary transition-colors"
                  >
                    Accounts
                  </Link>
                </h1>
              </div>
              {account ? (
                <>
                  <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
                  <Breadcrumb className="min-w-0 self-end">
                    <BreadcrumbList className="items-end text-card-foreground dark:text-foreground">
                      <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                        <span className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5">
                          <span className="truncate px-1.5 pb-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground">
                            {account.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('/accounts')}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Close account"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsManageAccountsOpen(true)}
                className={appShellHeaderControlClass}
              >
                Manage Accounts
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                disabled={!account}
                className={appShellHeaderControlClass}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="p-8 bg-background space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
            </div>
          ) : error || !account ? (
            <div className="py-16 text-center text-destructive">
              Failed to load account. <Link to="/accounts" className="underline">Back to accounts</Link>
            </div>
          ) : (
            <>
              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <Card className="shadow-sm bg-card border-border">
                  <CardHeader
                    className={cn(
                      'px-4 py-3',
                      detailsOpen && 'border-b border-border'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-card-foreground">Details</CardTitle>
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          aria-label={detailsOpen ? 'Collapse details' : 'Expand details'}
                        >
                          <ChevronUp
                            className={cn(
                              'h-4 w-4 transition-transform duration-200',
                              !detailsOpen && 'rotate-180'
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent className="grid gap-6 py-4 px-4 xl:grid-cols-3 xl:gap-0">
                  <div className="space-y-3 xl:border-r xl:border-border xl:pr-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Account Profile
                    </p>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name</p>
                      <p className="mt-0.5 text-sm font-medium text-card-foreground">{account.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Account Code</p>
                      <p className="mt-0.5 text-sm font-mono text-card-foreground">{account.account_code || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tags</p>
                      {account.account_tags && account.account_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {account.account_tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-md text-xs font-medium"
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

                  <div className="space-y-3 xl:border-r xl:border-border xl:px-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Contact
                    </p>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Contact</p>
                      <p className="mt-0.5 text-sm text-card-foreground">{account.primary_contact_person || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Email</p>
                      <p className="mt-0.5 text-sm text-card-foreground">{account.primary_email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Primary Phone</p>
                      <p className="mt-0.5 text-sm text-card-foreground">{account.primary_phone || '—'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 xl:pl-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Finance & Address
                    </p>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Preferences</p>
                      <p className="mt-0.5 text-sm text-card-foreground">{account.payment_preferences || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Bank Details</p>
                      <p className="mt-0.5 text-sm text-card-foreground">{account.bank_details || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="mt-0.5 text-sm text-card-foreground">{account.address || '—'}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {[account.city, account.country, account.postal_code].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              <Card className="shadow-sm bg-card border-border">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    Invoices ({invoiceCountLabel})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {!invoicesPanelReady ? (
                    <div className="flex items-center justify-center py-12 px-4">
                      <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                    </div>
                  ) : invoicesForTotals.length === 0 ? (
                    <p className="text-muted-foreground text-sm px-4 py-3">No invoices for this account yet.</p>
                  ) : (
                    <div className="p-4">
                      <div className="grid gap-4 xl:grid-cols-12 min-h-[420px]">
                        <div className="xl:col-span-5 rounded-lg border border-border bg-muted/10 flex flex-col min-h-0">
                          <div className="border-b border-border p-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="min-w-0 rounded-md border border-border bg-card px-2 py-2">
                                <p className="text-xs font-medium text-muted-foreground">Invoiced</p>
                                <p className="mt-1 text-sm font-semibold tabular-nums text-card-foreground truncate sm:text-base">
                                  {formatCurrency(invoiceTotals.invoiced)}
                                </p>
                              </div>
                              <div className="min-w-0 rounded-md border border-border bg-card px-2 py-2">
                                <p className="text-xs font-medium text-muted-foreground">Paid</p>
                                <p className="mt-1 text-sm font-semibold tabular-nums text-card-foreground truncate sm:text-base">
                                  {formatCurrency(invoiceTotals.paid)}
                                </p>
                              </div>
                              <div className="min-w-0 rounded-md border border-border bg-card px-2 py-2">
                                <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                                <p className="mt-1 text-sm font-semibold tabular-nums text-card-foreground truncate sm:text-base">
                                  {formatCurrency(invoiceTotals.outstanding)}
                                </p>
                              </div>
                            </div>
                            {totalsCapped ? (
                              <p className="mt-2 text-[11px] text-muted-foreground">
                                Totals use the first {API_LIMITS.FLEXIBLE_1000} invoices for this filter; load more pages
                                to browse the rest.
                              </p>
                            ) : null}
                          </div>
                          <div className="border-b border-border px-3 py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <Input
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                placeholder="Search invoice number, status, type..."
                                className="h-9 flex-1 min-w-0"
                              />
                              <Select
                                value={invoiceTypeFilter}
                                onValueChange={(v) => setInvoiceTypeFilter(v as 'all' | 'payable' | 'receivable')}
                              >
                                <SelectTrigger
                                  className="h-9 w-full sm:w-[200px] shrink-0 sm:ml-auto"
                                  aria-label="Invoice type"
                                >
                                  <SelectValue placeholder="Invoice type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All (payable & receivable)</SelectItem>
                                  <SelectItem value="payable">Payable only</SelectItem>
                                  <SelectItem value="receivable">Receivable only</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                            {filteredInvoices.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-2">No matching invoices.</p>
                            ) : (
                              filteredInvoices.map((inv) => {
                                const isSelected = selectedInvoiceId === inv.id;
                                const linkedOrderNumber = invoiceOrderNumberMap.get(inv.id) ?? null;
                                return (
                                  <button
                                    key={inv.id}
                                    type="button"
                                    onClick={() => setSelectedInvoiceId(inv.id)}
                                    className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                                      isSelected
                                        ? 'border-brand-primary bg-brand-primary/10'
                                        : 'border-border bg-background hover:bg-muted/40'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-card-foreground truncate">
                                          {formatInvLabel(inv)}
                                        </p>
                                        {linkedOrderNumber ? (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {formatOrderLabel(linkedOrderNumber)}
                                          </p>
                                        ) : null}
                                      </div>
                                      <span className="inline-flex shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
                                        {inv.payment_status}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="capitalize">{inv.invoice_type}</span>
                                      <span>{formatCurrency(inv.outstanding_amount)}</span>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                          <div className="shrink-0 border-t border-border px-3 py-2 flex items-center justify-between gap-2 bg-muted/20">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              disabled={!canInvoicePrev}
                              onClick={() => setInvoicePage((p) => Math.max(0, p - 1))}
                              aria-label="Previous invoice page"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground tabular-nums text-center flex-1 min-w-0">
                              {invoiceTotalPagesKnown != null && invoiceTotalPagesKnown > 1
                                ? `Page ${invoicePage + 1} of ${invoiceTotalPagesKnown}`
                                : `Page ${invoicePage + 1}`}
                              {totalsCapped && canInvoiceNext ? ' · more may exist' : ''}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              disabled={!canInvoiceNext}
                              onClick={() => setInvoicePage((p) => p + 1)}
                              aria-label="Next invoice page"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="xl:col-span-7 rounded-lg border border-border bg-background p-4">
                          {selectedInvoiceId == null ? (
                            <p className="text-sm text-muted-foreground py-1">Select an invoice to view details.</p>
                          ) : (
                            <AccountInvoiceDetailPanel
                              invoiceId={selectedInvoiceId}
                              invoice={selectedInvoiceFromList ?? undefined}
                              linkedOrderNumber={invoiceOrderNumberMap.get(selectedInvoiceId) ?? null}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <EditAccountDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        account={account ?? null}
      />
      <ManageAccountsDialog open={isManageAccountsOpen} onOpenChange={setIsManageAccountsOpen} />
    </div>
  );
};

export default AccountDetailPage;
