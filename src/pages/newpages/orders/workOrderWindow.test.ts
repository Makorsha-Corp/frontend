import { describe, expect, it } from 'vitest';

import { resolveWorkOrderWindow, untimedDayBounds, windowsIntersect } from './workOrderWindow';

function utc(y: number, m: number, d: number, hh: number, mm: number): number {
  return resolveWorkOrderWindow({
    plannedDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    plannedStartTime: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    durationMinutes: null,
    timeZone: 'Asia/Dhaka',
  }).start!.getTime();
}

describe('resolveWorkOrderWindow', () => {
  it('stays untimed when no clock is set', () => {
    const window = resolveWorkOrderWindow({
      plannedDate: '2026-11-02',
      plannedStartTime: null,
      durationMinutes: null,
      timeZone: 'Asia/Dhaka',
    });
    expect(window.start).toBeNull();
    expect(window.end).toBeNull();
  });

  it('runs from the clock to the end of the work date', () => {
    const window = resolveWorkOrderWindow({
      plannedDate: '2026-11-02',
      plannedStartTime: '12:00',
      durationMinutes: null,
      timeZone: 'Asia/Dhaka',
    });
    expect(window.start!.getTime()).toBe(utc(2026, 11, 2, 12, 0));
    expect(window.end!.getTime()).toBe(untimedDayBounds('2026-11-02', 'Asia/Dhaka').end.getTime());
  });

  it('adds duration to the clock', () => {
    const window = resolveWorkOrderWindow({
      plannedDate: '2026-11-02',
      plannedStartTime: '06:30',
      durationMinutes: 120,
      timeZone: 'Asia/Dhaka',
    });
    expect(window.end!.getTime() - window.start!.getTime()).toBe(120 * 60_000);
    expect(window.start!.getTime()).toBe(utc(2026, 11, 2, 6, 30));
  });

  it('rejects duration without a clock', () => {
    expect(() =>
      resolveWorkOrderWindow({
        plannedDate: '2026-11-02',
        plannedStartTime: null,
        durationMinutes: 30,
        timeZone: 'Asia/Dhaka',
      }),
    ).toThrow(/Duration requires a start time/);
  });

  it('treats a touching window as a miss', () => {
    const left = resolveWorkOrderWindow({
      plannedDate: '2026-11-02',
      plannedStartTime: '06:00',
      durationMinutes: 120,
      timeZone: 'Asia/Dhaka',
    });
    const right = resolveWorkOrderWindow({
      plannedDate: '2026-11-02',
      plannedStartTime: '08:00',
      durationMinutes: 120,
      timeZone: 'Asia/Dhaka',
    });
    expect(windowsIntersect(left.start!, left.end!, right.start!, right.end!)).toBe(false);
  });
});
