import { describe, expect, it } from 'vitest';
import {
  fitChipCount,
  iterateMonthCellRowFit,
  overflowProbeCount,
  planMonthCellRowFit,
} from './monthCellChipFit';

describe('monthCellChipFit', () => {
  it('fits zero chips when the row is too narrow', () => {
    expect(fitChipCount([80], 20, 4, 0)).toBe(0);
  });

  it('keeps event chips when +N is smaller and both fit', () => {
    const plan = planMonthCellRowFit(
      [{ chipWidths: [70, 70], availableWidth: 180 }],
      3,
      24,
      4,
    );

    expect(plan.visiblePerRow[0]).toBe(2);
    expect(plan.overflowCount).toBe(1);
  });

  it('reserves only the measured +N width on the final row', () => {
    const plan = planMonthCellRowFit(
      [{ chipWidths: [60, 60, 60, 60], availableWidth: 200 }],
      4,
      24,
      4,
    );

    expect(plan.visiblePerRow[0]).toBe(2);
    expect(plan.overflowCount).toBe(2);
  });

  it('picks a probe count with the same digit width as the real +N label', () => {
    expect(overflowProbeCount(2)).toBe(9);
    expect(overflowProbeCount(12)).toBe(99);
  });

  it('iterates until overflow width matches the displayed +N count', () => {
    const widths = new Map<number, number>([
      [1, 40],
      [9, 24],
      [99, 32],
    ]);

    const plan = iterateMonthCellRowFit(
      [{ chipWidths: [70, 70, 70], availableWidth: 180 }],
      3,
      (count) => widths.get(overflowProbeCount(count)) ?? 24,
      4,
    );

    expect(plan.visiblePerRow[0]).toBe(2);
    expect(plan.overflowCount).toBe(1);
  });
});
