export type DayPeriod = 'AM' | 'PM';

export function hour24To12(hour24: number): { hour12: number; period: DayPeriod } {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return { hour12: 12, period: 'AM' };
  if (h < 12) return { hour12: h, period: 'AM' };
  if (h === 12) return { hour12: 12, period: 'PM' };
  return { hour12: h - 12, period: 'PM' };
}

export function hour12To24(hour12: number, period: DayPeriod): number {
  const h = Math.min(12, Math.max(1, hour12));
  if (period === 'AM') return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

export function formatWallTimeHm(hm: string, use24Hour: boolean): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!match) return hm;
  const hour = parseInt(match[1], 10);
  const minute = match[2];
  if (use24Hour) {
    return `${String(hour).padStart(2, '0')}:${minute}`;
  }
  const { hour12, period } = hour24To12(hour);
  return `${hour12}:${minute} ${period}`;
}
