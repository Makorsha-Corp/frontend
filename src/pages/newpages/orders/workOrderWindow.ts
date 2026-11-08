/** Mirror of backend `resolve_work_order_window`. Wall clock is workspace timezone. */

export interface WorkOrderWindowShift {
  start_time: string;
  end_time: string;
}

export interface ResolveWorkOrderWindowArgs {
  plannedDate: string | null;
  shift?: WorkOrderWindowShift | null;
  plannedStartTime: string | null;
  durationMinutes: number | null;
  timeZone: string;
}

function parseClock(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map((part) => Number(part));
  return { hour, minute };
}

function addDays(year: number, month: number, day: number, days: number): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() };
}

/** UTC instant whose wall clock in `timeZone` is the given calendar time. */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(desiredUtc));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0');
  const seenUtc = Date.UTC(read('year'), read('month') - 1, read('day'), read('hour') % 24, read('minute'));
  return new Date(desiredUtc - (seenUtc - desiredUtc));
}

export function resolveWorkOrderWindow(args: ResolveWorkOrderWindowArgs): { start: Date | null; end: Date | null } {
  const { plannedDate, plannedStartTime, durationMinutes, timeZone } = args;
  if (!plannedDate) return { start: null, end: null };
  if (durationMinutes != null && !plannedStartTime) {
    throw new Error('Duration requires a start time');
  }
  if (!plannedStartTime) return { start: null, end: null };

  const [year, month, day] = plannedDate.slice(0, 10).split('-').map(Number);
  const clock = parseClock(plannedStartTime);
  const start = zonedWallTimeToUtc(year, month, day, clock.hour, clock.minute, timeZone);
  if (durationMinutes != null) {
    return { start, end: new Date(start.getTime() + durationMinutes * 60_000) };
  }
  const next = addDays(year, month, day, 1);
  return { start, end: zonedWallTimeToUtc(next.year, next.month, next.day, 0, 0, timeZone) };
}

export function windowsIntersect(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function untimedDayBounds(plannedDate: string, timeZone: string): { start: Date; end: Date } {
  const [year, month, day] = plannedDate.slice(0, 10).split('-').map(Number);
  const start = zonedWallTimeToUtc(year, month, day, 0, 0, timeZone);
  const next = addDays(year, month, day, 1);
  return { start, end: zonedWallTimeToUtc(next.year, next.month, next.day, 0, 0, timeZone) };
}
