import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';

/** Map nullable single-factory page state → location filter slice (factory-only pages). */
export function singleFactoryToSlice(
  factoryId: number | null | undefined,
): MachinesLocationFilterSlice {
  return {
    factory_ids:
      factoryId != null && Number.isFinite(factoryId) ? [factoryId] : [],
    section_ids: [],
  };
}

/** Map location slice → single factory id (`null` = all factories). */
export function sliceToSingleFactoryId(
  slice: Pick<MachinesLocationFilterSlice, 'factory_ids'>,
): number | null {
  if (slice.factory_ids.length === 0) return null;
  return slice.factory_ids[0] ?? null;
}

/** Map `'all' | factory id string` filter → location slice. */
export function factoryFilterToSlice(factoryFilter: string): MachinesLocationFilterSlice {
  if (factoryFilter === 'all') {
    return { factory_ids: [], section_ids: [] };
  }
  const id = Number(factoryFilter);
  return {
    factory_ids: Number.isFinite(id) ? [id] : [],
    section_ids: [],
  };
}

/** Map location slice → `'all' | factory id string` filter. */
export function sliceToFactoryFilter(
  slice: Pick<MachinesLocationFilterSlice, 'factory_ids'>,
): string {
  if (slice.factory_ids.length === 0) return 'all';
  return String(slice.factory_ids[0]);
}
