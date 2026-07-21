export interface MachinesLocationFilterSlice {
  factory_ids: number[];
  section_ids: number[];
}

export function effectiveFactoryIds(slice: MachinesLocationFilterSlice, allFactoryIds: number[]): number[] {
  return slice.factory_ids.length === 0 ? allFactoryIds : slice.factory_ids;
}

export function visibleSectionsForSlice<T extends { id: number; factory_id: number }>(
  slice: MachinesLocationFilterSlice,
  allFactoryIds: number[],
  sections: T[]
): T[] {
  const fids = new Set(effectiveFactoryIds(slice, allFactoryIds));
  return sections.filter((s) => fids.has(s.factory_id));
}

function pruneSectionsAfterFactoryChange(
  slice: MachinesLocationFilterSlice,
  nextFactoryIds: number[],
  allF: number[],
  sections: Array<{ id: number; factory_id: number }>
): MachinesLocationFilterSlice {
  const allowedF = new Set(nextFactoryIds.length === 0 ? allF : nextFactoryIds);
  const vids = sections.filter((s) => allowedF.has(s.factory_id)).map((s) => s.id);
  const vset = new Set(vids);

  let nextSectionIds: number[];
  if (slice.section_ids.length === 0) {
    nextSectionIds = [];
  } else {
    const pruned = slice.section_ids.filter((sid) => vset.has(sid));
    const isFull =
      pruned.length > 0 &&
      pruned.length === vids.length &&
      vids.length > 0 &&
      vids.every((v) => pruned.includes(v));
    nextSectionIds = isFull ? [] : pruned;
  }

  return { factory_ids: nextFactoryIds, section_ids: nextSectionIds };
}

/** Explicit “all factories” choice (empty list = no factory filter). */
export function selectAllFactories(
  slice: MachinesLocationFilterSlice,
  allFactoryIds: number[],
  sections: Array<{ id: number; factory_id: number }>
): MachinesLocationFilterSlice {
  return pruneSectionsAfterFactoryChange(slice, [], allFactoryIds, sections);
}

/** Explicit “all sections” choice (empty list = no section filter). */
export function selectAllSections(slice: MachinesLocationFilterSlice): MachinesLocationFilterSlice {
  return { ...slice, section_ids: [] };
}

/** Select exactly one factory (single-select toolbar pages). */
export function selectSingleFactory(
  slice: MachinesLocationFilterSlice,
  id: number,
  allFactoryIds: number[],
  sections: Array<{ id: number; factory_id: number }>,
): MachinesLocationFilterSlice {
  return pruneSectionsAfterFactoryChange(slice, [id], allFactoryIds, sections);
}

/** Select exactly one section (single-select toolbar pages). */
export function selectSingleSection(
  slice: MachinesLocationFilterSlice,
  id: number,
): MachinesLocationFilterSlice {
  return { ...slice, section_ids: [id] };
}

export function computeToggleFactory(
  slice: MachinesLocationFilterSlice,
  id: number,
  allFactoryIds: number[],
  sections: Array<{ id: number; factory_id: number }>
): MachinesLocationFilterSlice {
  const allF = allFactoryIds;
  if (slice.factory_ids.length === 0) {
    return pruneSectionsAfterFactoryChange(slice, [id], allF, sections);
  }
  const effF = slice.factory_ids;
  const selected = effF.includes(id);
  let nextFactoryIds: number[];
  if (selected) {
    const removed = effF.filter((x) => x !== id);
    nextFactoryIds = removed.length === 0 ? [] : removed;
  } else {
    const added = [...effF, id].sort((a, b) => a - b);
    nextFactoryIds = added.length === allF.length ? [] : added;
  }
  return pruneSectionsAfterFactoryChange(slice, nextFactoryIds, allF, sections);
}

export function computeToggleSection(
  slice: MachinesLocationFilterSlice,
  id: number,
  allFactoryIds: number[],
  sections: Array<{ id: number; factory_id: number }>
): Pick<MachinesLocationFilterSlice, 'section_ids'> {
  const effF = slice.factory_ids.length === 0 ? allFactoryIds : slice.factory_ids;
  const fset = new Set(effF);
  const allS = sections.filter((s) => fset.has(s.factory_id)).map((s) => s.id);

  if (slice.section_ids.length === 0) {
    return { section_ids: [id] };
  }
  const effS = slice.section_ids.filter((x) => allS.includes(x));
  const selected = effS.includes(id);
  let next: number[];
  if (selected) {
    const removed = effS.filter((x) => x !== id);
    next = removed.length === 0 ? [] : removed;
  } else {
    const added = [...effS, id].sort((a, b) => a - b);
    next = added.length === allS.length && allS.length > 0 ? [] : added;
  }
  return { section_ids: next };
}

export function isFactoryRowChecked(slice: MachinesLocationFilterSlice, id: number): boolean {
  return slice.factory_ids.length > 0 && slice.factory_ids.includes(id);
}

export function isSectionRowChecked(slice: MachinesLocationFilterSlice, id: number): boolean {
  return slice.section_ids.length > 0 && slice.section_ids.includes(id);
}

export function locationFilterLabels(
  slice: MachinesLocationFilterSlice,
  allFactoryIds: number[],
  visibleSections: Array<{ id: number; name: string }>,
  factories: Array<{ id: number; name: string; abbreviation: string }>,
  allSections: Array<{ id: number; name: string }>
) {
  const effectiveFactorySelection = effectiveFactoryIds(slice, allFactoryIds);
  const factoryCount = effectiveFactorySelection.length;
  let factoryDropdownLabel: string;
  if (slice.factory_ids.length === 0) {
    if (factoryCount === 1) {
      const onlyFactory = factories.find((x) => x.id === effectiveFactorySelection[0]);
      factoryDropdownLabel = onlyFactory?.name ?? '1 factory';
    } else {
      factoryDropdownLabel = `All factories (${factoryCount})`;
    }
  } else if (slice.factory_ids.length === 1) {
    const f = factories.find((x) => x.id === slice.factory_ids[0]);
    factoryDropdownLabel = f?.name ?? '1 factory';
  } else {
    factoryDropdownLabel = `${slice.factory_ids.length} of ${allFactoryIds.length} factories`;
  }

  const visibleCount = visibleSections.length;
  let sectionDropdownLabel: string;
  if (slice.section_ids.length === 0) {
    if (visibleCount === 1) {
      sectionDropdownLabel = visibleSections[0]?.name ?? '1 section';
    } else {
      sectionDropdownLabel = `All sections (${visibleCount})`;
    }
  } else if (slice.section_ids.length === 1) {
    const sid = slice.section_ids[0];
    const s =
      visibleSections.find((x) => x.id === sid) ?? allSections.find((x) => x.id === sid);
    sectionDropdownLabel = s?.name ?? '1 section';
  } else {
    sectionDropdownLabel = `${slice.section_ids.length} of ${visibleCount} sections`;
  }

  return { factoryDropdownLabel, sectionDropdownLabel };
}
