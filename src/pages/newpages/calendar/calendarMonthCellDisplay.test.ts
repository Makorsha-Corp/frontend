import { describe, expect, it } from 'vitest';
import type { CalendarCategory, CalendarEvent } from '@/types/calendar';
import {
  allocateChipSlotsTwoCategories,
  planMonthCellDisplay,
} from './calendarMonthCellDisplay';
import { fitChipCount, planMonthCellRowFit } from './monthCellChipFit';

function mockEvent(category: CalendarCategory, id: number, title?: string): CalendarEvent {
  return {
    id: `${category}-${id}`,
    category,
    source_type: 'test',
    record_id: id,
    date: '2026-07-01',
    date_label: 'Jul 1',
    title: title ?? `${category} ${id}`,
    link: '/',
    meta: {},
  };
}

describe('allocateChipSlotsTwoCategories', () => {
  it('gives all slots to one category when the other is empty', () => {
    expect(allocateChipSlotsTwoCategories(5, 7, 0)).toEqual([5, 0]);
  });

  it('splits with minimum one per category when budget allows', () => {
    expect(allocateChipSlotsTwoCategories(5, 3, 5)).toEqual([2, 3]);
  });
});

describe('fitChipCount', () => {
  it('counts chips that fit with gaps and reserved overflow width', () => {
    expect(fitChipCount([40, 40, 40], 100, 4, 0)).toBe(2);
    expect(fitChipCount([40, 40, 40], 100, 4, 30)).toBe(1);
  });
});

describe('planMonthCellRowFit', () => {
  it('appends +N on the last row without dropping a chip when both fit', () => {
    const plan = planMonthCellRowFit(
      [
        { chipWidths: [80, 80], availableWidth: 180 },
        { chipWidths: [70, 70, 70], availableWidth: 180 },
      ],
      5,
      24,
      4,
    );

    expect(plan.visiblePerRow[0]).toBe(2);
    expect(plan.visiblePerRow[1]).toBe(2);
    expect(plan.overflowCount).toBe(1);
  });

  it('shows more invoice chips when the row is wider', () => {
    const narrow = planMonthCellRowFit(
      [{ chipWidths: [80, 80, 80], availableWidth: 170 }],
      3,
      28,
      4,
    );
    const wide = planMonthCellRowFit(
      [{ chipWidths: [80, 80, 80], availableWidth: 260 }],
      3,
      28,
      4,
    );

    expect(narrow.visiblePerRow[0]).toBeLessThan(wide.visiblePerRow[0]);
  });
});

describe('planMonthCellDisplay', () => {
  it('returns the first two category groups without hard caps', () => {
    const events = [
      ...Array.from({ length: 4 }, (_, i) => mockEvent('purchase', i)),
      ...Array.from({ length: 3 }, (_, i) => mockEvent('invoices', i)),
    ];
    const plan = planMonthCellDisplay(events);
    expect(plan.totalEventCount).toBe(7);
    expect(plan.groups).toHaveLength(2);
    expect(plan.groups[0].events).toHaveLength(4);
    expect(plan.groups[1].events).toHaveLength(3);
  });

  it('ignores category three and beyond in body rows', () => {
    const events = [
      mockEvent('work_orders', 1),
      mockEvent('purchase', 1),
      ...Array.from({ length: 4 }, (_, i) => mockEvent('expense', i)),
    ];
    const plan = planMonthCellDisplay(events);
    expect(plan.groups).toHaveLength(2);
    expect(plan.totalEventCount).toBe(6);
  });
});
