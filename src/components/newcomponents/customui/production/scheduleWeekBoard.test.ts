import { describe, expect, it } from 'vitest';
import { parseISO } from 'date-fns';
import type { ProductionScheduleBatch } from '@/types/production';
import type { WorkspaceShift } from '@/types/workspaceShift';
import {
  SCHEDULE_WEEK_CELL_VISIBLE_CARDS,
  buildScheduleWeekDisplayHours,
  countStepStartsByDay,
  hoursCoveredByShift,
  hoursOverlappedByStepOnDay,
  scheduleBatchStatusPillLabel,
  clusterHourGridSpans,
  hourGridSpansForDay,
  scheduleStepsForHourCell,
  stepOverlapsHourOnDay,
} from '@/components/newcomponents/customui/production/scheduleWeekBoard';

const morningShift: WorkspaceShift = {
  id: 1,
  workspace_id: 1,
  name: 'Morning',
  start_time: '06:00:00',
  end_time: '14:00:00',
  sort_order: 0,
  is_active: true,
  created_at: '',
  updated_at: '',
};

const nightShift: WorkspaceShift = {
  id: 2,
  workspace_id: 1,
  name: 'Night',
  start_time: '22:00:00',
  end_time: '06:00:00',
  sort_order: 1,
  is_active: true,
  created_at: '',
  updated_at: '',
};

function step(
  stageLogId: number,
  lineId: number,
  start: string,
  end: string,
): ProductionScheduleBatch['steps'][number] {
  return {
    stage_log_id: stageLogId,
    stage_name: 'Run',
    stage_order: 1,
    production_line_id: lineId,
    machine_id: null,
    planned_start_at: start,
    planned_end_at: end,
    rework_of_log_id: null,
    status: 'pending',
  };
}

describe('scheduleWeekBoard helpers', () => {
  it('maps batch status to pill labels', () => {
    expect(scheduleBatchStatusPillLabel('draft')).toBe('Draft');
    expect(scheduleBatchStatusPillLabel('recurring')).toBe('Rec');
    expect(scheduleBatchStatusPillLabel('in_progress')).toBe('Running');
    expect(scheduleBatchStatusPillLabel('completed')).toBe('Done');
    expect(scheduleBatchStatusPillLabel('cancelled')).toBe('Cancelled');
  });

  it('counts step starts per local calendar day', () => {
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'draft',
        planned_start_at: '2026-10-20T08:00:00.000Z',
        planned_end_at: '2026-10-20T12:00:00.000Z',
        machine_id: null,
        steps: [
          {
            stage_log_id: 10,
            stage_name: 'Mix',
            stage_order: 1,
            production_line_id: 1,
            machine_id: null,
            planned_start_at: '2026-10-20T14:00:00.000Z',
            planned_end_at: '2026-10-20T16:00:00.000Z',
            rework_of_log_id: null,
            status: 'pending',
          },
          {
            stage_log_id: 11,
            stage_name: 'Spin',
            stage_order: 2,
            production_line_id: 1,
            machine_id: null,
            planned_start_at: '2026-10-21T14:00:00.000Z',
            planned_end_at: '2026-10-21T16:00:00.000Z',
            rework_of_log_id: null,
            status: 'pending',
          },
        ],
      },
    ];
    const counts = countStepStartsByDay(batches);
    const keys = Object.keys(counts);
    expect(keys).toHaveLength(2);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(2);
  });

  it('exposes cell card cap constant', () => {
    expect(SCHEDULE_WEEK_CELL_VISIBLE_CARDS).toBe(2);
  });

  it('includes each hour in a same-day shift window', () => {
    expect(hoursCoveredByShift(morningShift)).toEqual([6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it('overnight shift wraps and does not fill daytime gap', () => {
    const hours = hoursCoveredByShift(nightShift);
    expect(hours).toContain(22);
    expect(hours).toContain(23);
    expect(hours).toContain(0);
    expect(hours).toContain(5);
    expect(hours).not.toContain(12);
    expect(hours).not.toContain(14);
  });

  it('adds step hours outside shift windows', () => {
    const day = parseISO('2026-10-20T12:00:00');
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'draft',
        planned_start_at: '2026-10-20T08:00:00.000Z',
        planned_end_at: '2026-10-20T12:00:00.000Z',
        machine_id: null,
        steps: [step(10, 5, '2026-10-20T15:00:00', '2026-10-20T16:00:00')],
      },
    ];
    const hours = buildScheduleWeekDisplayHours([morningShift], batches, [5], [day]);
    expect(hours).toContain(15);
    expect(hours).toContain(6);
  });

  it('returns empty display hours when no shifts and no steps', () => {
    const day = parseISO('2026-10-20T12:00:00');
    expect(buildScheduleWeekDisplayHours([], [], [1], [day])).toEqual([]);
  });

  it('covers each overlapped hour including partial first and last hour', () => {
    const day = parseISO('2026-10-20T12:00:00');
    const longStep = step(1, 1, '2026-10-20T10:30:00', '2026-10-20T12:45:00');
    expect(hoursOverlappedByStepOnDay(longStep, day)).toEqual([10, 11, 12]);
    expect(stepOverlapsHourOnDay(longStep, day, 10)).toBe(true);
    expect(stepOverlapsHourOnDay(longStep, day, 9)).toBe(false);
    expect(stepOverlapsHourOnDay(longStep, day, 13)).toBe(false);
  });

  it('places midnight-spanning steps on both calendar days', () => {
    const day1 = parseISO('2026-10-20T12:00:00');
    const day2 = parseISO('2026-10-21T12:00:00');
    const cross = step(1, 1, '2026-10-20T23:30:00', '2026-10-21T01:30:00');
    expect(hoursOverlappedByStepOnDay(cross, day1)).toEqual([23]);
    expect(hoursOverlappedByStepOnDay(cross, day2)).toEqual([0, 1]);
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'recurring',
        planned_start_at: '2026-10-20T23:30:00',
        planned_end_at: '2026-10-21T01:30:00',
        machine_id: null,
        steps: [cross],
      },
    ];
    expect(scheduleStepsForHourCell(batches, [1], day2, 0)).toHaveLength(1);
    expect(scheduleStepsForHourCell(batches, [1], day1, 23)).toHaveLength(1);
  });

  it('builds a single-hour grid span', () => {
    const day = parseISO('2026-10-20T12:00:00');
    const displayHours = [10];
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'recurring',
        planned_start_at: '2026-10-20T10:00:00',
        planned_end_at: '2026-10-20T10:45:00',
        machine_id: null,
        steps: [step(1, 1, '2026-10-20T10:00:00', '2026-10-20T10:45:00')],
      },
    ];
    const spans = hourGridSpansForDay(batches, [1], day, displayHours);
    expect(spans).toHaveLength(1);
    expect(spans[0]?.startIndex).toBe(0);
    expect(spans[0]?.endIndex).toBe(1);
  });

  it('spans multiple visible hour rows', () => {
    const day = parseISO('2026-10-20T12:00:00');
    const displayHours = [10, 11, 12];
    const longStep = step(1, 1, '2026-10-20T10:30:00', '2026-10-20T12:45:00');
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'recurring',
        planned_start_at: '2026-10-20T10:30:00',
        planned_end_at: '2026-10-20T12:45:00',
        machine_id: null,
        steps: [longStep],
      },
    ];
    const spans = hourGridSpansForDay(batches, [1], day, displayHours);
    expect(spans[0]?.startIndex).toBe(0);
    expect(spans[0]?.endIndex).toBe(3);
  });

  it('splits midnight runs across days in hour grid spans', () => {
    const day1 = parseISO('2026-10-20T12:00:00');
    const day2 = parseISO('2026-10-21T12:00:00');
    const cross = step(1, 1, '2026-10-20T23:30:00', '2026-10-21T01:30:00');
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'recurring',
        planned_start_at: '2026-10-20T23:30:00',
        planned_end_at: '2026-10-21T01:30:00',
        machine_id: null,
        steps: [cross],
      },
    ];
    const spansDay1 = hourGridSpansForDay(batches, [1], day1, [23]);
    const spansDay2 = hourGridSpansForDay(batches, [1], day2, [0, 1]);
    expect(spansDay1).toHaveLength(1);
    expect(spansDay1[0]?.endIndex).toBe(1);
    expect(spansDay2).toHaveLength(1);
    expect(spansDay2[0]?.startIndex).toBe(0);
    expect(spansDay2[0]?.endIndex).toBe(2);
  });

  it('clusters overlapping steps for vertical stacking', () => {
    const day = parseISO('2026-10-20T12:00:00');
    const displayHours = [10, 11];
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'recurring',
        planned_start_at: '2026-10-20T10:00:00',
        planned_end_at: '2026-10-20T11:30:00',
        machine_id: null,
        steps: [
          step(1, 1, '2026-10-20T10:00:00', '2026-10-20T11:30:00'),
          step(2, 2, '2026-10-20T10:30:00', '2026-10-20T11:00:00'),
        ],
      },
    ];
    const spans = hourGridSpansForDay(batches, [1, 2], day, displayHours);
    expect(spans).toHaveLength(2);
    const clusters = clusterHourGridSpans(spans);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(2);
  });

  it('does not fill hour cells for filtered-out lines', () => {
    const day = parseISO('2026-10-20T12:00:00');
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 1,
        batch_number: 'B-1',
        status: 'recurring',
        planned_start_at: '2026-10-20T10:00:00',
        planned_end_at: '2026-10-20T11:00:00',
        machine_id: null,
        steps: [
          step(1, 1, '2026-10-20T10:00:00', '2026-10-20T11:00:00'),
          step(2, 2, '2026-10-20T10:00:00', '2026-10-20T11:00:00'),
        ],
      },
    ];
    expect(hourGridSpansForDay(batches, [2], day, [10])).toHaveLength(1);
    expect(hourGridSpansForDay(batches, [2], day, [10])[0]?.step.stage_log_id).toBe(2);
    expect(hourGridSpansForDay(batches, [1], day, [10])).toHaveLength(1);
    expect(hourGridSpansForDay(batches, [99], day, [10])).toHaveLength(0);
  });
});
