import { describe, expect, it } from 'vitest';
import { catalogTagCodesForProductionRole, ITEM_CATALOG_TAG_CODES } from './productionItemCatalogTags';

describe('catalogTagCodesForProductionRole', () => {
  it('maps BOM roles to system tag codes', () => {
    expect(catalogTagCodesForProductionRole('waste')).toEqual([ITEM_CATALOG_TAG_CODES.waste]);
    expect(catalogTagCodesForProductionRole('byproduct')).toEqual([ITEM_CATALOG_TAG_CODES.byproduct]);
    expect(catalogTagCodesForProductionRole('input')).toEqual([ITEM_CATALOG_TAG_CODES.rawMaterial]);
    expect(catalogTagCodesForProductionRole('output')).toEqual([ITEM_CATALOG_TAG_CODES.finishedGood]);
  });
});
