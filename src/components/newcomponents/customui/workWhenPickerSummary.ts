import { format, parseISO } from 'date-fns';
import { formatHm } from '@/components/newcomponents/customui/timePicker/timePickerShared';
import { formatWallTimeHm, hour24To12, type DayPeriod } from '@/lib/wallTimeFormat';
import { resolveWorkOrderWindow, untimedDayBounds } from '@/pages/newpages/orders/workOrderWindow';

function parseLocalDateTime(value: string): {
  dateIso: string;
  hour24: number;
  minute: number;
} | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const hour = parseInt(match[2], 10);
  const minute = parseInt(match[3], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { dateIso: match[1], hour24: hour, minute };
}

function parseLocalDateValue(value: string): {
  dateIso: string;
  hour24?: number;
  minute?: number;
} | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(trimmed);
  if (dateOnly) return { dateIso: dateOnly[1] };
  return parseLocalDateTime(trimmed);
}

export const LENGTH_CHIP_PRESETS = [
  { id: 'rest', label: 'Rest of day', minutes: '' },
  { id: '30', label: '30 min', minutes: '30' },
  { id: '60', label: '1h', minutes: '60' },
  { id: '120', label: '2h', minutes: '120' },
  { id: '240', label: '4h', minutes: '240' },
] as const;

export type LengthChipPresetId = (typeof LENGTH_CHIP_PRESETS)[number]['id'] | 'custom';

export function lengthPresetFromMinutes(minutes: string): LengthChipPresetId {
  if (!minutes.trim()) return 'rest';
  const match = LENGTH_CHIP_PRESETS.find((preset) => preset.minutes === minutes.trim());
  return match?.id ?? 'custom';
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
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

function formatDateLine(dateIso: string): string {
  const date = parseIsoDate(dateIso);
  return date ? format(date, 'dd.MM.yyyy (EEE)') : dateIso;
}

/** Compact duration for trigger summary, e.g. `(1h)`, `(30 min)`, `(rest of day)`. */
export function formatWorkWhenDurationBracket(durationMinutes: string): string {
  const trimmed = durationMinutes.trim();
  if (!trimmed) return '(rest of day)';
  const preset = LENGTH_CHIP_PRESETS.find((p) => p.minutes === trimmed);
  if (preset && preset.id !== 'rest') return `(${preset.label})`;
  const mins = Number.parseInt(trimmed, 10);
  if (Number.isNaN(mins)) return '';
  if (mins >= 60 && mins % 60 === 0) return `(${mins / 60}h)`;
  return `(${mins} min)`;
}

export interface WorkWhenDisplayLines {
  dateLine: string;
  /** Null when the whole calendar day is untimed. */
  timeLine: string | null;
}

export function formatWorkWhenDisplayLines(
  value: string,
  durationMinutes: string,
  use24Hour: boolean,
  timeZone: string,
): WorkWhenDisplayLines | null {
  const parsed = parseLocalDateValue(value);
  if (!parsed) return null;

  const dateLine = formatDateLine(parsed.dateIso);
  if (parsed.hour24 == null || parsed.minute == null) {
    return { dateLine, timeLine: null };
  }

  const durationTrimmed = durationMinutes.trim();
  const duration =
    durationTrimmed === '' ? null : Number.parseInt(durationTrimmed, 10);
  if (durationTrimmed !== '' && Number.isNaN(duration)) {
    return { dateLine, timeLine: formatWallTimeHm(formatHm(parsed.hour24, parsed.minute), use24Hour) };
  }

  const window = resolveWorkOrderWindow({
    plannedDate: parsed.dateIso,
    plannedStartTime: formatHm(parsed.hour24, parsed.minute),
    durationMinutes: duration,
    timeZone,
  });

  if (!window.start || !window.end) {
    return {
      dateLine,
      timeLine: formatWallTimeHm(formatHm(parsed.hour24, parsed.minute), use24Hour),
    };
  }

  const durationBracket = formatWorkWhenDurationBracket(durationMinutes);

  if (duration == null || isRestOfDayEnd(window.start, window.end, timeZone)) {
    const startLabel = formatInstantHm(window.start, timeZone, use24Hour);
    return { dateLine, timeLine: `${startLabel} ${durationBracket}`.trim() };
  }

  const range = formatRangeLabel(window.start, window.end, timeZone, use24Hour);
  return {
    dateLine,
    timeLine: durationBracket ? `${range} ${durationBracket}` : range,
  };
}

/** Single-line summary (tests and compact fallbacks). */
export function formatWorkWhenSummary(
  value: string,
  durationMinutes: string,
  use24Hour: boolean,
  timeZone = 'UTC',
): string | null {
  const lines = formatWorkWhenDisplayLines(value, durationMinutes, use24Hour, timeZone);
  if (!lines) return null;
  if (!lines.timeLine) return lines.dateLine;
  return `${lines.dateLine} · ${lines.timeLine}`;
}
