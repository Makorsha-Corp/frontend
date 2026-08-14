import { describe, expect, it } from 'vitest';

import {
  formatAbsoluteFromApi,
  formatTimeFromApi,
  parseApiDateTime,
} from './datetime';

describe('parseApiDateTime', () => {
  it('treats naive API datetime as UTC', () => {
    const date = parseApiDateTime('2026-08-10T23:54:00');
    expect(date?.toISOString()).toBe('2026-08-10T23:54:00.000Z');
  });

  it('keeps Z suffix datetimes', () => {
    const date = parseApiDateTime('2026-08-10T23:54:00Z');
    expect(date?.toISOString()).toBe('2026-08-10T23:54:00.000Z');
  });
});

describe('timezone formatting', () => {
  const instant = '2026-08-10T23:54:00Z';

  it('formats absolute time in Asia/Dhaka', () => {
    expect(formatAbsoluteFromApi(instant, 'Asia/Dhaka')).toContain('5:54');
  });

  it('formats absolute time in America/New_York', () => {
    expect(formatAbsoluteFromApi(instant, 'America/New_York')).toContain('7:54');
  });

  it('formats clock time in user zone', () => {
    expect(formatTimeFromApi(instant, 'Asia/Dhaka')).toMatch(/5:54/);
  });
});
