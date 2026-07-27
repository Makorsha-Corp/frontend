import { formatIsoDateParam } from './orderListUrlParams';
import type { PurchaseOrderUrlFilters } from './orderListUrlParams';
import type { ListPurchaseOrdersHubParams } from '@/types/purchaseOrder';
import { ORDER_HUB_PAGE_SIZE } from './orderHubApiParams';

export function buildPurchaseOrderHubFilterParams(
  filters: PurchaseOrderUrlFilters,
  factoryFilter: string,
): Omit<ListPurchaseOrdersHubParams, 'skip' | 'limit'> {
  const statusIds = filters.statusFilters
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  return {
    ...(formatIsoDateParam(filters.dateRange.from)
      ? { date_from: formatIsoDateParam(filters.dateRange.from) }
      : {}),
    ...(formatIsoDateParam(filters.dateRange.to)
      ? { date_to: formatIsoDateParam(filters.dateRange.to) }
      : {}),
    ...(statusIds.length > 0 ? { status_ids: statusIds } : {}),
    ...(filters.accountFilter !== 'all'
      ? { account_id: Number(filters.accountFilter) }
      : {}),
    ...(factoryFilter !== 'all' ? { factory_id: Number(factoryFilter) } : {}),
    ...(filters.destinationFilter !== 'all'
      ? { destination_type: filters.destinationFilter }
      : {}),
    ...(filters.invoiceFilter !== 'all' ? { invoice_filter: filters.invoiceFilter } : {}),
    ...(filters.searchQuery.trim() ? { search: filters.searchQuery.trim() } : {}),
    exclude_complete: !filters.showCompleteOrders,
    exclude_voided: !filters.showVoidedOrders,
  };
}

export function buildPurchaseOrderHubListParams(
  filters: PurchaseOrderUrlFilters,
  factoryFilter: string,
  page: number,
): ListPurchaseOrdersHubParams {
  return {
    ...buildPurchaseOrderHubFilterParams(filters, factoryFilter),
    skip: Math.max(0, (page - 1) * ORDER_HUB_PAGE_SIZE),
    limit: ORDER_HUB_PAGE_SIZE,
  };
}
