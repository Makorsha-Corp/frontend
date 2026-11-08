import { describe, expect, it } from 'vitest';

import { formatDateRangeFilterLabel } from '@/components/newcomponents/customui/DateRangeFilterTrigger';

describe('formatDateRangeFilterLabel', () => {
  it('shows empty label when no from date', () => {
    expect(formatDateRangeFilterLabel({})).toBe('All dates');
    expect(formatDateRangeFilterLabel({}, 'Any time')).toBe('Any time');
  });

  it('formats single day and range', () => {
    const from = new Date(2026, 0, 5);
    const to = new Date(2026, 0, 20);
    expect(formatDateRangeFilterLabel({ from })).toBe('Jan 5');
    expect(formatDateRangeFilterLabel({ from, to })).toBe('Jan 5 – Jan 20');
  });
});
