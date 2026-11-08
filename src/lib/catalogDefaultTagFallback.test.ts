import { describe, expect, it } from 'vitest';

import { shouldDropDefaultCatalogTags } from './catalogDefaultTagFallback';

const base = {
  loading: false,
  itemCount: 0,
  search: '',
  userTouchedTags: false,
  defaultTagIds: [4],
  activeTagIds: [4],
  alreadyDropped: false,
};

describe('shouldDropDefaultCatalogTags', () => {
  it('drops the default tags when the first load is empty', () => {
    expect(shouldDropDefaultCatalogTags(base)).toBe(true);
  });

  it('waits while the catalog is loading', () => {
    expect(shouldDropDefaultCatalogTags({ ...base, loading: true })).toBe(false);
  });

  it('keeps tags the user changed', () => {
    expect(shouldDropDefaultCatalogTags({ ...base, userTouchedTags: true })).toBe(false);
    expect(shouldDropDefaultCatalogTags({ ...base, activeTagIds: [] })).toBe(false);
  });

  it('does not drop when a search made the list empty', () => {
    expect(shouldDropDefaultCatalogTags({ ...base, search: 'yarn' })).toBe(false);
  });

  it('does not drop when items matched', () => {
    expect(shouldDropDefaultCatalogTags({ ...base, itemCount: 3 })).toBe(false);
  });

  it('drops only once', () => {
    expect(shouldDropDefaultCatalogTags({ ...base, alreadyDropped: true })).toBe(false);
  });
});
