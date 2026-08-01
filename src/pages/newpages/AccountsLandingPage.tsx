import React, { useState, useMemo, useEffect } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { useNavigate } from 'react-router-dom';
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
import type { AccountInvoice } from '@/types/accountInvoice';
import {
  Users,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import AddAccountDialog from '@/components/newcomponents/customui/AddAccountDialog';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import ManageAccountsDialog from '@/components/newcomponents/customui/ManageAccountsDialog';
import AccountsHubSectionCard from '@/components/newcomponents/customui/accounts/AccountsHubSectionCard';
import { isOpenInvoiceBalance } from '@/components/newcomponents/customui/accounts/accountInvoiceTotals';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';

const SECTION_CONFIG = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard, kind: 'all_accounts' as const },
  { path: 'payable', label: 'Payable', icon: ArrowDownLeft, kind: 'open_payable' as const },
  { path: 'receivable', label: 'Receivable', icon: ArrowUpRight, kind: 'open_receivable' as const },
] as const;

export type AccountsHubSectionPath = (typeof SECTION_CONFIG)[number]['path'];

type AccountInvoiceRollupEntry = {
  payableOutstanding: number;
  receivableOutstanding: number;
  openPayableCount: number;
  openReceivableCount: number;
  hasOverduePayable: boolean;
  hasOverdueReceivable: boolean;
};

const EMPTY_ROLLUP: AccountInvoiceRollupEntry = {
  payableOutstanding: 0,
  receivableOutstanding: 0,
  openPayableCount: 0,
  openReceivableCount: 0,
  hasOverduePayable: false,
  hasOverdueReceivable: false,
};

function buildAccountInvoiceRollup(
  payableInvoices: AccountInvoice[],
  receivableInvoices: AccountInvoice[]
): Map<number, AccountInvoiceRollupEntry> {
  const map = new Map<number, AccountInvoiceRollupEntry>();

  const ensure = (accountId: number) => {
    let entry = map.get(accountId);
    if (!entry) {
      entry = { ...EMPTY_ROLLUP };
      map.set(accountId, entry);
    }
    return entry;
  };

  for (const inv of payableInvoices) {
    const entry = ensure(inv.account_id);
    if (isOpenInvoiceBalance(inv)) {
      entry.payableOutstanding += inv.outstanding_amount;
      entry.openPayableCount += 1;
    }
    if (inv.invoice_status !== 'voided' && inv.payment_status === 'overdue') {
      entry.hasOverduePayable = true;
    }
  }

  for (const inv of receivableInvoices) {
    const entry = ensure(inv.account_id);
    if (isOpenInvoiceBalance(inv)) {
      entry.receivableOutstanding += inv.outstanding_amount;
      entry.openReceivableCount += 1;
    }
    if (inv.invoice_status !== 'voided' && inv.payment_status === 'overdue') {
      entry.hasOverdueReceivable = true;
    }
  }

  return map;
}

function computeSectionInvoiceMetrics(invoices: AccountInvoice[], listedAccountIds: Set<number>) {
  const inList = (accountId: number) => listedAccountIds.has(accountId);
  const openInvoices = invoices.filter(
    (inv) => isOpenInvoiceBalance(inv) && inList(inv.account_id)
  );
  return {
    outstanding: openInvoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0),
    openInvoiceCount: openInvoices.length,
    overdueCount: invoices.filter(
      (inv) =>
        inv.invoice_status !== 'voided' &&
        inv.payment_status === 'overdue' &&
        inList(inv.account_id)
    ).length,
  };
}

const AccountsLandingPage: React.FC<{ initialSection?: AccountsHubSectionPath }> = ({
  initialSection,
}) => {
  const [selectedSection, setSelectedSection] = useState<AccountsHubSectionPath>(
    initialSection ?? 'overview'
  );

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
  const isAllAccounts = activeConfig.kind === 'all_accounts';
  const isOpenReceivable = activeConfig.kind === 'open_receivable';
  const isOpenPayable = activeConfig.kind === 'open_payable';

  const accountsQueryParams = useMemo(
    () => ({
      skip: 0,
      limit: API_LIMITS.ACCOUNTS_LIST_MAX,
      search: searchQuery || undefined,
    }),
    [searchQuery]
  );

  useEffect(() => {
    setAccountPage(0);
  }, [selectedSection, searchQuery]);

  const { data: accounts = [], isLoading, error } = useGetAccountsQuery(accountsQueryParams);

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
      if (isOpenInvoiceBalance(inv)) {
        ids.add(inv.account_id);
      }
    }
    return ids;
  }, [receivableInvoices]);

  const payableOpenAccountIds = useMemo(() => {
    const ids = new Set<number>();
    for (const inv of payableInvoices) {
      if (isOpenInvoiceBalance(inv)) {
        ids.add(inv.account_id);
      }
    }
    return ids;
  }, [payableInvoices]);

  const displayedAccounts = useMemo(() => {
    if (isOpenReceivable) return accounts.filter((a) => receivableOpenAccountIds.has(a.id));
    if (isOpenPayable) return accounts.filter((a) => payableOpenAccountIds.has(a.id));
    if (isAllAccounts) return accounts;
    return accounts;
  }, [
    accounts,
    isAllAccounts,
    isOpenReceivable,
    isOpenPayable,
    receivableOpenAccountIds,
    payableOpenAccountIds,
  ]);

  const hubPageSize = API_LIMITS.ACCOUNTS_HUB_PAGE_SIZE;

  const accountsRowsForTable = useMemo(() => {
    const start = accountPage * hubPageSize;
    return displayedAccounts.slice(start, start + hubPageSize);
  }, [displayedAccounts, accountPage, hubPageSize]);

  const maxClientAccountPage = useMemo(() => {
    if (displayedAccounts.length === 0) return 0;
    return Math.max(0, Math.ceil(displayedAccounts.length / hubPageSize) - 1);
  }, [displayedAccounts.length, hubPageSize]);

  useEffect(() => {
    if (accountPage > maxClientAccountPage) {
      setAccountPage(maxClientAccountPage);
    }
  }, [accountPage, maxClientAccountPage]);

  const payableListedAccountIds = useMemo(
    () => new Set(accounts.filter((a) => payableOpenAccountIds.has(a.id)).map((a) => a.id)),
    [accounts, payableOpenAccountIds]
  );

  const receivableListedAccountIds = useMemo(
    () => new Set(accounts.filter((a) => receivableOpenAccountIds.has(a.id)).map((a) => a.id)),
    [accounts, receivableOpenAccountIds]
  );

  const payableSectionMetrics = useMemo(
    () => computeSectionInvoiceMetrics(payableInvoices, payableListedAccountIds),
    [payableInvoices, payableListedAccountIds]
  );

  const receivableSectionMetrics = useMemo(
    () => computeSectionInvoiceMetrics(receivableInvoices, receivableListedAccountIds),
    [receivableInvoices, receivableListedAccountIds]
  );

  const accountInvoiceRollup = useMemo(
    () => buildAccountInvoiceRollup(payableInvoices, receivableInvoices),
    [payableInvoices, receivableInvoices]
  );

  const overviewPopulationMetrics = useMemo(() => {
    let withOpenPayable = 0;
    let withOpenReceivable = 0;
    let withNoOpenBalance = 0;
    for (const acc of accounts) {
      const rollup = accountInvoiceRollup.get(acc.id) ?? EMPTY_ROLLUP;
      const hasPayable = rollup.payableOutstanding > 0;
      const hasReceivable = rollup.receivableOutstanding > 0;
      if (hasPayable) withOpenPayable += 1;
      if (hasReceivable) withOpenReceivable += 1;
      if (!hasPayable && !hasReceivable) withNoOpenBalance += 1;
    }
    return { withOpenPayable, withOpenReceivable, withNoOpenBalance };
  }, [accounts, accountInvoiceRollup]);

  const searchPlaceholder = isAllAccounts
    ? 'Search accounts...'
    : `Search ${activeConfig.label.toLowerCase()}...`;

  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleSectionSelect = (path: AccountsHubSectionPath) => {
    setSelectedSection(path);
    navigate(`/accounts/${path}`, { replace: true });
  };

  const handleEdit = (account: Account) => setEditingAccount(account);
  const handleView = (account: Account) =>
    navigate(`/accounts/${account.id}`, { state: { fromSection: selectedSection } });
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

  const getRollup = (accountId: number) => accountInvoiceRollup.get(accountId) ?? EMPTY_ROLLUP;

  const formatOpenBalancesSummary = (accountId: number) => {
    const rollup = getRollup(accountId);
    const parts: string[] = [];
    if (rollup.payableOutstanding > 0) parts.push(`Pay ${formatCurrency(rollup.payableOutstanding)}`);
    if (rollup.receivableOutstanding > 0) parts.push(`Recv ${formatCurrency(rollup.receivableOutstanding)}`);
    return parts.length > 0 ? parts.join(' · ') : '-';
  };

  const renderAccountTags = (acc: Account) => {
    const tags = acc.account_tags ?? [];
    if (tags.length === 0) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : undefined,
              color: tag.color || undefined,
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    );
  };

  const tableSectionHint = isAllAccounts
    ? 'Overview'
    : isOpenPayable
      ? 'open payable balances'
      : 'open receivable balances';

  const getContactSummary = (acc: Account) => acc.primary_contact_person || acc.primary_email || acc.primary_phone || '-';
  const getAddressSummary = (acc: Account) => [acc.address, acc.city, acc.country].filter(Boolean).join(', ') || '-';

  const showAccountsPager =
    !isLoading && !error && displayedAccounts.length > 0;

  const canAccountsPrev = accountPage > 0;
  const canAccountsNext = (accountPage + 1) * hubPageSize < displayedAccounts.length;

  const emptyFiltered =
    !isLoading &&
    !error &&
    accounts.length > 0 &&
    displayedAccounts.length === 0 &&
    (isOpenReceivable || isOpenPayable);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsManageAccountsOpen(true)}
                className={appShellHeaderControlClass}
              >
                Manage Accounts
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover shadow-sm`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add account
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex flex-1 flex-col min-h-0 overflow-hidden p-8 gap-6 bg-background">
          <div
            className="grid shrink-0 grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3"
            role="tablist"
            aria-label="Accounts sections"
          >
            <AccountsHubSectionCard
              title="All accounts"
              icon={LayoutDashboard}
              iconContainerClassName="bg-muted"
              iconClassName="text-muted-foreground"
              tintClassName="bg-muted/[0.15] dark:bg-muted/[0.25]"
              value={accounts.length}
              subtitle="Full catalog · search applies"
              details={[
                { label: 'With open payable', value: overviewPopulationMetrics.withOpenPayable },
                { label: 'With open receivable', value: overviewPopulationMetrics.withOpenReceivable },
                { label: 'No open balance', value: overviewPopulationMetrics.withNoOpenBalance },
              ]}
              selected={selectedSection === 'overview'}
              onClick={() => handleSectionSelect('overview')}
            />
            <AccountsHubSectionCard
              title="Accounts Payable"
              icon={ArrowDownLeft}
              iconContainerClassName="bg-amber-500/10"
              iconClassName="text-amber-600 dark:text-amber-400"
              tintClassName="bg-amber-500/[0.03] dark:bg-amber-500/[0.06]"
              value={formatCurrency(payableSectionMetrics.outstanding)}
              subtitle="Accounts with open payables"
              details={[
                { label: 'Accounts in list', value: payableListedAccountIds.size },
                { label: 'Open invoices', value: payableSectionMetrics.openInvoiceCount },
                { label: 'Overdue', value: payableSectionMetrics.overdueCount },
              ]}
              selected={selectedSection === 'payable'}
              onClick={() => handleSectionSelect('payable')}
            />
            <AccountsHubSectionCard
              title="Accounts Receivable"
              icon={ArrowUpRight}
              iconContainerClassName="bg-emerald-500/10"
              iconClassName="text-emerald-600 dark:text-emerald-400"
              tintClassName="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.06]"
              value={formatCurrency(receivableSectionMetrics.outstanding)}
              subtitle="Accounts with open receivables"
              details={[
                { label: 'Accounts in list', value: receivableListedAccountIds.size },
                { label: 'Open invoices', value: receivableSectionMetrics.openInvoiceCount },
                { label: 'Overdue', value: receivableSectionMetrics.overdueCount },
              ]}
              selected={selectedSection === 'receivable'}
              onClick={() => handleSectionSelect('receivable')}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col min-w-0">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card shadow-sm">
                  <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {!isLoading && (
                          <span className="font-medium">
                            {displayedAccounts.length}{' '}
                            {displayedAccounts.length === 1 ? 'account' : 'accounts'}
                            {showAccountsPager ? ` · page ${accountPage + 1}` : ''}
                            {displayedAccounts.length > 0 ? ` · ${tableSectionHint}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-[200px] min-w-[140px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto">
                      {isLoading ? (
                        <div className="flex min-h-full items-center justify-center py-16">
                          <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
                        </div>
                      ) : error ? (
                        <div className="flex min-h-full items-center justify-center py-16 text-center text-destructive">
                          Failed to load accounts.
                        </div>
                      ) : accounts.length === 0 ? (
                        <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
                          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10">
                            <Users className="h-10 w-10 text-brand-primary" />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                            No accounts yet
                          </h3>
                          <p className="mb-4 text-muted-foreground">Add your first account.</p>
                          <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-brand-primary hover:bg-brand-primary-hover"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add account
                          </Button>
                        </div>
                      ) : emptyFiltered ? (
                        <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
                          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                            No accounts in this view
                          </h3>
                          <p className="mx-auto max-w-lg text-sm text-muted-foreground">
                            No accounts here have open {isOpenReceivable ? 'receivable' : 'payable'} invoices right now.
                            Try another section or open an account from an invoice.
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
                                {isAllAccounts ? (
                                  <>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Open balances</TableHead>
                                  </>
                                ) : null}
                                {isOpenPayable ? (
                                  <>
                                    <TableHead className="text-right">Open payable</TableHead>
                                    <TableHead className="text-right">Open invoices</TableHead>
                                  </>
                                ) : null}
                                {isOpenReceivable ? (
                                  <>
                                    <TableHead className="text-right">Open receivable</TableHead>
                                    <TableHead className="text-right">Open invoices</TableHead>
                                  </>
                                ) : null}
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {accountsRowsForTable.map((acc) => {
                                const rollup = getRollup(acc.id);
                                return (
                                <TableRow
                                  key={acc.id}
                                  className="cursor-pointer hover:bg-muted/30"
                                  onClick={() => handleView(acc)}
                                >
                                  <TableCell className="font-mono text-sm text-muted-foreground">{acc.id}</TableCell>
                                  <TableCell className="font-medium">{acc.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{acc.account_code || '-'}</TableCell>
                                  <TableCell>{getContactSummary(acc)}</TableCell>
                                  <TableCell>{getAddressSummary(acc)}</TableCell>
                                  {isAllAccounts ? (
                                    <>
                                      <TableCell>{renderAccountTags(acc)}</TableCell>
                                      <TableCell className="text-sm tabular-nums">
                                        {formatOpenBalancesSummary(acc.id)}
                                      </TableCell>
                                    </>
                                  ) : null}
                                  {isOpenPayable ? (
                                    <>
                                      <TableCell className="text-right tabular-nums">
                                        {rollup.payableOutstanding > 0
                                          ? formatCurrency(rollup.payableOutstanding)
                                          : '-'}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {rollup.openPayableCount > 0 ? rollup.openPayableCount : '-'}
                                      </TableCell>
                                    </>
                                  ) : null}
                                  {isOpenReceivable ? (
                                    <>
                                      <TableCell className="text-right tabular-nums">
                                        {rollup.receivableOutstanding > 0
                                          ? formatCurrency(rollup.receivableOutstanding)
                                          : '-'}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">
                                        {rollup.openReceivableCount > 0 ? rollup.openReceivableCount : '-'}
                                      </TableCell>
                                    </>
                                  ) : null}
                                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mr-1 h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
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
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                    {showAccountsPager ? (
                      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-muted/20 px-4 py-2">
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
                        <span className="text-xs tabular-nums text-muted-foreground">
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

      <AddAccountDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
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
