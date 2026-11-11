import { describe, expect, it } from 'vitest';

import {
  locationFilterLabels,
  normalizeLocationSlice,
  selectAllFactories,
} from './machinesLocationFilters';

const sections = [
  { id: 1, factory_id: 10, name: 'Spinning' },
  { id: 2, factory_id: 10, name: 'Weaving' },
  { id: 3, factory_id: 20, name: 'Other' },
];

describe('selectAllFactories', () => {
  it('clears factory and section ids from a scoped selection', () => {
    expect(
      selectAllFactories({ factory_ids: [10], section_ids: [1] }, [10, 20], sections),
    ).toEqual({ factory_ids: [], section_ids: [] });
  });
});

describe('normalizeLocationSlice', () => {
  it('infers factory when a section is chosen while factories are still “all”', () => {
    expect(
      normalizeLocationSlice({ factory_ids: [], section_ids: [2] }, sections),
    ).toEqual({ factory_ids: [10], section_ids: [2] });
  });

  it('stays workspace-wide after selectAllFactories (no section re-inference)', () => {
    const cleared = selectAllFactories({ factory_ids: [10], section_ids: [1] }, [10, 20], sections);
    expect(normalizeLocationSlice(cleared, sections)).toEqual({
      factory_ids: [],
      section_ids: [],
    });
  });
});

describe('locationFilterLabels', () => {
  it('labels empty factory selection as all factories even when only one exists', () => {
    const factories = [{ id: 9, name: 'Narayanganj Spinning Mill', abbreviation: 'NSM' }];
    const { factoryDropdownLabel } = locationFilterLabels(
      { factory_ids: [], section_ids: [] },
      [9],
      [],
      factories,
      [],
    );
    expect(factoryDropdownLabel).toBe('All factories (1)');
  });

  it('omits a zero count while the factory list is still empty', () => {
    const { factoryDropdownLabel } = locationFilterLabels(
      { factory_ids: [], section_ids: [] },
      [],
      [],
      [],
      [],
    );
    expect(factoryDropdownLabel).toBe('All factories');
  });

  it('labels unselected single visible section as all sections (1)', () => {
    const visible = [{ id: 1, name: 'Spinning' }];
    const { sectionDropdownLabel } = locationFilterLabels(
      { factory_ids: [10], section_ids: [] },
      [10],
      visible,
      [],
      sections,
    );
    expect(sectionDropdownLabel).toBe('All sections (1)');
  });
});
