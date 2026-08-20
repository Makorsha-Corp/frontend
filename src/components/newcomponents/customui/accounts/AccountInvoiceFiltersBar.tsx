import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  AccountInvoiceStatusFilter,
  AccountInvoiceTypeFilter,
} from '@/hooks/useAccountInvoiceWorkspace';

export interface AccountInvoiceFiltersBarProps {
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
  /** When true, omit outer toolbar chrome (used inside AccountInvoiceToolbar). */
  embedded?: boolean;
  className?: string;
}

const AccountInvoiceFiltersBar: React.FC<AccountInvoiceFiltersBarProps> = ({
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
  embedded = false,
  className,
}) => {
  const advancedFilterCount = useMemo(() => {
    let count = 0;
    if (invoiceDateFrom || invoiceDateTo) count += 1;
    if (dueDateFrom || dueDateTo) count += 1;
    return count;
  }, [invoiceDateFrom, invoiceDateTo, dueDateFrom, dueDateTo]);

  const clearAdvancedFilters = () => {
    onInvoiceDateFromChange('');
    onInvoiceDateToChange('');
    onDueDateFromChange('');
    onDueDateToChange('');
  };

  return (
    <div
      id={embedded ? undefined : 'account-invoice-filters-bar'}
      className={cn(
        embedded
          ? 'flex flex-wrap items-center gap-2'
          : 'shrink-0 border-b border-border bg-card/50 px-4 py-3 flex flex-wrap items-center gap-2',
        className
      )}
    >
      <div className="relative w-full min-w-[180px] flex-1 sm:max-w-[280px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Order #, vendor #, or invoice #"
          className="h-9 pl-9"
          data-testid="account-invoice-search"
          aria-label="Search invoices by invoice number, vendor number, or order number"
        />
      </div>

      <Select
        value={invoiceTypeFilter}
        onValueChange={(v) => onInvoiceTypeFilterChange(v as AccountInvoiceTypeFilter)}
      >
        <SelectTrigger className="h-9 w-[150px] shrink-0" aria-label="Invoice type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="payable">Payable</SelectItem>
          <SelectItem value="receivable">Receivable</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={invoiceStatusFilter}
        onValueChange={(v) => onInvoiceStatusFilterChange(v as AccountInvoiceStatusFilter)}
      >
        <SelectTrigger className="h-9 w-[140px] shrink-0" aria-label="Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="voided">Voided</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={filtersExpanded} onOpenChange={onFiltersExpandedChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={advancedFilterCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            className="h-9 shrink-0"
            aria-expanded={filtersExpanded}
            aria-controls="account-invoice-advanced-filters"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            More
            {advancedFilterCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-brand-primary/15 px-1.5 text-xs font-medium text-brand-primary">
                {advancedFilterCount}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(20rem,94vw)] p-4">
          <div id="account-invoice-advanced-filters" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-card-foreground">Invoice date</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={invoiceDateFrom}
                  onChange={(e) => onInvoiceDateFromChange(e.target.value)}
                  className="h-9 w-[140px] text-sm"
                  aria-label="Invoice date from"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={invoiceDateTo}
                  onChange={(e) => onInvoiceDateToChange(e.target.value)}
                  className="h-9 w-[140px] text-sm"
                  aria-label="Invoice date to"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-card-foreground">Due date</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => onDueDateFromChange(e.target.value)}
                  className="h-9 w-[140px] text-sm"
                  aria-label="Due date from"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => onDueDateToChange(e.target.value)}
                  className="h-9 w-[140px] text-sm"
                  aria-label="Due date to"
                />
              </div>
            </div>
            {advancedFilterCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
                onClick={clearAdvancedFilters}
              >
                Clear date filters
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      {activeFilterCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onClearFilters}
          aria-label="Clear filters"
          title="Clear filters"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default AccountInvoiceFiltersBar;
