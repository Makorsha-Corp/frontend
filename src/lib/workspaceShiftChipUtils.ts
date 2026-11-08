import type { WorkspaceShift } from '@/types/workspaceShift';
import { formatWallTimeHm } from '@/lib/wallTimeFormat';

export function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(':').map((part) => parseInt(part, 10));
  return (h || 0) * 60 + (m || 0);
}

export function minutesInShiftWindow(minute: number, start: number, end: number): boolean {
  const m = ((minute % 1440) + 1440) % 1440;
  if (start === end) return false;
  if (start < end) return m >= start && m < end;
  return m >= start || m < end;
}

export function findShiftForDate(shifts: WorkspaceShift[], when: Date): WorkspaceShift | null {
  const minute = when.getHours() * 60 + when.getMinutes();
  const matches = shifts.filter(
    (s) =>
      s.is_active &&
      minutesInShiftWindow(minute, parseTimeToMinutes(s.start_time), parseTimeToMinutes(s.end_time)),
  );
  if (matches.length === 0) return null;
  return [...matches].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)[0] ?? null;
}

export function shiftWindowStartOnDate(shift: WorkspaceShift, onDate: Date): Date {
  const out = new Date(onDate);
  const [h, m] = shift.start_time.split(':').map((part) => parseInt(part, 10));
  out.setHours(h || 0, m || 0, 0, 0);
  return out;
}

/** Pick shift chip: now if inside window, else window start on reference day. */
export function plannedStartForShiftSelection(
  shift: WorkspaceShift,
  reference: Date,
  now: Date = new Date(),
): Date {
  const start = parseTimeToMinutes(shift.start_time);
  const end = parseTimeToMinutes(shift.end_time);
  const minute = now.getHours() * 60 + now.getMinutes();
  if (minutesInShiftWindow(minute, start, end)) {
    const copy = new Date(now);
    copy.setSeconds(0, 0);
    return copy;
  }
  return shiftWindowStartOnDate(shift, reference);
}

export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function batchDateFromPlanned(plannedLocal: string): string {
  return plannedLocal.slice(0, 10);
}

export function formatShiftChipLabel(shift: WorkspaceShift, use24Hour = true): string {
  const fmt = (t: string) => formatWallTimeHm(t.slice(0, 5), use24Hour);
  return `${shift.name} (${fmt(shift.start_time)}–${fmt(shift.end_time)})`;
}
