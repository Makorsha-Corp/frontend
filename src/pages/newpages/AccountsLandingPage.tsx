import React, { useState, useMemo, useEffect } from 'react';
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
import { useGetAccountsHubPageQuery, useDeleteAccountMutation } from '@/features/accounts/accountsApi';
import { useGetAccountInvoicesHubSummaryQuery } from '@/features/accountInvoices/accountInvoicesApi';
import type { Account, AccountHubRow, AccountsHubSection } from '@/types/account';
import {
  Building2,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  LayoutDashboard,
} from 'lucide-react';
import AddAccountDialog from '@/components/newcomponents/customui/AddAccountDialog';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import ManageAccountsDialog from '@/components/newcomponents/customui/ManageAccountsDialog';
import AccountsHubSectionCard from '@/components/newcomponents/customui/accounts/AccountsHubSectionCard';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import { resolveClampedPage } from '@/pages/newpages/orders/orderHubApiParams';
import ListPagePagination from '@/components/newcomponents/customui/ListPagePagination';

const SECTION_CONFIG = [
  { path: 'overview', label: 'Overview', icon: LayoutDashboard, kind: 'all_accounts' as const },
  { path: 'payable', label: 'Payable', icon: ArrowDownLeft, kind: 'open_payable' as const },
  { path: 'receivable', label: 'Receivable', icon: ArrowUpRight, kind: 'open_receivable' as const },
] as const;

export type AccountsHubSectionPath = (typeof SECTION_CONFIG)[number]['path'];

const hubSectionFromPath = (path: AccountsHubSectionPath): AccountsHubSection => path;

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
  const [editingAccount, setEditingAccount] = useState<AccountHubRow | null>(null);
  const [accountPage, setAccountPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const activeConfig = SECTION_CONFIG.find((s) => s.path === selectedSection)!;
  const isAllAccounts = activeConfig.kind === 'all_accounts';
  const isOpenReceivable = activeConfig.kind === 'open_receivable';
  const isOpenPayable = activeConfig.kind === 'open_payable';
  const hubSection = hubSectionFromPath(selectedSection);
  const hubPageSize = API_LIMITS.ACCOUNTS_HUB_PAGE_SIZE;

  useEffect(() => {
    setAccountPage(1);
  }, [selectedSection, debouncedSearch]);

  const { data: hubSummary } = useGetAccountInvoicesHubSummaryQuery();

  const {
    data: hubPage,
    isLoading,
    isFetching,
    error,
  } = useGetAccountsHubPageQuery({
    section: hubSection,
    search: debouncedSearch || undefined,
    skip: (accountPage - 1) * hubPageSize,
    limit: hubPageSize,
  });

  const accountsRowsForTable = hubPage?.items ?? [];
  const accountsTotal = hubPage?.total ?? 0;

  useEffect(() => {
    const clamped = resolveClampedPage(accountPage, hubPage?.total, hubPageSize);
    if (clamped !== null) setAccountPage(clamped);
  }, [accountPage, hubPage?.total, hubPageSize]);

  const payableSectionMetrics = useMemo(
    () => ({
      outstanding: hubSummary?.payable.outstandingTotal ?? 0,
      openInvoiceCount: hubSummary?.payable.openCount ?? 0,
      overdueCount: hubSummary?.payable.overdueCount ?? 0,
      accountsInList: hubSummary?.payable.accountsWithOpenCount ?? 0,
    }),
    [hubSummary]
  );

  const receivableSectionMetrics = useMemo(
    () => ({
      outstanding: hubSummary?.receivable.outstandingTotal ?? 0,
      openInvoiceCount: hubSummary?.receivable.openCount ?? 0,
      overdueCount: hubSummary?.receivable.overdueCount ?? 0,
      accountsInList: hubSummary?.receivable.accountsWithOpenCount ?? 0,
    }),
    [hubSummary]
  );

  const overviewPopulationMetrics = useMemo(() => {
    const total = hubSummary?.totalActiveAccounts ?? 0;
    const withAnyOpen = hubSummary?.accountsWithAnyOpenBalance ?? 0;
    return {
      withOpenPayable: hubSummary?.payable.accountsWithOpenCount ?? 0,
      withOpenReceivable: hubSummary?.receivable.accountsWithOpenCount ?? 0,
      withNoOpenBalance: Math.max(0, total - withAnyOpen),
      totalAccounts: total,
    };
  }, [hubSummary]);

  const searchPlaceholder = isAllAccounts
    ? 'Search accounts...'
    : `Search ${activeConfig.label.toLowerCase()}...`;

  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const handleSectionSelect = (path: AccountsHubSectionPath) => {
    setSelectedSection(path);
    navigate(`/accounts/${path}`, { replace: true });
  };

  const handleEdit = (account: AccountHubRow) => setEditingAccount(account);
  const handleView = (account: AccountHubRow) =>
    navigate(`/accounts/${account.id}`, { state: { fromSection: selectedSection } });
  const handleDelete = async (account: AccountHubRow) => {
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

  const getRollup = (account: AccountHubRow) => account.openBalance;

  const formatOpenBalancesSummary = (account: AccountHubRow) => {
    const rollup = getRollup(account);
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

  const getContactSummary = (acc: AccountHubRow) => acc.primary_contact_person || acc.primary_email || acc.primary_phone || '-';
  const getAddressSummary = (acc: AccountHubRow) => [acc.address, acc.city, acc.country].filter(Boolean).join(', ') || '-';

  const showAccountsPager = !isLoading && !error && accountsTotal > 0;

  const emptyFiltered =
    !isLoading &&
    !error &&
    overviewPopulationMetrics.totalAccounts > 0 &&
    accountsTotal === 0 &&
    (isOpenReceivable || isOpenPayable);

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader>
          <div className="flex items-center justify-between">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <Building2 className="h-5 w-5 text-brand-primary" />
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
              value={overviewPopulationMetrics.totalAccounts}
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
                { label: 'Accounts in list', value: payableSectionMetrics.accountsInList },
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
                { label: 'Accounts in list', value: receivableSectionMetrics.accountsInList },
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
                            {accountsTotal}{' '}
                            {accountsTotal === 1 ? 'account' : 'accounts'}
                            {showAccountsPager ? ` · page ${accountPage}` : ''}
                            {accountsTotal > 0 ? ` · ${tableSectionHint}` : ''}
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
                      ) : overviewPopulationMetrics.totalAccounts === 0 ? (
                        <div className="flex min-h-full flex-col items-center justify-center px-4 py-16 text-center">
                          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10">
                            <Building2 className="h-10 w-10 text-brand-primary" />
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
                                const rollup = getRollup(acc);
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
                                        {formatOpenBalancesSummary(acc)}
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
                    {showAccountsPager && accountsTotal > hubPageSize ? (
                      <ListPagePagination
                        page={accountPage}
                        total={accountsTotal}
                        pageSize={hubPageSize}
                        isFetching={isFetching}
                        onPageChange={setAccountPage}
                      />
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
    </>
  );
};

export default AccountsLandingPage;
