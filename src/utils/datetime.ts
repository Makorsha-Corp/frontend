import { formatDistanceToNow } from 'date-fns';

export interface DateTimeFormatOptions {
  timeZone?: string;
}

/** Detect browser IANA timezone. */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/** API datetimes are UTC but often omit Z — parse as UTC, not local. */
export function parseApiDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = value.trim();
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`);
  return new Date(s.endsWith('Z') ? s : `${s}Z`);
}

function resolveTimeZone(timeZone?: string): string {
  return timeZone?.trim() || detectBrowserTimezone();
}

function zonedCalendarKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isTodayInZone(date: Date, timeZone: string): boolean {
  return zonedCalendarKey(date, timeZone) === zonedCalendarKey(new Date(), timeZone);
}

function isYesterdayInZone(date: Date, timeZone: string): boolean {
  const yesterday = new Date(Date.now() - 86_400_000);
  return zonedCalendarKey(date, timeZone) === zonedCalendarKey(yesterday, timeZone);
}

export function formatRelativeFromApi(
  value: string,
  _options?: DateTimeFormatOptions
): string {
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return value;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return value;
  }
}

export function formatAbsoluteFromApi(
  value: string,
  timeZone?: string
): string {
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return value;
    const tz = resolveTimeZone(timeZone);
    const datePart = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
    const timePart = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
    return `${datePart} · ${timePart}`;
  } catch {
    return value;
  }
}

export function isSameCalendarDayFromApi(
  a: string,
  b: string,
  timeZone?: string
): boolean {
  const da = parseApiDateTime(a);
  const db = parseApiDateTime(b);
  if (!da || !db || Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  const tz = resolveTimeZone(timeZone);
  return zonedCalendarKey(da, tz) === zonedCalendarKey(db, tz);
}

export function formatDiscussionDayLabelFromApi(
  value: string,
  timeZone?: string
): string {
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return value;
    const tz = resolveTimeZone(timeZone);
    if (isTodayInZone(date, tz)) return 'Today';
    if (isYesterdayInZone(date, tz)) return 'Yesterday';
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return value;
  }
}

export function formatTimeFromApi(value: string, timeZone?: string): string {
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: resolveTimeZone(timeZone),
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return value;
  }
}

/** Short datetime for detail panels (e.g. item activity). */
export function formatDateTimeFromApi(
  value: string | null | undefined,
  timeZone?: string
): string {
  if (!value) return '—';
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      timeZone: resolveTimeZone(timeZone),
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}

/** Calendar date from an API instant or date-only string. */
export function formatDateFromApi(
  value: string | null | undefined,
  timeZone?: string
): string {
  if (!value) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split('-').map(Number);
    if (!year || !month || !day) return '—';
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      timeZone: resolveTimeZone(timeZone),
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

/** en-US short date for order detail panels. */
export function formatShortDateFromApi(
  value: string | null | undefined,
  timeZone?: string
): string {
  if (!value) return '—';
  return formatDateFromApi(value, timeZone);
}
