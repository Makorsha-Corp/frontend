import React, { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import DateRangeFilterTrigger, {
  type DateRangeValue,
} from '@/components/newcomponents/customui/DateRangeFilterTrigger';
import OrderStatusMultiFilter from '@/components/newcomponents/customui/orders/OrderStatusMultiFilter';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { ALLOCATION_TYPES } from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import type { Account } from '@/types/account';
import type { Status } from '@/types/status';
import type { InvoiceFilter } from '@/pages/newpages/orders/expenseOrdersOverviewData';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

export interface ExpenseOrderHeaderFiltersProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
  statusFilters: string[];
  onStatusFiltersChange: (selectedIds: string[]) => void;
  eoStatusOptions: Status[];
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  accounts: Account[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  invoiceFilter: InvoiceFilter;
  onInvoiceFilterChange: (value: InvoiceFilter) => void;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
  onClearFilters: () => void;
}

function countExpenseHeaderFilters(args: {
  dateRange: DateRangeValue;
  statusFilterCount: number;
  accountFilter: string;
  categoryFilter: string;
  invoiceFilter: InvoiceFilter;
  showCompleteOrders: boolean;
}): number {
  let count = 0;
  if (args.dateRange.from != null || args.dateRange.to != null) count += 1;
  if (args.statusFilterCount > 0) count += 1;
  if (args.accountFilter !== 'all') count += 1;
  if (args.categoryFilter !== 'all') count += 1;
  if (args.invoiceFilter !== 'all') count += 1;
  if (args.showCompleteOrders) count += 1;
  return count;
}

const ExpenseOrderHeaderFilters: React.FC<ExpenseOrderHeaderFiltersProps> = ({
  open: openControlled,
  onOpenChange: onOpenChangeControlled,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  eoStatusOptions,
  accountFilter,
  onAccountFilterChange,
  accounts,
  categoryFilter,
  onCategoryFilterChange,
  invoiceFilter,
  onInvoiceFilterChange,
  showCompleteOrders,
  onShowCompleteOrdersChange,
  onClearFilters,
}) => {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openControlled ?? openUncontrolled;
  const setOpen = onOpenChangeControlled ?? setOpenUncontrolled;

  const filterCount = useMemo(
    () =>
      countExpenseHeaderFilters({
        dateRange,
        statusFilterCount: statusFilters.length,
        accountFilter,
        categoryFilter,
        invoiceFilter,
        showCompleteOrders,
      }),
    [
      dateRange,
      statusFilters.length,
      accountFilter,
      categoryFilter,
      invoiceFilter,
      showCompleteOrders,
    ],
  );

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={filterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          data-help-tour="expense.filter-toggle"
          aria-expanded={open}
          aria-controls="eo-filters-bar"
          className={cn('shrink-0 gap-1.5', appShellHeaderControlClass)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {filterCount > 0 ? (
            <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
              {filterCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id="eo-filters-bar"
        data-help-tour="expense.filters-panel"
        align="start"
        className="w-[min(20rem,94vw)] p-0"
        onCloseAutoFocus={preventRadixCloseAutoFocus}
      >
        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Date range
            </p>
            <DateRangeFilterTrigger
              value={dateRange}
              onChange={onDateRangeChange}
              triggerClassName="w-full max-w-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <OrderStatusMultiFilter
              options={eoStatusOptions}
              selectedIds={statusFilters}
              onChange={onStatusFiltersChange}
              triggerClassName="w-full max-w-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            <Select value={accountFilter} onValueChange={onAccountFilterChange}>
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Category
            </p>
            <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {ALLOCATION_TYPES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Invoice
            </p>
            <Select
              value={invoiceFilter}
              onValueChange={(v) => onInvoiceFilterChange(v as InvoiceFilter)}
            >
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All invoices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All invoices</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="not_invoiced">Not invoiced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Label
              htmlFor="eo-show-complete-header-filters"
              className="cursor-pointer text-sm font-normal text-foreground"
            >
              Show completed orders
            </Label>
            <Switch
              id="eo-show-complete-header-filters"
              checked={showCompleteOrders}
              onCheckedChange={onShowCompleteOrdersChange}
              aria-label="Show completed orders"
            />
          </div>
        </div>

        {filterCount > 0 ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-center gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={onClearFilters}
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export default ExpenseOrderHeaderFilters;
