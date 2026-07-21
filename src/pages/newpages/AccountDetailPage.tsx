import React, { useState } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { useParams, Link } from 'react-router-dom';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '@/components/ui/breadcrumb';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';
import { Users, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import EditAccountDialog from '@/components/newcomponents/customui/EditAccountDialog';
import AccountDetailsDialog from '@/components/newcomponents/customui/accounts/AccountDetailsDialog';
import AccountInvoiceDetailPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceDetailPanel';
import AccountInvoiceToolbar from '@/components/newcomponents/customui/accounts/AccountInvoiceToolbar';
import AccountInvoiceNavigatorPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceNavigatorPanel';
import { formatInvLabel } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';
import { useAccountInvoiceWorkspace } from '@/hooks/useAccountInvoiceWorkspace';
import { useIsLgScreen } from '@/hooks/useIsLgScreen';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const isLgScreen = useIsLgScreen();

  const accountId = id ? parseInt(id, 10) : null;
  const validAccountId = accountId != null && !Number.isNaN(accountId) ? accountId : null;

  const { data: account, isLoading, error } = useGetAccountByIdQuery(validAccountId!, {
    skip: validAccountId == null,
  });

  const workspace = useAccountInvoiceWorkspace(validAccountId);

  if (validAccountId == null) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">
          Invalid account ID. <Link to="/accounts" className="underline">Back to accounts</Link>
        </p>
      </div>
    );
  }

  const showDetailOnMobile = workspace.selectedInvoiceId != null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4">
              <div className={cn(appShellHeaderLeftGroupClass, 'min-w-0 flex-1')}>
                <div className={appShellHeaderIconTileClass}>
                  <Users className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className={appShellHeaderTitleClass}>
                  <Link
                    to={workspace.accountsHubPath}
                    className="hover:text-brand-primary transition-colors"
                  >
                    Accounts
                  </Link>
                </h1>
                {account ? (
                  <>
                    <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
                    <Breadcrumb className="min-w-0">
                      <BreadcrumbList className="items-center text-card-foreground dark:text-foreground">
                        <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                          <button
                            type="button"
                            onClick={workspace.closeAccount}
                            className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Back to accounts from ${account.name}`}
                          >
                            <ChevronLeft className="h-4 w-4 shrink-0" />
                            <span className="truncate px-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground">
                              {account.name}
                            </span>
                          </button>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                    {workspace.selectedInvoiceFromList ? (
                      <>
                        <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
                        <Breadcrumb className="min-w-0">
                          <BreadcrumbList className="items-center text-card-foreground dark:text-foreground">
                            <BreadcrumbItem className="max-w-[min(280px,50vw)] min-w-0">
                              <button
                                type="button"
                                onClick={() => workspace.selectInvoice(null)}
                                className="inline-flex h-7 max-w-[min(280px,50vw)] min-w-0 items-center gap-0.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Back to invoices"
                              >
                                <ChevronLeft className="h-4 w-4 shrink-0" />
                                <span
                                  className="truncate px-0.5 text-[15px] font-medium text-card-foreground dark:text-foreground"
                                  data-testid="account-invoice-header-label"
                                >
                                  {formatInvLabel(workspace.selectedInvoiceFromList)}
                                </span>
                              </button>
                            </BreadcrumbItem>
                          </BreadcrumbList>
                        </Breadcrumb>
                      </>
                    ) : null}
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setAccountDetailsOpen(true)}
                  disabled={!account}
                  className={appShellHeaderControlClass}
                  data-testid="account-open-details-dialog"
                >
                  Account details
                </Button>
              </div>
            </div>
        </AppShellHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
          </div>
        ) : error || !account ? (
          <div className="flex flex-1 items-center justify-center text-destructive">
            Failed to load account.{' '}
            <Link to={workspace.accountsHubPath} className="underline ml-1">
              Back to accounts
            </Link>
          </div>
        ) : (
          <>
            <AccountInvoiceToolbar
              invoiced={workspace.summary?.invoiced ?? 0}
              paid={workspace.summary?.paid ?? 0}
              outstanding={workspace.summary?.outstanding ?? 0}
              summaryLoading={workspace.summaryLoading}
              search={workspace.invoiceSearch}
              onSearchChange={workspace.setInvoiceSearch}
              invoiceTypeFilter={workspace.invoiceTypeFilter}
              onInvoiceTypeFilterChange={workspace.setInvoiceTypeFilter}
              invoiceStatusFilter={workspace.invoiceStatusFilter}
              onInvoiceStatusFilterChange={workspace.setInvoiceStatusFilter}
              invoiceDateFrom={workspace.invoiceDateFrom}
              onInvoiceDateFromChange={workspace.setInvoiceDateFrom}
              invoiceDateTo={workspace.invoiceDateTo}
              onInvoiceDateToChange={workspace.setInvoiceDateTo}
              dueDateFrom={workspace.dueDateFrom}
              onDueDateFromChange={workspace.setDueDateFrom}
              dueDateTo={workspace.dueDateTo}
              onDueDateToChange={workspace.setDueDateTo}
              filtersExpanded={workspace.filtersExpanded}
              onToggleFiltersExpanded={() => workspace.setFiltersExpanded((v) => !v)}
              activeFilterCount={workspace.activeFilterCount}
              onClearFilters={workspace.clearFilters}
            />

            <div className="flex flex-1 min-h-0 overflow-hidden bg-background">
              <AccountInvoiceNavigatorPanel
                className={cn(
                  showDetailOnMobile && 'max-lg:hidden',
                  !isLgScreen && !showDetailOnMobile && 'flex-1 border-r-0 max-w-none'
                )}
                invoices={workspace.invoices}
                selectedInvoiceId={workspace.selectedInvoiceId}
                invoiceOrderNumberMap={workspace.invoiceOrderNumberMap}
                isLoading={workspace.invoiceListLoading}
                invoiceCountLabel={workspace.invoiceCountLabel}
                listCapped={workspace.invoiceListCapped}
                onSelectInvoice={workspace.selectInvoice}
              />

              <div
                className={cn(
                  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
                  !showDetailOnMobile && 'max-lg:hidden'
                )}
                data-testid="account-invoice-detail-panel"
              >
                {workspace.selectedInvoiceId == null ? (
                  <div className="flex flex-1 items-center justify-center p-6">
                    <p className="text-sm text-muted-foreground">Select an invoice to view details.</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
                    {!isLgScreen ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mb-3 -ml-2 lg:hidden"
                        onClick={() => workspace.selectInvoice(null)}
                      >
                        ← Back to invoices
                      </Button>
                    ) : null}
                    <AccountInvoiceDetailPanel
                      invoiceId={workspace.selectedInvoiceId}
                      invoice={workspace.selectedInvoiceFromList ?? undefined}
                      linkedOrderNumber={
                        workspace.invoiceOrderNumberMap.get(workspace.selectedInvoiceId) ?? null
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <AccountDetailsDialog
        account={account}
        open={accountDetailsOpen}
        onOpenChange={setAccountDetailsOpen}
        onEdit={() => setIsEditDialogOpen(true)}
      />

      <EditAccountDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        account={account ?? null}
      />
    </div>
  );
};

export default AccountDetailPage;
