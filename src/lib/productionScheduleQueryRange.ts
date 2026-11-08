const MS_DAY = 86_400_000;

/** Schedule fetch window: anchor around planned start but always include now (live machine work). */
export function productionScheduleQueryRange(plannedStart: Date): { start: string; end: string } {
  // Bucket now to UTC day so RTK schedule query args stay stable across re-renders.
  const nowMs = Date.now();
  const nowDayUtc = Date.UTC(
    new Date(nowMs).getUTCFullYear(),
    new Date(nowMs).getUTCMonth(),
    new Date(nowMs).getUTCDate(),
  );
  const anchor = plannedStart.getTime();
  const rangeStart = new Date(Math.min(anchor - 7 * MS_DAY, nowDayUtc - 30 * MS_DAY));
  const rangeEnd = new Date(Math.max(anchor + 14 * MS_DAY, nowDayUtc + MS_DAY));
  return { start: rangeStart.toISOString(), end: rangeEnd.toISOString() };
}
