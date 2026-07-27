import React from 'react';
import AccountInvoiceKpiStrip from './AccountInvoiceKpiStrip';
import AccountInvoiceFiltersBar from './AccountInvoiceFiltersBar';
import { cn } from '@/lib/utils';
import type { AccountTagInfo } from '@/types/account';
import type {
  AccountInvoiceStatusFilter,
  AccountInvoiceTypeFilter,
} from '@/hooks/useAccountInvoiceWorkspace';

export interface AccountInvoiceToolbarProps {
  accountName: string;
  accountTags?: AccountTagInfo[];
  invoiced: number;
  paid: number;
  outstanding: number;
  summaryLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  invoiceTypeFilter: AccountInvoiceTypeFilter;
  onInvoiceTypeFilterChange: (value: AccountInvoiceTypeFilter) => void;
  invoiceStatusFilter: AccountInvoiceStatusFilter;
  onInvoiceStatusFilterChange: (value: AccountInvoiceStatusFilter) => void;
  invoiceDateFrom: string;
  onInvoiceDateFromChange: (value: string) => void;
  invoiceDateTo: string;
  onInvoiceDateToChange: (value: string) => void;
  dueDateFrom: string;
  onDueDateFromChange: (value: string) => void;
  dueDateTo: string;
  onDueDateToChange: (value: string) => void;
  filtersExpanded: boolean;
  onFiltersExpandedChange: (open: boolean) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  className?: string;
}

const AccountInvoiceToolbar: React.FC<AccountInvoiceToolbarProps> = ({
  accountName,
  accountTags = [],
  invoiced,
  paid,
  outstanding,
  summaryLoading,
  search,
  onSearchChange,
  invoiceTypeFilter,
  onInvoiceTypeFilterChange,
  invoiceStatusFilter,
  onInvoiceStatusFilterChange,
  invoiceDateFrom,
  onInvoiceDateFromChange,
  invoiceDateTo,
  onInvoiceDateToChange,
  dueDateFrom,
  onDueDateFromChange,
  dueDateTo,
  onDueDateToChange,
  filtersExpanded,
  onFiltersExpandedChange,
  activeFilterCount,
  onClearFilters,
  className,
}) => {
  const primaryTag = accountTags[0];

  return (
    <div
      id="account-invoice-toolbar"
      className={cn(
        'shrink-0 border-b border-border bg-card/50 px-4 py-3',
        className
      )}
    >
      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-0">
        <div
          className="min-w-0 shrink-0 lg:max-w-[min(16rem,22vw)] lg:pr-4"
          data-testid="account-invoice-toolbar-account"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {primaryTag?.name ?? 'Account'}
          </p>
          <p
            className="mt-0.5 truncate text-base font-semibold leading-tight text-card-foreground sm:text-lg"
            data-testid="account-invoice-toolbar-name"
            title={accountName}
          >
            {accountName}
          </p>
        </div>

        <div
          className="hidden lg:block w-px self-stretch min-h-[2.75rem] bg-border shrink-0"
          aria-hidden
        />

        <div className="h-px w-full bg-border lg:hidden" aria-hidden />

        <AccountInvoiceKpiStrip
          invoiced={invoiced}
          paid={paid}
          outstanding={outstanding}
          isLoading={summaryLoading}
          compact
          expand
          className="min-w-0 flex-1 lg:pr-4"
        />

        <div
          className="hidden lg:block w-px self-stretch min-h-[2.75rem] bg-border shrink-0"
          aria-hidden
        />

        <div className="h-px w-full bg-border lg:hidden" aria-hidden />

        <AccountInvoiceFiltersBar
          embedded
          search={search}
          onSearchChange={onSearchChange}
          invoiceTypeFilter={invoiceTypeFilter}
          onInvoiceTypeFilterChange={onInvoiceTypeFilterChange}
          invoiceStatusFilter={invoiceStatusFilter}
          onInvoiceStatusFilterChange={onInvoiceStatusFilterChange}
          invoiceDateFrom={invoiceDateFrom}
          onInvoiceDateFromChange={onInvoiceDateFromChange}
          invoiceDateTo={invoiceDateTo}
          onInvoiceDateToChange={onInvoiceDateToChange}
          dueDateFrom={dueDateFrom}
          onDueDateFromChange={onDueDateFromChange}
          dueDateTo={dueDateTo}
          onDueDateToChange={onDueDateToChange}
          filtersExpanded={filtersExpanded}
          onFiltersExpandedChange={onFiltersExpandedChange}
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          className="shrink-0 lg:pl-4"
        />
      </div>
    </div>
  );
};

export default AccountInvoiceToolbar;
