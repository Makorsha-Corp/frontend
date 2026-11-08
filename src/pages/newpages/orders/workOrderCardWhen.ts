import { formatHm } from '@/components/newcomponents/customui/timePicker/timePickerShared';
import { formatWallTimeHm, hour24To12, type DayPeriod } from '@/lib/wallTimeFormat';
import { untimedDayBounds } from '@/pages/newpages/orders/workOrderWindow';

function parseInstant(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function wallParts(instant: Date, timeZone: string): {
  dateIso: string;
  hour24: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    dateIso: `${read('year')}-${read('month')}-${read('day')}`,
    hour24: Number(read('hour')) % 24,
    minute: Number(read('minute')),
  };
}

function formatInstantHm(instant: Date, timeZone: string, use24Hour: boolean): string {
  const { hour24, minute } = wallParts(instant, timeZone);
  return formatWallTimeHm(formatHm(hour24, minute), use24Hour);
}

function formatRangeLabel(
  start: Date,
  end: Date,
  timeZone: string,
  use24Hour: boolean,
): string {
  if (use24Hour) {
    return `${formatInstantHm(start, timeZone, true)}–${formatInstantHm(end, timeZone, true)}`;
  }
  const startParts = wallParts(start, timeZone);
  const endParts = wallParts(end, timeZone);
  const startPeriod: DayPeriod = hour24To12(startParts.hour24).period;
  const endPeriod: DayPeriod = hour24To12(endParts.hour24).period;
  const endLabel = formatWallTimeHm(formatHm(endParts.hour24, endParts.minute), false);
  if (startPeriod === endPeriod) {
    const { hour12 } = hour24To12(startParts.hour24);
    const startShort = `${hour12}:${String(startParts.minute).padStart(2, '0')}`;
    return `${startShort}–${endLabel}`;
  }
  const startLabel = formatWallTimeHm(formatHm(startParts.hour24, startParts.minute), false);
  return `${startLabel}–${endLabel}`;
}

function isRestOfDayEnd(start: Date, end: Date, timeZone: string): boolean {
  const { dateIso } = wallParts(start, timeZone);
  const dayEnd = untimedDayBounds(dateIso, timeZone).end;
  return Math.abs(end.getTime() - dayEnd.getTime()) < 60_000;
}

export function formatWorkOrderCardWhen(
  plannedStartAt: string | null | undefined,
  plannedEndAt: string | null | undefined,
  timeZone: string,
  use24Hour: boolean,
): string {
  const start = parseInstant(plannedStartAt ?? null);
  if (!start) return 'Whole day';

  const end = parseInstant(plannedEndAt ?? null);
  if (!end || isRestOfDayEnd(start, end, timeZone)) {
    return `${formatInstantHm(start, timeZone, use24Hour)} · rest of day`;
  }

  return formatRangeLabel(start, end, timeZone, use24Hour);
}

export function scheduleInstantDateIso(
  iso: string | null | undefined,
  timeZone: string,
): string | null {
  const instant = parseInstant(iso ?? null);
  if (!instant) return null;
  return wallParts(instant, timeZone).dateIso;
}

export function formatScheduleInstant(
  iso: string | null | undefined,
  timeZone: string,
  use24Hour: boolean,
): string | null {
  const instant = parseInstant(iso ?? null);
  if (!instant) return null;
  return formatInstantHm(instant, timeZone, use24Hour);
}
