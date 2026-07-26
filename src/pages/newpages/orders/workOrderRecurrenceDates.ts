import { addDays, addMonths, format, parseISO } from 'date-fns';

import { validateRecurrenceSpan } from '@/pages/newpages/orders/workOrderTemplateLabels';

/** Monday = 0, matching backend `date.weekday()`. */
function weekdayMondayZero(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null;
  try {
    const parsed = parseISO(iso.slice(0, 10));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/** Mirror backend `advance_next_generation_date`. */
export function advanceNextGenerationDate(
  fromDate: Date,
  recurrenceType: string | null | undefined,
  recurrenceDay: number | null | undefined,
): Date {
  const type = recurrenceType ?? 'weekly';

  if (type === 'daily') {
    return addDays(fromDate, 1);
  }

  if (type === 'weekly') {
    if (recurrenceDay == null) {
      return addDays(fromDate, 7);
    }
    const targetDow = recurrenceDay % 7;
    const currentDow = weekdayMondayZero(fromDate);
    let daysAhead = (targetDow - currentDow + 7) % 7;
    if (daysAhead === 0) daysAhead = 7;
    return addDays(fromDate, daysAhead);
  }

  if (type === 'monthly') {
    const day = recurrenceDay ?? fromDate.getDate();
    const clampedDay = Math.max(1, Math.min(day, 31));
    const nextMonth = addMonths(fromDate, 1);
    const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(clampedDay, lastDay));
  }

  return addDays(fromDate, 1);
}

/** All draft planned dates from start through end (inclusive). */
export function listPlannedRecurrenceDates(
  startIso: string,
  endIso: string,
  recurrenceType: string | null | undefined,
): string[] {
  if (!startIso || !endIso) return [];
  if (validateRecurrenceSpan(startIso, endIso)) return [];

  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end || end < start) return [];

  const recurrenceDay = recurrenceType === 'monthly' ? start.getDate() : null;
  const dates: string[] = [format(start, 'yyyy-MM-dd')];

  let cursor = start;
  for (let guard = 0; guard < 400; guard += 1) {
    const next = advanceNextGenerationDate(cursor, recurrenceType, recurrenceDay);
    if (next > end) break;
    dates.push(format(next, 'yyyy-MM-dd'));
    cursor = next;
  }

  return dates;
}

export function plannedRecurrenceDatesToCalendarDates(isoDates: string[]): Date[] {
  return isoDates
    .map((iso) => parseIsoDate(iso))
    .filter((d): d is Date => d != null);
}

export function formatPlannedRecurrenceChip(iso: string): string {
  const parsed = parseIsoDate(iso);
  return parsed ? format(parsed, 'd MMM') : iso;
}
