import { parseCalendarDate } from '@/lib/heatmapDateKey';

export function isValidIanaTimezone(value: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

/** Mill calendar when the workspace has not saved a timezone. */
export const DEFAULT_MILL_TIMEZONE = 'Asia/Dhaka';

/** Saved workspace zone, otherwise Bangladesh (Asia/Dhaka). Not the user's personal display zone. */
export function resolveMillTimezone(workspaceTz: string | null | undefined): string {
  const trimmed = workspaceTz?.trim();
  if (trimmed && isValidIanaTimezone(trimmed)) return trimmed;
  return DEFAULT_MILL_TIMEZONE;
}

/** YYYY-MM-DD in `timeZone`. */
export function millCalendarDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function millBatchDate(args: {
  plannedLocal: string;
  timeZone: string;
  now?: Date;
}): string {
  const planned = args.plannedLocal.trim();
  if (!planned) return millCalendarDate(args.now ?? new Date(), args.timeZone);
  const instant = new Date(planned);
  if (Number.isNaN(instant.getTime())) return planned.slice(0, 10);
  return millCalendarDate(instant, args.timeZone);
}

/** Date-only batch_date as local midnight, so the card does not shift to the previous UTC evening. */
export function batchCardDate(batchDate: string): Date {
  return parseCalendarDate(batchDate);
}
