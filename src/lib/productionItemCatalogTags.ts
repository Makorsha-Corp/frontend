import type { ItemRole } from '@/types/production';

/** System item tag codes (see backend seed_default_tags). */
export const ITEM_CATALOG_TAG_CODES = {
  rawMaterial: 'raw_material',
  machinePart: 'machine_part',
  projectItem: 'project_item',
  consumable: 'consumable',
  tool: 'tool',
  finishedGood: 'finished_good',
  waste: 'waste',
  byproduct: 'byproduct',
} as const;

/** Default catalog filter when picking items for a recipe/batch BOM role. */
export function catalogTagCodesForProductionRole(role: ItemRole): string[] {
  switch (role) {
    case 'input':
      return [ITEM_CATALOG_TAG_CODES.rawMaterial];
    case 'output':
      return [ITEM_CATALOG_TAG_CODES.finishedGood];
    case 'waste':
      return [ITEM_CATALOG_TAG_CODES.waste];
    case 'byproduct':
      return [ITEM_CATALOG_TAG_CODES.byproduct];
    default:
      return [];
  }
}
