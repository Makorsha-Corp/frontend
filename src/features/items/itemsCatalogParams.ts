import { API_LIMITS } from '@/constants/apiLimits';
import type { ListItemsPageParams } from '@/types/item';

export interface ItemsCatalogFilters {
  searchQuery: string;
  unitFilter: string;
  tagFilterIds: number[];
}

export interface ItemsCatalogPaginationState {
  page: number;
}

const PAGE_SIZE = API_LIMITS.ITEMS_CATALOG_PAGE_SIZE;

export function parseItemsCatalogPage(raw: string | null): number {
  const parsed = Number(raw ?? '1');
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function itemsPageCount(total: number, pageSize: number = PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function buildItemsCatalogQueryParams(
  filters: ItemsCatalogFilters,
  pagination: ItemsCatalogPaginationState,
): ListItemsPageParams {
  const { page } = pagination;
  const search = filters.searchQuery.trim();

  return {
    skip: Math.max(0, (page - 1) * PAGE_SIZE),
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
    ...(filters.unitFilter ? { unit: filters.unitFilter } : {}),
    ...(filters.tagFilterIds.length > 0 ? { tag_ids: filters.tagFilterIds } : {}),
  };
}

export function buildItemsCatalogSearchParams(
  filters: ItemsCatalogFilters,
  page: number,
): URLSearchParams {
  const params = new URLSearchParams();
  const search = filters.searchQuery.trim();

  if (search) params.set('itemSearch', search);
  if (filters.unitFilter) params.set('itemUnit', filters.unitFilter);
  if (filters.tagFilterIds.length > 0) {
    params.set('itemTags', filters.tagFilterIds.join(','));
  }
  if (page > 1) params.set('itemPage', String(page));

  return params;
}

export function parseItemsCatalogFilters(searchParams: URLSearchParams): ItemsCatalogFilters {
  const tagRaw = searchParams.get('itemTags');
  const tagFilterIds =
    tagRaw
      ?.split(',')
      .map((value) => Number(value.trim()))
      .filter((id) => Number.isFinite(id) && id > 0) ?? [];

  return {
    searchQuery: searchParams.get('itemSearch') ?? '',
    unitFilter: searchParams.get('itemUnit') ?? '',
    tagFilterIds,
  };
}

export { PAGE_SIZE as ITEMS_CATALOG_PAGE_SIZE };
