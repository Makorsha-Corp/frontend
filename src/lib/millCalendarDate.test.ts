import { describe, expect, it } from 'vitest';

import {
  batchCardDate,
  millBatchDate,
  millCalendarDate,
  resolveMillTimezone,
} from './millCalendarDate';

describe('resolveMillTimezone', () => {
  it('uses the workspace zone', () => {
    expect(resolveMillTimezone('America/New_York')).toBe('America/New_York');
  });

  it('trims the workspace zone', () => {
    expect(resolveMillTimezone('  Asia/Dhaka  ')).toBe('Asia/Dhaka');
  });

  it('defaults to Bangladesh when the workspace zone is missing or invalid', () => {
    expect(resolveMillTimezone(null)).toBe('Asia/Dhaka');
    expect(resolveMillTimezone('')).toBe('Asia/Dhaka');
    expect(resolveMillTimezone('Not/AZone')).toBe('Asia/Dhaka');
  });
});

describe('millCalendarDate', () => {
  it('uses the mill calendar day, not the UTC day', () => {
    const instant = new Date('2026-10-09T22:03:00Z');
    expect(millCalendarDate(instant, 'Asia/Dhaka')).toBe('2026-10-10');
    expect(millCalendarDate(instant, 'UTC')).toBe('2026-10-09');
  });
});

describe('millBatchDate', () => {
  it('stamps an unplanned run as today in the mill zone', () => {
    const now = new Date('2026-10-09T22:03:00Z');
    expect(millBatchDate({ plannedLocal: '', timeZone: 'Asia/Dhaka', now })).toBe('2026-10-10');
  });

  it('stamps a planned start as that instant’s mill day', () => {
    const plannedLocal = '2026-10-10T02:00';
    const instant = new Date(plannedLocal);
    expect(millBatchDate({ plannedLocal, timeZone: 'America/New_York' })).toBe(
      millCalendarDate(instant, 'America/New_York'),
    );
  });
});

describe('batchCardDate', () => {
  it('keeps a date-only value on local midnight of that civil day', () => {
    expect(batchCardDate('2026-10-10').getTime()).toBe(new Date(2026, 9, 10).getTime());
  });
});
