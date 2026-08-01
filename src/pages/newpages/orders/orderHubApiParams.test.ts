import { describe, expect, it } from 'vitest';
import { API_LIMITS } from '@/constants/apiLimits';
import { orderHubPageCount, resolveClampedPage } from './orderHubApiParams';

const PAGE_SIZE = API_LIMITS.ORDER_HUB_PAGE_SIZE;

describe('resolveClampedPage', () => {
  it('returns null when total is undefined (data not loaded yet)', () => {
    expect(resolveClampedPage(3, undefined, PAGE_SIZE)).toBeNull();
  });

  it('returns null when page is within range', () => {
    expect(resolveClampedPage(1, 0, PAGE_SIZE)).toBeNull();
    expect(resolveClampedPage(1, 50, PAGE_SIZE)).toBeNull();
    expect(resolveClampedPage(2, 51, PAGE_SIZE)).toBeNull();
  });

  it('clamps when page exceeds max for zero total', () => {
    expect(resolveClampedPage(5, 0, PAGE_SIZE)).toBe(1);
  });

  it('clamps when page exceeds max for exact multiples of page size', () => {
    expect(orderHubPageCount(100, PAGE_SIZE)).toBe(2);
    expect(resolveClampedPage(3, 100, PAGE_SIZE)).toBe(2);
  });

  it('clamps when page exceeds max for partial last page', () => {
    expect(resolveClampedPage(4, 101, PAGE_SIZE)).toBe(3);
  });
});
