import type { TFunction } from 'i18next';

const TYPE_KEY: Record<string, string> = {
  STORAGE: 'typeStorage',
  DAMAGED: 'typeDamaged',
  WASTE: 'typeWaste',
  SCRAP: 'typeScrap',
  Storage: 'typeStorage',
  Damaged: 'typeDamaged',
  Waste: 'typeWaste',
  Scrap: 'typeScrap',
};

export function translateInventoryType(labelOrValue: string, t: TFunction): string {
  const key = TYPE_KEY[labelOrValue];
  return key ? t(key) : labelOrValue;
}
