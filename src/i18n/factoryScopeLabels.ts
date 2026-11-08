import type { TFunction } from 'i18next';
import {
  effectiveFactoryIds,
  type MachinesLocationFilterSlice,
} from '@/lib/machinesLocationFilters';

export function localizedToolbarFactoryDropdownLabel(
  slice: MachinesLocationFilterSlice,
  allFactoryIds: number[],
  factories: Array<{ id: number; name: string; abbreviation: string }>,
  t: TFunction,
): string {
  if (slice.factory_ids.length === 0) {
    const factoryCount = effectiveFactoryIds(slice, allFactoryIds).length;
    if (factoryCount === 0) return t('scopeAllFactories', { ns: 'factories' });
    if (factoryCount === 1) return t('scopeAllFactoriesOne', { ns: 'factories' });
    return t('scopeAllFactoriesCount', { ns: 'factories', count: factoryCount });
  }
  if (slice.factory_ids.length === 1) {
    const f = factories.find((x) => x.id === slice.factory_ids[0]);
    const abbr = f?.abbreviation?.trim();
    return abbr || f?.name || t('scopeOneFactory', { ns: 'factories' });
  }
  return t('scopeFactoriesCount', { ns: 'factories', count: slice.factory_ids.length });
}

export function localizedCompactFactoryDropdownLabel(
  slice: MachinesLocationFilterSlice,
  factories: Array<{ id: number; name: string; abbreviation: string }>,
  t: TFunction,
): string {
  if (slice.factory_ids.length === 0) {
    return t('scopeFactoriesShort', { ns: 'factories' });
  }
  if (slice.factory_ids.length === 1) {
    const f = factories.find((x) => x.id === slice.factory_ids[0]);
    return f?.abbreviation ?? f?.name ?? '1';
  }
  return String(slice.factory_ids.length);
}

export function localizedToolbarSectionDropdownLabel(
  slice: MachinesLocationFilterSlice,
  visibleSectionCount: number,
  visibleSections: Array<{ id: number; name: string }>,
  allSections: Array<{ id: number; name: string }>,
  t: TFunction,
): string {
  if (slice.section_ids.length === 0) {
    if (visibleSectionCount === 0) return t('allSections', { ns: 'factories' });
    if (visibleSectionCount === 1) return t('scopeAllSectionsOne', { ns: 'factories' });
    return t('scopeAllSectionsCount', { ns: 'factories', count: visibleSectionCount });
  }
  if (slice.section_ids.length === 1) {
    const sid = slice.section_ids[0];
    const s =
      visibleSections.find((x) => x.id === sid) ?? allSections.find((x) => x.id === sid);
    return s?.name ?? t('scopeOneSection', { ns: 'factories' });
  }
  return t('scopeSectionsOf', {
    ns: 'factories',
    selected: slice.section_ids.length,
    total: visibleSectionCount,
  });
}

export function localizedSectionDropdownLabelForAria(
  slice: MachinesLocationFilterSlice,
  visibleSectionCount: number,
  visibleSections: Array<{ id: number; name: string }>,
  allSections: Array<{ id: number; name: string }>,
  t: TFunction,
): string {
  if (slice.section_ids.length === 0) {
    if (visibleSectionCount === 0) return t('allSections', { ns: 'factories' });
    if (visibleSectionCount === 1) return t('scopeAllSectionsOne', { ns: 'factories' });
    return t('scopeAllSectionsCount', { ns: 'factories', count: visibleSectionCount });
  }
  if (slice.section_ids.length === 1) {
    const sid = slice.section_ids[0];
    const s =
      visibleSections.find((x) => x.id === sid) ?? allSections.find((x) => x.id === sid);
    return s?.name ?? t('scopeOneSection', { ns: 'factories' });
  }
  return t('scopeSectionsOf', {
    ns: 'factories',
    selected: slice.section_ids.length,
    total: visibleSectionCount,
  });
}

export function localizedFactoryDropdownLabelForAria(
  slice: MachinesLocationFilterSlice,
  allFactoryIds: number[],
  factories: Array<{ id: number; name: string }>,
  t: TFunction,
): string {
  const effectiveFactorySelection = effectiveFactoryIds(slice, allFactoryIds);
  const factoryCount = effectiveFactorySelection.length;
  if (slice.factory_ids.length === 0) {
    if (factoryCount === 0) return t('scopeAllFactories', { ns: 'factories' });
    if (factoryCount === 1) return t('scopeAllFactoriesOne', { ns: 'factories' });
    return t('scopeAllFactoriesCount', { ns: 'factories', count: factoryCount });
  }
  if (slice.factory_ids.length === 1) {
    const f = factories.find((x) => x.id === slice.factory_ids[0]);
    return f?.name ?? t('scopeOneFactory', { ns: 'factories' });
  }
  return t('scopeFactoriesOf', {
    ns: 'factories',
    selected: slice.factory_ids.length,
    total: allFactoryIds.length,
  });
}
