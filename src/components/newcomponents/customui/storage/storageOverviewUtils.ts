import type { Inventory, InventoryStatsResponse } from '@/types/inventory';
import type { StorageCatalogFilters } from '@/features/inventory/storageCatalogParams';
import { INVENTORY_TYPES, type StorageOverviewStats } from './storageConstants';

export function filterInventoryForStorageCatalog(
  items: Inventory[],
  filters: StorageCatalogFilters,
): Inventory[] {
  const search = filters.searchQuery.trim().toLowerCase();
  return items.filter((inv) => {
    if (filters.factoryId != null && inv.factory_id !== filters.factoryId) return false;
    if (filters.inventoryTypeFilter !== 'all' && inv.inventory_type !== filters.inventoryTypeFilter) {
      return false;
    }
    if (filters.itemId != null && inv.item_id !== filters.itemId) return false;
    if (!filters.includeZeroQty && (inv.qty ?? 0) <= 0) return false;
    if (search) {
      const name = (inv.item_name ?? '').toLowerCase();
      const unit = (inv.item_unit ?? '').toLowerCase();
      if (!name.includes(search) && !unit.includes(search)) return false;
    }
    return true;
  });
}

export function computeStorageOverviewFromInventory(items: Inventory[]): StorageOverviewStats {
  const typeLabelByValue = Object.fromEntries(INVENTORY_TYPES.map((t) => [t.value, t.label]));
  const byTypeValue = new Map<
    string,
    { uniqueItemIds: Set<number>; totalQty: number }
  >();

  for (const t of INVENTORY_TYPES) {
    byTypeValue.set(t.value, { uniqueItemIds: new Set(), totalQty: 0 });
  }

  let totalQty = 0;
  let estimatedValue = 0;

  for (const inv of items) {
    totalQty += inv.qty ?? 0;
    if (inv.avg_price != null) {
      estimatedValue += (inv.qty ?? 0) * Number(inv.avg_price);
    }
    const bucket = byTypeValue.get(inv.inventory_type);
    if (bucket) {
      bucket.uniqueItemIds.add(inv.item_id);
      bucket.totalQty += inv.qty ?? 0;
    }
  }

  return {
    records: items.length,
    totalQty,
    estimatedValue,
    byType: INVENTORY_TYPES.map((t) => {
      const bucket = byTypeValue.get(t.value);
      return {
        type: typeLabelByValue[t.value] ?? t.label,
        uniqueCount: bucket?.uniqueItemIds.size ?? 0,
        totalQty: bucket?.totalQty ?? 0,
      };
    }),
  };
}

export function storageOverviewFromStatsResponse(
  stats: InventoryStatsResponse,
): StorageOverviewStats {
  const typeLabelByValue = Object.fromEntries(INVENTORY_TYPES.map((t) => [t.value, t.label]));
  return {
    records: stats.records,
    totalQty: stats.total_qty,
    estimatedValue: Number(stats.estimated_value),
    byType: INVENTORY_TYPES.map((t) => {
      const row = stats.by_type.find((b) => b.inventory_type === t.value);
      return {
        type: typeLabelByValue[t.value] ?? t.label,
        uniqueCount: row?.unique_item_count ?? 0,
        totalQty: row?.total_qty ?? 0,
      };
    }),
  };
}

export const emptyStorageOverview = (): StorageOverviewStats => ({
  records: 0,
  totalQty: 0,
  estimatedValue: 0,
  byType: INVENTORY_TYPES.map((t) => ({
    type: t.label,
    uniqueCount: 0,
    totalQty: 0,
  })),
});
