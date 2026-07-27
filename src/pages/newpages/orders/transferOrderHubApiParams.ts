import { formatIsoDateParam } from './orderListUrlParams';
import type { TransferOrderUrlFilters } from './orderListUrlParams';
import type { ListTransferOrdersHubParams } from '@/types/transferOrder';
import { ORDER_HUB_PAGE_SIZE } from './orderHubApiParams';

export function buildTransferOrderHubFilterParams(
  filters: TransferOrderUrlFilters,
  factoryFilter: string,
): Omit<ListTransferOrdersHubParams, 'skip' | 'limit'> {
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
    ...(factoryFilter !== 'all' ? { factory_id: Number(factoryFilter) } : {}),
    ...(filters.sourceTypeFilter !== 'all'
      ? { source_location_type: filters.sourceTypeFilter }
      : {}),
    ...(filters.destinationTypeFilter !== 'all'
      ? { destination_location_type: filters.destinationTypeFilter }
      : {}),
    ...(filters.searchQuery.trim() ? { search: filters.searchQuery.trim() } : {}),
    exclude_complete: !filters.showCompleteOrders,
  };
}

export function buildTransferOrderHubListParams(
  filters: TransferOrderUrlFilters,
  factoryFilter: string,
  page: number,
): ListTransferOrdersHubParams {
  return {
    ...buildTransferOrderHubFilterParams(filters, factoryFilter),
    skip: Math.max(0, (page - 1) * ORDER_HUB_PAGE_SIZE),
    limit: ORDER_HUB_PAGE_SIZE,
  };
}
