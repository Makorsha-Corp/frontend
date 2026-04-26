import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '@/components/ui/breadcrumb';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import {
  useCreateInvoicePaymentMutation,
  useGetInvoicePaymentsByInvoiceQuery,
} from '@/features/invoicePayments/invoicePaymentsApi';
import { Users, Pencil, Loader2, FileText, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import ManageAccountsDialog from '@/components/newcomponents/customui/ManageAccountsDialog';
import OrderDetailsSummary from '@/components/newcomponents/customui/orders/OrderDetailsSummary';
import toast, { Toaster } from 'react-hot-toast';
import type { AccountInvoice } from '@/types/accountInvoice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { API_LIMITS } from '@/constants/apiLimits';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'payable' | 'receivable'>('all');
  const [invoicePage, setInvoicePage] = useState(0);
  const [paymentInvoice, setPaymentInvoice] = useState<AccountInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

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

  const invoicesPanelReady = !invoiceListLoading && !invoiceTotalsLoading;
  const [createPayment, { isLoading: isCreatingPayment }] = useCreateInvoicePaymentMutation();
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
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [invoices, invoiceSearch]);

  const selectedInvoice = useMemo(
    () => filteredInvoices.find((inv) => inv.id === selectedInvoiceId) ?? filteredInvoices[0] ?? null,
    [filteredInvoices, selectedInvoiceId]
  );

  useEffect(() => {
    if (!filteredInvoices.length) {
      setSelectedInvoiceId(null);
      return;
    }
    if (!selectedInvoiceId || !filteredInvoices.some((inv) => inv.id === selectedInvoiceId)) {
      setSelectedInvoiceId(filteredInvoices[0].id);
    }
  }, [filteredInvoices, selectedInvoiceId]);

  const {
    data: selectedInvoicePayments = [],
    isLoading: isLoadingSelectedInvoicePayments,
  } = useGetInvoicePaymentsByInvoiceQuery(
    { invoice_id: selectedInvoice?.id ?? 0, skip: 0, limit: 100 },
    { skip: !selectedInvoice }
  );

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

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '—';

  const openPaymentDialog = (inv: AccountInvoice) => {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.outstanding_amount > 0 ? String(inv.outstanding_amount) : '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('');
    setPaymentReference('');
    setPaymentNotes('');
  };

  const handleCreatePayment = async () => {
    if (!paymentInvoice) return;
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    try {
      await createPayment({
        invoice_id: paymentInvoice.id,
        payment_amount: amount,
        payment_date: paymentDate,
        payment_method: paymentMethod || undefined,
        payment_reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      }).unwrap();
      toast.success('Payment created');
      setPaymentInvoice(null);
      if (selectedInvoice) {
        setSelectedInvoiceId(selectedInvoice.id);
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create payment');
    }
  };

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
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/accounts">Accounts</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="h-6 w-px bg-border" />
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                {account ? account.name : 'Account'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
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
              <Card className="shadow-sm bg-card border-border">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="text-lg font-semibold text-card-foreground">Details</CardTitle>
                </CardHeader>
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
              </Card>

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
                                const isSelected = selectedInvoice?.id === inv.id;
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
                                      <p className="text-sm font-medium text-card-foreground">
                                        {inv.invoice_number || `#${inv.id}`}
                                      </p>
                                      <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
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
                          {!selectedInvoice ? (
                            <p className="text-sm text-muted-foreground py-1">Select an invoice to view details.</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 pr-2">
                                  <p className="text-base font-semibold text-card-foreground">
                                    {selectedInvoice.invoice_number || `#${selectedInvoice.id}`}
                                  </p>
                                  <p className="mt-0.5 text-sm text-muted-foreground">
                                    {selectedInvoice.vendor_invoice_number
                                      ? `Vendor ref: ${selectedInvoice.vendor_invoice_number}`
                                      : 'No vendor reference'}
                                  </p>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                                  <OrderDetailsSummary invoice={selectedInvoice} />
                                  <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                                    {selectedInvoice.payment_status}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="rounded-md border border-border bg-card px-2.5 py-2">
                                  <p className="text-xs font-medium text-muted-foreground">Invoice amount</p>
                                  <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
                                    {formatCurrency(selectedInvoice.invoice_amount)}
                                  </p>
                                </div>
                                <div className="rounded-md border border-border bg-card px-2.5 py-2">
                                  <p className="text-xs font-medium text-muted-foreground">Paid</p>
                                  <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
                                    {formatCurrency(selectedInvoice.paid_amount)}
                                  </p>
                                </div>
                                <div className="rounded-md border border-border bg-card px-2.5 py-2">
                                  <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                                  <p className="mt-0.5 text-base font-semibold tabular-nums text-card-foreground leading-tight">
                                    {formatCurrency(selectedInvoice.outstanding_amount)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Invoice Date</p>
                                  <p className="mt-0.5 text-sm text-card-foreground">{formatDate(selectedInvoice.invoice_date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                                  <p className="mt-0.5 text-sm text-card-foreground">{formatDate(selectedInvoice.due_date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                                  <p className="mt-0.5 text-sm capitalize text-card-foreground">{selectedInvoice.invoice_type}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Payments</p>
                                  <p
                                    className={`mt-0.5 text-sm font-medium ${
                                      selectedInvoice.allow_payments
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    }`}
                                  >
                                    {selectedInvoice.allow_payments ? 'Allowed' : 'Locked'}
                                  </p>
                                </div>
                              </div>

                              <div className="rounded-md border border-border bg-muted/10 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold text-card-foreground">Payments</p>
                                  <Button
                                    size="sm"
                                    onClick={() => openPaymentDialog(selectedInvoice)}
                                    disabled={!selectedInvoice.allow_payments}
                                  >
                                    <CreditCard className="mr-1 h-4 w-4" />
                                    Add Payment
                                  </Button>
                                </div>
                                {isLoadingSelectedInvoicePayments ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading payments...
                                  </div>
                                ) : selectedInvoicePayments.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No payments for this invoice yet.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {selectedInvoicePayments.map((p) => (
                                      <div key={p.id} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                                        <span className="font-medium">{formatCurrency(p.payment_amount)}</span>
                                        <span className="text-muted-foreground ml-2">
                                          on {new Date(p.payment_date).toLocaleDateString()}
                                        </span>
                                        {p.payment_method && (
                                          <span className="text-muted-foreground ml-2">({p.payment_method})</span>
                                        )}
                                        {p.payment_reference && (
                                          <span className="text-muted-foreground ml-2">Ref: {p.payment_reference}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {selectedInvoice.notes && (
                                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                                  <span className="font-medium mr-2">Notes:</span>
                                  {selectedInvoice.notes}
                                </div>
                              )}
                            </div>
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

      <Dialog open={!!paymentInvoice} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="w-[min(34rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>Add Invoice Payment</DialogTitle>
            <DialogDescription>
              {paymentInvoice
                ? `Invoice ${paymentInvoice.invoice_number || `#${paymentInvoice.id}`} · Outstanding ${paymentInvoice.outstanding_amount.toLocaleString()}`
                : 'Create a payment for this invoice.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="payment-amount">Amount *</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="payment-method">Method</Label>
              <Input
                id="payment-method"
                placeholder="cash / bank_transfer / cheque / card"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="payment-reference">Reference</Label>
              <Input
                id="payment-reference"
                placeholder="Transaction ID / Cheque no."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentInvoice(null)} disabled={isCreatingPayment}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={isCreatingPayment}>
              {isCreatingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountDetailPage;
