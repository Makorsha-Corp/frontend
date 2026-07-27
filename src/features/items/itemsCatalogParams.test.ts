import { describe, expect, it } from 'vitest';
import {
  buildItemsCatalogQueryParams,
  itemsPageCount,
  parseItemsCatalogPage,
} from '@/features/items/itemsCatalogParams';
import { API_LIMITS } from '@/constants/apiLimits';

describe('itemsCatalogParams', () => {
  it('parseItemsCatalogPage defaults invalid values to 1', () => {
    expect(parseItemsCatalogPage(null)).toBe(1);
    expect(parseItemsCatalogPage('0')).toBe(1);
    expect(parseItemsCatalogPage('abc')).toBe(1);
  });

  it('itemsPageCount handles empty totals', () => {
    expect(itemsPageCount(0)).toBe(1);
    expect(itemsPageCount(51)).toBe(2);
  });

  it('buildItemsCatalogQueryParams maps page to skip/limit', () => {
    const params = buildItemsCatalogQueryParams(
      { searchQuery: 'wool', unitFilter: 'lbs', tagFilterIds: [3, 7] },
      { page: 2 },
    );

    expect(params).toEqual({
      skip: API_LIMITS.ITEMS_CATALOG_PAGE_SIZE,
      limit: API_LIMITS.ITEMS_CATALOG_PAGE_SIZE,
      search: 'wool',
      unit: 'lbs',
      tag_ids: [3, 7],
    });
  });
});
