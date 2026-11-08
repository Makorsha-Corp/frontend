import type { DateRangeValue } from '@/components/newcomponents/customui/DateRangeFilterTrigger';
import type {
  DestinationTypeFilter,
  InvoiceFilter,
} from '@/pages/newpages/orders/purchaseOrdersOverviewData';

export function countPurchaseHeaderFilters(args: {
  dateRange: DateRangeValue;
  statusFilterCount: number;
  accountFilter: string;
  factoryFilter: string;
  destinationFilter: DestinationTypeFilter;
  invoiceFilter: InvoiceFilter;
  showVoidedOrders: boolean;
}): number {
  let count = 0;
  if (args.dateRange.from != null || args.dateRange.to != null) count += 1;
  if (args.statusFilterCount > 0) count += 1;
  if (args.accountFilter !== 'all') count += 1;
  if (args.factoryFilter !== 'all') count += 1;
  if (args.destinationFilter !== 'all') count += 1;
  if (args.invoiceFilter !== 'all') count += 1;
  if (args.showVoidedOrders) count += 1;
  return count;
}
