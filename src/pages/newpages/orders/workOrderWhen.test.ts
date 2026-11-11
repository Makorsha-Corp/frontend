/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import {
  workWhenStateFromPlanned,
  workWhenTimingSignature,
  workWhenToUpdatePayload,
} from './workOrderWhen';
import { untimedDayBounds } from './workOrderWindow';

const TZ = 'Asia/Dhaka';

describe('workWhenStateFromPlanned', () => {
  it('maps timed window to picker value and duration', () => {
    const plannedDate = '2026-11-03';
    const start = '2026-11-03T11:30:00.000Z';
    const end = '2026-11-03T12:00:00.000Z';
    const state = workWhenStateFromPlanned(plannedDate, start, end, TZ);
    expect(state.workWhen).toMatch(/^2026-11-03T/);
    expect(state.durationMinutes).toBe('30');
  });

  it('uses empty duration for rest-of-day end', () => {
    const plannedDate = '2026-11-03';
    const start = '2026-11-03T11:30:00.000Z';
    const dayEnd = untimedDayBounds(plannedDate, TZ).end.toISOString();
    const state = workWhenStateFromPlanned(plannedDate, start, dayEnd, TZ);
    expect(state.durationMinutes).toBe('');
  });

  it('falls back to date-only when no start instant', () => {
    expect(workWhenStateFromPlanned('2026-11-03', null, null, TZ)).toEqual({
      workWhen: '2026-11-03',
      durationMinutes: '',
    });
  });
});

describe('workWhenToUpdatePayload', () => {
  it('sends date only when clock absent', () => {
    expect(workWhenToUpdatePayload('2026-11-03', '')).toEqual({ planned_date: '2026-11-03' });
  });

  it('sends timing columns when clock set', () => {
    expect(workWhenToUpdatePayload('2026-11-03T17:30', '60')).toEqual({
      planned_date: '2026-11-03',
      shift_id: null,
      planned_start_time: '17:30',
      expected_duration_minutes: 60,
    });
  });

  it('sends null duration for rest of day', () => {
    expect(workWhenToUpdatePayload('2026-11-03T17:30', '')).toEqual({
      planned_date: '2026-11-03',
      shift_id: null,
      planned_start_time: '17:30',
      expected_duration_minutes: null,
    });
  });
});

describe('workWhenTimingSignature', () => {
  it('combines value and duration for change detection', () => {
    expect(workWhenTimingSignature('2026-11-03T10:00', '30')).toBe('2026-11-03T10:00|30');
  });
});
