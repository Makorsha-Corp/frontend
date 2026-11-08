import type { DayPeriod } from '@/lib/wallTimeFormat';

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => i);
export const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
export const PERIODS: DayPeriod[] = ['AM', 'PM'];
export const ROW_HEIGHT_PX = 36;

/** Default scroll viewport; work-when popover uses a taller value to match calendar. */
export const TIME_PICKER_VIEWPORT_PX = 180;
export const WORK_WHEN_TIME_VIEWPORT_PX = 262;

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function parseHm(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function formatHm(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function buildMinutes(step: number): number[] {
  const safe = Math.min(30, Math.max(1, step));
  const out: number[] = [];
  for (let m = 0; m < 60; m += safe) out.push(m);
  return out;
}

export function wheelDeltaPx(event: WheelEvent, viewportHeight: number): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * ROW_HEIGHT_PX;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * viewportHeight;
  return event.deltaY;
}

export function minutesListForStep(minuteStep: number, valueHm: string): number[] {
  const base = buildMinutes(minuteStep);
  const p = parseHm(valueHm);
  if (p != null && !base.includes(p.minute)) {
    return [...base, p.minute].sort((a, b) => a - b);
  }
  return base;
}
