import { API_LIMITS } from '@/constants/apiLimits';
import type { InventoryType } from '@/types/inventory';

export const STORAGE_PAGE_PARAM = 'storagePage';
export const STORAGE_SEARCH_PARAM = 'storageSearch';

export interface StorageCatalogFilters {
  searchQuery: string;
  factoryId: number | null;
  inventoryTypeFilter: InventoryType | 'all';
  itemId: number | null;
  includeZeroQty: boolean;
}

export const STORAGE_PAGE_SIZE = API_LIMITS.STORAGE_PAGE_SIZE;

const PAGE_SIZE = STORAGE_PAGE_SIZE;

export function parseStoragePage(raw: string | null): number {
  const parsed = Number(raw ?? '1');
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function storagePageCount(total: number, pageSize: number = PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

export function parseStorageCatalogFilters(params: URLSearchParams): StorageCatalogFilters {
  const searchQuery = params.get(STORAGE_SEARCH_PARAM)?.trim() ?? '';
  const itemRaw = params.get('itemId');
  const itemId = itemRaw ? parseInt(itemRaw, 10) : null;
  const typeRaw = params.get('inventoryType');
  const inventoryTypes = new Set(['STORAGE', 'DAMAGED', 'WASTE', 'SCRAP']);
  const inventoryTypeFilter =
    typeRaw && inventoryTypes.has(typeRaw) ? (typeRaw as InventoryType) : 'all';

  return {
    searchQuery,
    factoryId: null,
    inventoryTypeFilter,
    itemId: itemId != null && Number.isFinite(itemId) ? itemId : null,
    includeZeroQty: params.get('storageEmpty') === '1',
  };
}

export interface StorageListQueryParams {
  skip: number;
  limit: number;
  factory_id?: number;
  inventory_type?: InventoryType;
  search?: string;
  item_id?: number;
  include_zero_qty?: boolean;
}

export interface StorageStatsQueryParams {
  factory_id?: number;
  inventory_type?: InventoryType;
  search?: string;
  item_id?: number;
  include_zero_qty?: boolean;
}

function applyStorageFilters(
  filters: StorageCatalogFilters,
  target: StorageListQueryParams | StorageStatsQueryParams,
) {
  if (filters.factoryId != null) target.factory_id = filters.factoryId;
  if (filters.inventoryTypeFilter !== 'all') target.inventory_type = filters.inventoryTypeFilter;
  const search = filters.searchQuery.trim();
  if (search) target.search = search;
  if (filters.itemId != null) target.item_id = filters.itemId;
  if (filters.includeZeroQty) target.include_zero_qty = true;
}

export function buildStorageListParams(
  filters: StorageCatalogFilters,
  page: number,
): StorageListQueryParams {
  const params: StorageListQueryParams = {
    skip: Math.max(0, (page - 1) * PAGE_SIZE),
    limit: PAGE_SIZE,
  };
  applyStorageFilters(filters, params);
  return params;
}

export function buildStorageStatsParams(filters: StorageCatalogFilters): StorageStatsQueryParams {
  const params: StorageStatsQueryParams = {};
  applyStorageFilters(filters, params);
  return params;
}
