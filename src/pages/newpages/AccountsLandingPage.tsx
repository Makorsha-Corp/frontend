import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetAccountsQuery, useDeleteAccountMutation } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesQuery } from '@/features/accountInvoices/accountInvoicesApi';
import type { Account } from '@/types/account';
import {
  Users,
  Zap,
  Wallet,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  PieChart,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AddAccountDialog from '@/components/newcomponents/customui/AddAccountDialog';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import ManageAccountsDialog from '@/components/newcomponents/customui/ManageAccountsDialog';
import toast, { Toaster } from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';

const OPEN_INVOICE_STATUSES = new Set(['unpaid', 'partial', 'overdue']);

const SECTION_CONFIG = [
  { path: 'aggregated', label: 'Aggregated', icon: PieChart, kind: 'all' as const, tagCode: null },
  { path: 'payable', label: 'Payable', icon: ArrowDownLeft, kind: 'open_payable' as const, tagCode: null },
  { path: 'receivable', label: 'Receivable', icon: ArrowUpRight, kind: 'open_receivable' as const, tagCode: null },
  { path: 'utilities', label: 'Utilities', icon: Zap, kind: 'tag' as const, tagCode: 'utility' as const },
  { path: 'payroll', label: 'Payroll', icon: Wallet, kind: 'tag' as const, tagCode: 'payroll' as const },
] as const;

type SectionPath = (typeof SECTION_CONFIG)[number]['path'];

function singularAddLabel(section: SectionPath): string {
  if (section === 'utilities') return 'utility account';
  if (section === 'payroll') return 'payroll account';
  return 'account';
}

const AccountsLandingPage: React.FC<{ initialSection?: SectionPath }> = ({ initialSection }) => {
  const [selectedSection, setSelectedSection] = useState<SectionPath>(initialSection ?? 'aggregated');

  useEffect(() => {
    if (initialSection) setSelectedSection(initialSection);
  }, [initialSection]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountPage, setAccountPage] = useState(0);
  const navigate = useNavigate();

  const activeConfig = SECTION_CONFIG.find((s) => s.path === selectedSection)!;
  const isAggregated = selectedSection === 'aggregated';
  const isOpenReceivable = activeConfig.kind === 'open_receivable';
  const isOpenPayable = activeConfig.kind === 'open_payable';
  const isTagTab = activeConfig.kind === 'tag';

  /** Payable/Receivable intersect loaded accounts with open invoices; needs one full account window. */
  const useAccountPagination = isAggregated || isTagTab;
  const tagCodeForQuery = activeConfig.kind === 'tag' ? activeConfig.tagCode : undefined;

  const accountsQueryParams = useMemo(() => {
    const search = searchQuery || undefined;
    if (isOpenReceivable || isOpenPayable) {
      return {
        skip: 0,
        limit: API_LIMITS.ACCOUNTS_LIST_MAX,
        search,
        tag_code: tagCodeForQuery,
      };
    }
    return {
      skip: accountPage * API_LIMITS.ACCOUNTS_HUB_PAGE_SIZE,
      limit: API_LIMITS.ACCOUNTS_HUB_PAGE_SIZE,
      search,
      tag_code: tagCodeForQuery,
    };
  }, [accountPage, isOpenPayable, isOpenReceivable, searchQuery, tagCodeForQuery]);

  useEffect(() => {
    setAccountPage(0);
  }, [selectedSection, searchQuery, tagCodeForQuery]);

  const { data: accounts = [], isLoading, error } = useGetAccountsQuery(accountsQueryParams, { skip: false });

  const { data: payableInvoices = [] } = useGetAccountInvoicesQuery(
    { skip: 0, limit: API_LIMITS.INVOICES_HUB, invoice_type: 'payable' },
    { skip: false }
  );
  const { data: receivableInvoices = [] } = useGetAccountInvoicesQuery(
    { skip: 0, limit: API_LIMITS.INVOICES_HUB, invoice_type: 'receivable' },
    { skip: false }
  );

  const receivableOpenAccountIds = useMemo(() => {
    const ids = new Set<number>();
    for (const inv of receivableInvoices) {
      if (OPEN_INVOICE_STATUSES.has(inv.payment_status)) {
        ids.add(inv.account_id);
      }
    }
    return ids;
  }, [receivableInvoices]);

  const payableOpenAccountIds = useMemo(() => {
    const ids = new Set<number>();
    for (const inv of payableInvoices) {
      if (OPEN_INVOICE_STATUSES.has(inv.payment_status)) {
        ids.add(inv.account_id);
      }
    }
    return ids;
  }, [payableInvoices]);

  const displayedAccounts = useMemo(() => {
    if (isOpenReceivable) return accounts.filter((a) => receivableOpenAccountIds.has(a.id));
    if (isOpenPayable) return accounts.filter((a) => payableOpenAccountIds.has(a.id));
    return accounts;
  }, [accounts, isOpenReceivable, isOpenPayable, receivableOpenAccountIds, payableOpenAccountIds]);

  const hubPageSize = API_LIMITS.ACCOUNTS_HUB_PAGE_SIZE;

  /** Server-paged tabs: one API page. Payable/Receivable: client slice of full filtered list (same page size). */
  const accountsRowsForTable = useMemo(() => {
    if (isOpenReceivable || isOpenPayable) {
      const start = accountPage * hubPageSize;
      return displayedAccounts.slice(start, start + hubPageSize);
    }
    return displayedAccounts;
  }, [displayedAccounts, accountPage, isOpenReceivable, isOpenPayable, hubPageSize]);

  const maxClientAccountPage = useMemo(() => {
    if (!isOpenReceivable && !isOpenPayable) return 0;
    if (displayedAccounts.length === 0) return 0;
    return Math.max(0, Math.ceil(displayedAccounts.length / hubPageSize) - 1);
  }, [displayedAccounts.length, isOpenReceivable, isOpenPayable, hubPageSize]);

  useEffect(() => {
    if (!isOpenReceivable && !isOpenPayable) return;
    if (accountPage > maxClientAccountPage) {
      setAccountPage(maxClientAccountPage);
    }
  }, [accountPage, maxClientAccountPage, isOpenReceivable, isOpenPayable]);

  const displayedAccountIds = useMemo(
    () => new Set(displayedAccounts.map((a) => a.id)),
    [displayedAccounts]
  );

  /** Financial rollups for account rows currently in the table (matches AccountInvoice.account_id). */
  const scopedToTable = useMemo(() => {
    const inView = (accountId: number) => displayedAccountIds.has(accountId);
    const openPayableInv = payableInvoices.filter(
      (inv) => OPEN_INVOICE_STATUSES.has(inv.payment_status) && inView(inv.account_id)
    );
    const openRecvInv = receivableInvoices.filter(
      (inv) => OPEN_INVOICE_STATUSES.has(inv.payment_status) && inView(inv.account_id)
    );
    const lineOutstanding = (inv: (typeof payableInvoices)[number]) =>
      inv.outstanding_amount ?? inv.invoice_amount - inv.paid_amount;
    return {
      payableOutstanding: openPayableInv.reduce((s, inv) => s + lineOutstanding(inv), 0),
      receivableOutstanding: openRecvInv.reduce((s, inv) => s + lineOutstanding(inv), 0),
      openPayableInvoiceCount: openPayableInv.length,
      openReceivableInvoiceCount: openRecvInv.length,
      overduePayableCount: payableInvoices.filter(
        (inv) => inv.payment_status === 'overdue' && inView(inv.account_id)
      ).length,
      overdueReceivableCount: receivableInvoices.filter(
        (inv) => inv.payment_status === 'overdue' && inView(inv.account_id)
      ).length,
    };
  }, [displayedAccountIds, payableInvoices, receivableInvoices]);

  const overview = useMemo(() => {
    const payableOutstanding = payableInvoices
      .filter((inv) => OPEN_INVOICE_STATUSES.has(inv.payment_status))
      .reduce((sum, inv) => sum + (inv.outstanding_amount ?? inv.invoice_amount - inv.paid_amount), 0);
    const receivableOutstanding = receivableInvoices
      .filter((inv) => OPEN_INVOICE_STATUSES.has(inv.payment_status))
      .reduce((sum, inv) => sum + (inv.outstanding_amount ?? inv.invoice_amount - inv.paid_amount), 0);
    const aggregateNet = receivableOutstanding - payableOutstanding;
    return {
      payableOutstanding,
      receivableOutstanding,
      aggregateNet,
    };
  }, [payableInvoices, receivableInvoices]);

  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleSectionSelect = (path: SectionPath) => {
    setSelectedSection(path);
    navigate(`/accounts/${path}`, { replace: true });
  };

  const handleEdit = (account: Account) => setEditingAccount(account);
  const handleView = (account: Account) => navigate(`/accounts/${account.id}`);
  const handleDelete = async (account: Account) => {
    if (!window.confirm(`Deactivate "${account.name}"? This is a soft delete.`)) return;
    try {
      await deleteAccount(account.id).unwrap();
      toast.success(`Account "${account.name}" has been deactivated`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate account');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

  const singularLabel = singularAddLabel(selectedSection);
  const addDialogDefaultTag = activeConfig.kind === 'tag' ? activeConfig.tagCode : undefined;

  const getContactSummary = (acc: Account) => acc.primary_contact_person || acc.primary_email || acc.primary_phone || '-';
  const getAddressSummary = (acc: Account) => [acc.address, acc.city, acc.country].filter(Boolean).join(', ') || '-';

  const showAccountsPager =
    !isLoading &&
    !error &&
    ((useAccountPagination && accounts.length > 0) ||
      ((isOpenReceivable || isOpenPayable) && displayedAccounts.length > 0));

  const canAccountsPrev =
    (useAccountPagination || isOpenReceivable || isOpenPayable) && accountPage > 0;

  const canAccountsNext =
    (useAccountPagination && accounts.length === hubPageSize) ||
    ((isOpenReceivable || isOpenPayable) && (accountPage + 1) * hubPageSize < displayedAccounts.length);

  const emptyFiltered =
    !isLoading &&
    !error &&
    accounts.length > 0 &&
    displayedAccounts.length === 0 &&
    (isOpenReceivable || isOpenPayable);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <AppShellHeader>
          <div className="flex items-center justify-between">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Accounts</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsManageAccountsOpen(true)}
              className={appShellHeaderControlClass}
            >
              Manage Accounts
            </Button>
          </div>
        </AppShellHeader>

        <div className="flex flex-1 flex-col min-h-0 overflow-hidden p-8 gap-6 bg-background">
          <div className="flex flex-nowrap gap-2 overflow-x-auto shrink-0">
            {SECTION_CONFIG.map(({ path, label, icon: Icon }) => {
              const isSelected = selectedSection === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => handleSectionSelect(path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shrink-0 ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20'
                      : 'border-border hover:border-brand-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-brand-primary' : 'text-card-foreground'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="shrink-0">
            <p className="text-sm text-muted-foreground mb-3">
              {isAggregated
                ? 'Workspace totals (open balances on loaded invoices)'
                : isOpenPayable
                  ? 'Payable · open balances for accounts listed below'
                  : isOpenReceivable
                    ? 'Receivable · open balances for accounts listed below'
                    : isTagTab
                      ? `${activeConfig.label} · open invoice exposure for accounts in the table`
                      : 'Financial overview'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAggregated ? (
                <>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Accounts Payable</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(overview.payableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Open payable invoices (loaded)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Accounts Receivable</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(overview.receivableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Open receivable invoices (loaded)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                        <PieChart className="h-6 w-6 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net (AR − AP)</p>
                        <p className={`text-xl font-semibold ${overview.aggregateNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {formatCurrency(overview.aggregateNet)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {overview.aggregateNet >= 0 ? 'Net receivable' : 'Net payable'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : isOpenPayable ? (
                <>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding payables</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(scopedToTable.payableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">You owe · listed accounts only</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open payable invoices</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {scopedToTable.openPayableInvoiceCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Unpaid / partial / overdue</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overdue payables</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {scopedToTable.overduePayableCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Payable invoices past due · listed accounts</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : isOpenReceivable ? (
                <>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding receivables</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(scopedToTable.receivableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Owed to you · listed accounts only</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open receivable invoices</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {scopedToTable.openReceivableInvoiceCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Unpaid / partial / overdue</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overdue receivables</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {scopedToTable.overdueReceivableCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Receivable invoices past due · listed accounts</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <ArrowDownLeft className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payables · these accounts</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(scopedToTable.payableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Open payable invoices (loaded)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Receivables · these accounts</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {formatCurrency(scopedToTable.receivableOutstanding)}
                        </p>
                        <p className="text-xs text-muted-foreground">Open receivable invoices (loaded)</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border bg-card">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Overdue · these accounts</p>
                        <p className="text-xl font-semibold text-card-foreground">
                          {scopedToTable.overduePayableCount + scopedToTable.overdueReceivableCount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {displayedAccounts.length} {displayedAccounts.length === 1 ? 'account' : 'accounts'} in table
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-1 min-h-0 flex-col min-w-0">
            <Card className="shadow-sm bg-card border-border flex flex-1 min-h-0 flex-col overflow-hidden">
              <CardContent className="p-0 flex flex-1 min-h-0 flex-col overflow-hidden">
                <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-muted-foreground">
                    {!isLoading && (
                      <span className="font-medium">
                        {displayedAccounts.length}{' '}
                        {displayedAccounts.length === 1 ? 'account' : 'accounts'}
                        {showAccountsPager ? ` · page ${accountPage + 1}` : ''}
                        {!isAggregated && !isOpenReceivable && !isOpenPayable ? ` · ${activeConfig.label}` : ''}
                        {(isOpenReceivable || isOpenPayable) && displayedAccounts.length > 0
                          ? ` · ${activeConfig.label}`
                          : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-[200px] min-w-[140px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        type="text"
                        placeholder={
                          isAggregated
                            ? 'Search accounts...'
                            : `Search ${activeConfig.label.toLowerCase()}...`
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="bg-brand-primary hover:bg-brand-primary-hover"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                  {isLoading ? (
                    <div className="flex min-h-full items-center justify-center py-16">
                      <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
                    </div>
                  ) : error ? (
                    <div className="flex min-h-full items-center justify-center py-16 text-center text-destructive">
                      Failed to load accounts.
                    </div>
                  ) : accounts.length === 0 ? (
                    <div className="flex min-h-full flex-col items-center justify-center py-16 text-center px-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary/10 rounded-full mb-4">
                        <Users className="h-10 w-10 text-brand-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        No {isAggregated ? 'accounts' : activeConfig.label} yet
                      </h3>
                      <p className="text-muted-foreground mb-4">Add your first {singularLabel}.</p>
                      <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-brand-primary hover:bg-brand-primary-hover"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add {singularLabel}
                      </Button>
                    </div>
                  ) : emptyFiltered ? (
                    <div className="flex min-h-full flex-col items-center justify-center py-16 text-center px-4">
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        No accounts in this view
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                        No accounts here have open {isOpenReceivable ? 'receivable' : 'payable'} invoices right now. Try
                        the Aggregated tab or open an account from an invoice.
                      </p>
                    </div>
                  ) : (
                    <div className="min-h-full">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[60px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Contact Details</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accountsRowsForTable.map((acc) => (
                            <TableRow
                            key={acc.id}
                            className="hover:bg-muted/30 cursor-pointer"
                            onClick={() => handleView(acc)}
                            >
                              <TableCell className="font-mono text-sm text-muted-foreground">{acc.id}</TableCell>
                              <TableCell className="font-medium">{acc.name}</TableCell>
                              <TableCell className="text-muted-foreground">{acc.account_code || '-'}</TableCell>
                              <TableCell>{getContactSummary(acc)}</TableCell>
                              <TableCell>{getAddressSummary(acc)}</TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 mr-1 text-brand-primary hover:bg-brand-primary/10"
                                        onClick={() => handleEdit(acc)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(acc)}
                                        disabled={isDeleting}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Deactivate</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
                {showAccountsPager ? (
                  <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border px-4 py-2 bg-muted/20">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={!canAccountsPrev}
                      onClick={() => setAccountPage((p) => Math.max(0, p - 1))}
                      aria-label="Previous accounts page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {hubPageSize} per page
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      disabled={!canAccountsNext}
                      onClick={() => setAccountPage((p) => p + 1)}
                      aria-label="Next accounts page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddAccountDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        defaultTagCode={addDialogDefaultTag}
      />
      <EditAccountDialog
        open={!!editingAccount}
        onOpenChange={(open) => !open && setEditingAccount(null)}
        account={editingAccount}
      />
      <ManageAccountsDialog open={isManageAccountsOpen} onOpenChange={setIsManageAccountsOpen} />
    </div>
  );
};

export default AccountsLandingPage;
