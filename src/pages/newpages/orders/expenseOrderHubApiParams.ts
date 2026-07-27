import { formatIsoDateParam } from './orderListUrlParams';
import type { ExpenseOrderUrlFilters } from './orderListUrlParams';
import type { ListExpenseOrdersHubParams } from '@/types/expenseOrder';
import { ORDER_HUB_PAGE_SIZE } from './orderHubApiParams';

export function buildExpenseOrderHubFilterParams(
  filters: ExpenseOrderUrlFilters,
): Omit<ListExpenseOrdersHubParams, 'skip' | 'limit'> {
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
    ...(filters.categoryFilter !== 'all'
      ? { expense_category: filters.categoryFilter }
      : {}),
    ...(filters.invoiceFilter !== 'all' ? { invoice_filter: filters.invoiceFilter } : {}),
    ...(filters.searchQuery.trim() ? { search: filters.searchQuery.trim() } : {}),
    exclude_complete: !filters.showCompleteOrders,
    exclude_voided: false,
  };
}

export function buildExpenseOrderHubListParams(
  filters: ExpenseOrderUrlFilters,
  page: number,
): ListExpenseOrdersHubParams {
  return {
    ...buildExpenseOrderHubFilterParams(filters),
    skip: Math.max(0, (page - 1) * ORDER_HUB_PAGE_SIZE),
    limit: ORDER_HUB_PAGE_SIZE,
  };
}
