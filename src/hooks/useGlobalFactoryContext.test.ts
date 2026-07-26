import { describe, expect, it } from 'vitest';

import { resolveFactoryId, resolvePageFactoryFilterFromUrl } from './useGlobalFactoryContext';

describe('resolvePageFactoryFilterFromUrl', () => {
  it('uses explicit numeric param', () => {
    expect(resolvePageFactoryFilterFromUrl('3')).toBe('3');
  });

  it('uses explicit all', () => {
    expect(resolvePageFactoryFilterFromUrl('all')).toBe('all');
  });

  it('returns all when param absent', () => {
    expect(resolvePageFactoryFilterFromUrl(null)).toBe('all');
  });
});

describe('resolveFactoryId', () => {
  it('prefers explicit factory id', () => {
    expect(resolveFactoryId(5, 1)).toBe(5);
  });

  it('falls back to global factory id', () => {
    expect(resolveFactoryId(null, 2)).toBe(2);
  });

  it('returns undefined when neither is set', () => {
    expect(resolveFactoryId(null, null)).toBeUndefined();
  });
});
