/** How many chips fit in a row given measured widths and optional reserved +N space. */
export function fitChipCount(
  chipWidths: readonly number[],
  availableWidth: number,
  gap: number,
  reservedWidth = 0,
): number {
  const budget = availableWidth - reservedWidth;
  if (budget <= 0 || chipWidths.length === 0) return 0;

  let used = 0;
  let count = 0;
  for (const width of chipWidths) {
    const nextGap = count > 0 ? gap : 0;
    if (used + nextGap + width > budget) break;
    used += nextGap + width;
    count += 1;
  }
  return count;
}

export interface MonthCellRowFitInput {
  chipWidths: readonly number[];
  availableWidth: number;
}

export interface MonthCellRowFitPlan {
  visiblePerRow: number[];
  overflowCount: number;
}

/**
 * Given measured chip widths per category row, choose visible counts and cell +N.
 * +N renders inline on the final row when it fits; only hides event chips when needed.
 */
export function planMonthCellRowFit(
  rows: MonthCellRowFitInput[],
  totalEventCount: number,
  overflowChipWidth: number,
  gap: number,
): MonthCellRowFitPlan {
  if (rows.length === 0) {
    return { visiblePerRow: [], overflowCount: 0 };
  }

  const visiblePerRow = rows.map(({ chipWidths, availableWidth }) =>
    Math.min(fitChipCount(chipWidths, availableWidth, gap, 0), chipWidths.length),
  );

  let shown = visiblePerRow.reduce((sum, count) => sum + count, 0);
  let overflowCount = totalEventCount - shown;
  if (overflowCount <= 0) {
    return { visiblePerRow, overflowCount: 0 };
  }

  const lastIdx = rows.length - 1;
  const lastRow = rows[lastIdx];
  const overflowReserve = overflowChipWidth + gap;
  const fitWithOverflow = fitChipCount(
    lastRow.chipWidths,
    lastRow.availableWidth,
    gap,
    overflowReserve,
  );

  visiblePerRow[lastIdx] = Math.min(fitWithOverflow, lastRow.chipWidths.length);

  shown = visiblePerRow.reduce((sum, count) => sum + count, 0);
  overflowCount = totalEventCount - shown;

  return { visiblePerRow, overflowCount: Math.max(0, overflowCount) };
}

/** Converge on +N width using the actual overflow count (not total event count). */
export function iterateMonthCellRowFit(
  rows: MonthCellRowFitInput[],
  totalEventCount: number,
  overflowWidthForCount: (count: number) => number,
  gap: number,
): MonthCellRowFitPlan {
  let plan = planMonthCellRowFit(rows, totalEventCount, overflowWidthForCount(1), gap);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const probeCount = Math.max(1, plan.overflowCount);
    const next = planMonthCellRowFit(
      rows,
      totalEventCount,
      overflowWidthForCount(probeCount),
      gap,
    );

    const stable =
      next.overflowCount === plan.overflowCount &&
      next.visiblePerRow.every((count, index) => count === plan.visiblePerRow[index]);

    plan = next;
    if (stable) break;
  }

  return plan;
}

/** Smallest probe label that is at least as wide as +count (same digit length). */
export function overflowProbeCount(count: number): number {
  if (count < 10) return 9;
  if (count < 100) return 99;
  if (count < 1000) return 999;
  return 9999;
}
