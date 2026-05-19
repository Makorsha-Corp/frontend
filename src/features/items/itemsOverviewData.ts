import type { Item } from '@/types/item';

export interface ItemFilters {
  searchQuery: string;
  unitFilter: string;
  tagFilter: string;
}

export function filterItems(items: Item[], filters: ItemFilters): Item[] {
  let rows = items.filter((i) => i.is_active !== false);

  if (filters.unitFilter) {
    rows = rows.filter((i) => i.unit === filters.unitFilter);
  }

  if (filters.tagFilter) {
    const tagId = Number(filters.tagFilter);
    rows = rows.filter((i) => i.tags?.some((t) => t.id === tagId));
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    rows = rows.filter((i) => {
      const tagNames = i.tags?.map((t) => t.name.toLowerCase()).join(' ') ?? '';
      return (
        i.name.toLowerCase().includes(q) ||
        (i.description?.toLowerCase().includes(q) ?? false) ||
        i.unit.toLowerCase().includes(q) ||
        String(i.id).includes(q) ||
        tagNames.includes(q)
      );
    });
  }

  return rows;
}

export function uniqueUnitsFromItems(items: Item[]): string[] {
  const units = new Set(items.map((i) => i.unit));
  return Array.from(units).sort();
}
