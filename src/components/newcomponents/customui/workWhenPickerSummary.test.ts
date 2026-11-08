import { describe, expect, it } from 'vitest';

import {
  formatWorkWhenDisplayLines,
  formatWorkWhenSummary,
} from './workWhenPickerSummary';

const TZ = 'Asia/Dhaka';

describe('formatWorkWhenSummary', () => {
  const dateOnly = '2026-11-02';
  const timed = '2026-11-02T06:30';

  it('shows date with weekday for whole day', () => {
    expect(formatWorkWhenSummary(dateOnly, '', false, TZ)).toBe('02.11.2026 (Mon)');
  });

  it('shows rest of day with bracket when timed with no minutes', () => {
    const summary = formatWorkWhenSummary(timed, '', false, TZ);
    expect(summary).toContain('02.11.2026 (Mon)');
    expect(summary).toContain('6:30 AM (rest of day)');
  });

  it('shows a time range and duration bracket for presets', () => {
    expect(formatWorkWhenSummary(timed, '30', false, TZ)).toBe(
      '02.11.2026 (Mon) · 6:30–7:00 AM (30 min)',
    );
    expect(formatWorkWhenSummary(timed, '60', false, TZ)).toContain('(1h)');
    expect(formatWorkWhenSummary(timed, '120', false, TZ)).toContain('(2h)');
  });

  it('shows custom duration as a range with bracket', () => {
    expect(formatWorkWhenSummary(timed, '90', false, TZ)).toContain('(90 min)');
  });
});

describe('formatWorkWhenDisplayLines', () => {
  it('splits date and time on separate lines', () => {
    const lines = formatWorkWhenDisplayLines('2026-12-02T15:00', '60', false, TZ);
    expect(lines?.dateLine).toBe('02.12.2026 (Wed)');
    expect(lines?.timeLine).toBe('3:00–4:00 PM (1h)');
  });

  it('uses All-day second line when no clock is set', () => {
    const lines = formatWorkWhenDisplayLines('2026-12-02', '', false, TZ);
    expect(lines?.dateLine).toBe('02.12.2026 (Wed)');
    expect(lines?.timeLine).toBeNull();
  });
});
