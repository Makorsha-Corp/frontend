import { describe, expect, it } from 'vitest';

import { zonedWallTimeToUtc } from '@/pages/newpages/orders/workOrderWindow';

import { formatWorkOrderCardWhen } from './workOrderCardWhen';

const TZ = 'Asia/Dhaka';

function isoAt(hour: number, minute: number): string {
  return zonedWallTimeToUtc(2026, 11, 2, hour, minute, TZ).toISOString();
}

function isoNextMidnight(): string {
  return zonedWallTimeToUtc(2026, 11, 3, 0, 0, TZ).toISOString();
}

describe('formatWorkOrderCardWhen', () => {
  it('shows whole day when there is no start', () => {
    expect(formatWorkOrderCardWhen(null, null, TZ, false)).toBe('Whole day');
  });

  it('shows rest of day when end is local midnight', () => {
    const summary = formatWorkOrderCardWhen(isoAt(6, 30), isoNextMidnight(), TZ, false);
    expect(summary).toContain('6:30 AM');
    expect(summary).toContain('rest of day');
  });

  it('shows a compact same-period range', () => {
    const summary = formatWorkOrderCardWhen(isoAt(6, 30), isoAt(8, 30), TZ, false);
    expect(summary).toBe('6:30–8:30 AM');
  });
});
