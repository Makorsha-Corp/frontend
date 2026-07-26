import { describe, expect, it } from 'vitest';

import {
  globalFactoryToPageFilter,
  pageFactoryFilterToId,
  parsePageFactoryFilterParam,
  resolveEffectivePageFactoryFilter,
} from './usePageFactoryScope';

describe('globalFactoryToPageFilter', () => {
  it('maps global factory id to string filter', () => {
    expect(globalFactoryToPageFilter(2)).toBe('2');
  });

  it('returns all when no global factory', () => {
    expect(globalFactoryToPageFilter(null)).toBe('all');
    expect(globalFactoryToPageFilter(undefined)).toBe('all');
  });
});

describe('resolveEffectivePageFactoryFilter', () => {
  it('uses global on mount when no override', () => {
    expect(resolveEffectivePageFactoryFilter(1, null)).toBe('1');
  });

  it('uses page override when set', () => {
    expect(resolveEffectivePageFactoryFilter(1, '3')).toBe('3');
  });

  it('allows all override while global is set', () => {
    expect(resolveEffectivePageFactoryFilter(1, 'all')).toBe('all');
  });

  it('defaults to all without global or override', () => {
    expect(resolveEffectivePageFactoryFilter(null, null)).toBe('all');
  });
});

describe('pageFactoryFilterToId', () => {
  it('converts numeric filter to id', () => {
    expect(pageFactoryFilterToId('4')).toBe(4);
  });

  it('returns null for all', () => {
    expect(pageFactoryFilterToId('all')).toBeNull();
  });
});

describe('parsePageFactoryFilterParam', () => {
  it('parses all', () => {
    expect(parsePageFactoryFilterParam('all')).toBe('all');
  });

  it('parses numeric id', () => {
    expect(parsePageFactoryFilterParam('7')).toBe('7');
  });

  it('returns undefined when absent', () => {
    expect(parsePageFactoryFilterParam(null)).toBeUndefined();
  });
});
