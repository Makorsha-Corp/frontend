/** Calendar date key YYYY-MM-DD in local timezone (not UTC). */
export function toLocalDateKey(value: string | Date): string {
  const d = parseCalendarDate(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today as YYYY-MM-DD in the browser's calendar, not the UTC day. */
export function todayLocalDateKey(now = new Date()): string {
  return toLocalDateKey(now);
}

/** Date-only strings stay on that calendar day. Instants convert in local time. */
export function parseCalendarDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  return parseDateOnlyOrLocal(value);
}

function parseDateOnlyOrLocal(value: string): Date {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(trimmed);
}
