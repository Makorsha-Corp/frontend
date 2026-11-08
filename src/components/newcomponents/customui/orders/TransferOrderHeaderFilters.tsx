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
import type { Factory } from '@/types/factory';
import type { Status } from '@/types/status';
import type { TransferLocationTypeFilter } from '@/pages/newpages/orders/transferOrdersOverviewData';
import { preventRadixCloseAutoFocus } from '@/lib/radixFloatingLayer';
import { cn } from '@/lib/utils';

const LOCATION_TYPE_OPTIONS: { value: TransferLocationTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'storage', label: 'Storage' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged' },
];

export interface TransferOrderHeaderFiltersProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
  statusFilters: string[];
  onStatusFiltersChange: (selectedIds: string[]) => void;
  trStatusOptions: Status[];
  factoryFilter: string;
  onFactoryFilterChange: (value: string) => void;
  factories: Factory[];
  sourceTypeFilter: TransferLocationTypeFilter;
  onSourceTypeFilterChange: (value: TransferLocationTypeFilter) => void;
  destinationTypeFilter: TransferLocationTypeFilter;
  onDestinationTypeFilterChange: (value: TransferLocationTypeFilter) => void;
  showCompleteOrders: boolean;
  onShowCompleteOrdersChange: (value: boolean) => void;
  onClearFilters: () => void;
}

function countTransferHeaderFilters(args: {
  dateRange: DateRangeValue;
  statusFilterCount: number;
  factoryFilter: string;
  sourceTypeFilter: TransferLocationTypeFilter;
  destinationTypeFilter: TransferLocationTypeFilter;
  showCompleteOrders: boolean;
}): number {
  let count = 0;
  if (args.dateRange.from != null || args.dateRange.to != null) count += 1;
  if (args.statusFilterCount > 0) count += 1;
  if (args.factoryFilter !== 'all') count += 1;
  if (args.sourceTypeFilter !== 'all') count += 1;
  if (args.destinationTypeFilter !== 'all') count += 1;
  if (args.showCompleteOrders) count += 1;
  return count;
}

const TransferOrderHeaderFilters: React.FC<TransferOrderHeaderFiltersProps> = ({
  open: openControlled,
  onOpenChange: onOpenChangeControlled,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  trStatusOptions,
  factoryFilter,
  onFactoryFilterChange,
  factories,
  sourceTypeFilter,
  onSourceTypeFilterChange,
  destinationTypeFilter,
  onDestinationTypeFilterChange,
  showCompleteOrders,
  onShowCompleteOrdersChange,
  onClearFilters,
}) => {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openControlled ?? openUncontrolled;
  const setOpen = onOpenChangeControlled ?? setOpenUncontrolled;

  const filterCount = useMemo(
    () =>
      countTransferHeaderFilters({
        dateRange,
        statusFilterCount: statusFilters.length,
        factoryFilter,
        sourceTypeFilter,
        destinationTypeFilter,
        showCompleteOrders,
      }),
    [
      dateRange,
      statusFilters.length,
      factoryFilter,
      sourceTypeFilter,
      destinationTypeFilter,
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
          data-help-tour="transfer.filter-toggle"
          aria-expanded={open}
          aria-controls="tr-filters-bar"
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
        id="tr-filters-bar"
        data-help-tour="transfer.filters-panel"
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
              options={trStatusOptions}
              selectedIds={statusFilters}
              onChange={onStatusFiltersChange}
              triggerClassName="w-full max-w-none"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Factory
            </p>
            <Select value={factoryFilter} onValueChange={onFactoryFilterChange}>
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="Factory" />
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
              Source
            </p>
            <Select
              value={sourceTypeFilter}
              onValueChange={(v) => onSourceTypeFilterChange(v as TransferLocationTypeFilter)}
            >
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={`src-${opt.value}`} value={opt.value}>
                    {opt.value === 'all' ? 'All sources' : opt.label}
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
              value={destinationTypeFilter}
              onValueChange={(v) =>
                onDestinationTypeFilterChange(v as TransferLocationTypeFilter)
              }
            >
              <SelectTrigger className="h-9 w-full border-border bg-background text-sm">
                <SelectValue placeholder="All destinations">
                  {destinationTypeFilter === 'all'
                    ? 'All destinations'
                    : LOCATION_TYPE_OPTIONS.find((o) => o.value === destinationTypeFilter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={`dst-${opt.value}`} value={opt.value}>
                    {opt.value === 'all' ? 'All destinations' : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Label
              htmlFor="tr-show-complete-header-filters"
              className="cursor-pointer text-sm font-normal text-foreground"
            >
              Show completed orders
            </Label>
            <Switch
              id="tr-show-complete-header-filters"
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

export default TransferOrderHeaderFilters;
