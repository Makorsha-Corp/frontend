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
import { countPurchaseHeaderFilters } from '@/components/newcomponents/customui/orders/purchaseHeaderFilterHelpers';
import type { Account } from '@/types/account';
import type { Factory } from '@/types/factory';
import type { Status } from '@/types/status';
import type {
  DestinationTypeFilter,
  InvoiceFilter,
} from '@/pages/newpages/orders/purchaseOrdersOverviewData';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

const DESTINATION_FILTER_LABELS: Record<DestinationTypeFilter, string> = {
  all: 'All destinations',
  storage: 'Storage',
  machine: 'Machine',
  project: 'Project',
};

export interface PurchaseOrderHeaderFiltersProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
  statusFilters: string[];
  onStatusFiltersChange: (selectedIds: string[]) => void;
  poStatusOptions: Status[];
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  accounts: Account[];
  factoryFilter: string;
  onFactoryFilterChange: (value: string) => void;
  factories: Factory[];
  destinationFilter: DestinationTypeFilter;
  onDestinationFilterChange: (value: DestinationTypeFilter) => void;
  invoiceFilter: InvoiceFilter;
  onInvoiceFilterChange: (value: InvoiceFilter) => void;
  showVoidedOrders: boolean;
  onShowVoidedOrdersChange: (value: boolean) => void;
  onClearFilters: () => void;
}

const PurchaseOrderHeaderFilters: React.FC<PurchaseOrderHeaderFiltersProps> = ({
  open: openControlled,
  onOpenChange: onOpenChangeControlled,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  poStatusOptions,
  accountFilter,
  onAccountFilterChange,
  accounts,
  factoryFilter,
  onFactoryFilterChange,
  factories,
  destinationFilter,
  onDestinationFilterChange,
  invoiceFilter,
  onInvoiceFilterChange,
  showVoidedOrders,
  onShowVoidedOrdersChange,
  onClearFilters,
}) => {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openControlled ?? openUncontrolled;
  const setOpen = onOpenChangeControlled ?? setOpenUncontrolled;

  const filterCount = useMemo(
    () =>
      countPurchaseHeaderFilters({
        dateRange,
        statusFilterCount: statusFilters.length,
        accountFilter,
        factoryFilter,
        destinationFilter,
        invoiceFilter,
        showVoidedOrders,
      }),
    [
      dateRange,
      statusFilters.length,
      accountFilter,
      factoryFilter,
      destinationFilter,
      invoiceFilter,
      showVoidedOrders,
    ],
  );

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={filterCount > 0 ? 'secondary' : 'outline'}
          size="sm"
          data-help-tour="purchase.filter-toggle"
          aria-expanded={open}
          aria-controls="po-filters-bar"
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
        id="po-filters-bar"
        data-help-tour="purchase.filters-panel"
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
              options={poStatusOptions}
              selectedIds={statusFilters}
              onChange={onStatusFiltersChange}
              triggerClassName="w-full max-w-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Supplier
            </p>
            <Select value={accountFilter} onValueChange={onAccountFilterChange}>
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
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
              Factory
            </p>
            <Select value={factoryFilter} onValueChange={onFactoryFilterChange}>
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All factories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All factories</SelectItem>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Destination
            </p>
            <Select
              value={destinationFilter}
              onValueChange={(v) => onDestinationFilterChange(v as DestinationTypeFilter)}
            >
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All destinations">
                  {DESTINATION_FILTER_LABELS[destinationFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All destinations</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="machine">Machine</SelectItem>
                <SelectItem value="project">Project</SelectItem>
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
                <SelectItem value="outstanding_payment">Outstanding payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Label
              htmlFor="po-show-voided-header-filters"
              className="cursor-pointer text-sm font-normal text-foreground"
            >
              Show voided orders
            </Label>
            <Switch
              id="po-show-voided-header-filters"
              checked={showVoidedOrders}
              onCheckedChange={onShowVoidedOrdersChange}
              aria-label="Show voided orders"
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

export default PurchaseOrderHeaderFilters;
