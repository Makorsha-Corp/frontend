import { formatDistanceToNow } from 'date-fns';

/** API datetimes are UTC but often omit Z — parse as UTC, not local. */
export function parseApiDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = value.trim();
  // Already has timezone: Z or ±HH:MM
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  // Date-only (YYYY-MM-DD) — keep local midnight semantics
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s + 'T00:00:00');
  // Naive datetime from API → treat as UTC
  return new Date(s.endsWith('Z') ? s : s + 'Z');
}

export function formatRelativeFromApi(value: string): string {
  try {
    const date = parseApiDateTime(value);
    if (!date || Number.isNaN(date.getTime())) return value;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return value;
  }
}
