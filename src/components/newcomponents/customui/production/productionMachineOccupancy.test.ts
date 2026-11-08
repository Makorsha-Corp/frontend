import { describe, expect, it } from 'vitest';
import {
  buildMachineOccupancyForWindow,
  findLiveWorkOnMachine,
} from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import type { ProductionScheduleBatch } from '@/types/production';

describe('buildMachineOccupancyForWindow', () => {
  const batches: ProductionScheduleBatch[] = [
    {
      batch_id: 10,
      batch_number: 'BATCH-2026-001',
      status: 'draft',
      planned_start_at: '2026-01-01T08:00:00.000Z',
      planned_end_at: '2026-01-01T12:00:00.000Z',
      steps: [
        {
          stage_log_id: 1,
          stage_name: 'Spin',
          stage_order: 1,
          production_line_id: 5,
          machine_id: 100,
          planned_start_at: '2026-01-01T08:00:00.000Z',
          planned_end_at: '2026-01-01T10:00:00.000Z',
          rework_of_log_id: null,
        },
      ],
    },
  ];

  it('returns undefined without a window', () => {
    expect(buildMachineOccupancyForWindow([100, 101], null, batches)).toBeUndefined();
  });

  it('marks overlapping machine scheduled and others free', () => {
    const map = buildMachineOccupancyForWindow(
      [100, 101],
      {
        plannedStartAt: '2026-01-01T09:00:00.000Z',
        plannedEndAt: '2026-01-01T11:00:00.000Z',
      },
      batches,
    );
    expect(map?.[100]).toEqual({ state: 'scheduled', batchNumber: 'BATCH-2026-001' });
    expect(map?.[101]).toEqual({ state: 'free' });
  });

  it('marks machine planned when two drafts share the same start and machine', () => {
    const sameStart = '2026-10-21T00:00:00.000Z';
    const twelve = {
      batch_id: 14,
      batch_number: 'BATCH-2026-012',
      status: 'draft' as const,
      planned_start_at: sameStart,
      planned_end_at: '2026-10-21T00:15:00.000Z',
      steps: [
        {
          stage_log_id: 24,
          stage_name: 'Cloth Cutting',
          stage_order: 1,
          production_line_id: 8,
          machine_id: 11,
          status: 'pending',
          planned_start_at: sameStart,
          planned_end_at: '2026-10-21T00:05:00.000Z',
          rework_of_log_id: null,
        },
      ],
    };
    const fourteen = {
      batch_id: 16,
      batch_number: 'BATCH-2026-014',
      status: 'draft' as const,
      planned_start_at: sameStart,
      planned_end_at: '2026-10-21T00:25:00.000Z',
      steps: [
        {
          stage_log_id: 28,
          stage_name: 'Carding',
          stage_order: 1,
          production_line_id: 6,
          machine_id: 11,
          status: 'pending',
          planned_start_at: sameStart,
          planned_end_at: '2026-10-21T00:10:00.000Z',
          rework_of_log_id: null,
        },
      ],
    };
    const map = buildMachineOccupancyForWindow(
      [11],
      {
        plannedStartAt: sameStart,
        plannedEndAt: '2026-10-21T00:05:00.000Z',
      },
      [twelve, fourteen],
      { batchId: 14 },
    );
    expect(map?.[11]).toEqual({ state: 'scheduled', batchNumber: 'BATCH-2026-014' });
  });

  it('does not mark the open batch as booked against itself', () => {
    const map = buildMachineOccupancyForWindow(
      [100],
      {
        plannedStartAt: '2026-01-01T09:00:00.000Z',
        plannedEndAt: '2026-01-01T11:00:00.000Z',
      },
      batches,
      { batchId: 10 },
    );
    expect(map?.[100]).toEqual({ state: 'free' });
  });
});

describe('findLiveWorkOnMachine', () => {
  it('returns in-progress batch step on machine when now is in planned window', () => {
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 2,
        batch_number: 'BATCH-LIVE',
        status: 'in_progress',
        planned_start_at: '2026-06-15T08:00:00.000Z',
        planned_end_at: '2026-06-15T16:00:00.000Z',
        steps: [
          {
            stage_log_id: 9,
            stage_name: 'Card',
            stage_order: 1,
            production_line_id: 1,
            machine_id: 55,
            status: 'in_progress',
            planned_start_at: '2026-06-15T09:00:00.000Z',
            planned_end_at: '2026-06-15T11:00:00.000Z',
            rework_of_log_id: null,
          },
        ],
      },
    ];
    expect(findLiveWorkOnMachine(55, batches)).toEqual({
      batchNumber: 'BATCH-LIVE',
      stageName: 'Card',
      stageLogId: 9,
    });
  });

  it('ignores completed steps even when batch is still in progress', () => {
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 18,
        batch_number: 'BATCH-2026-016',
        status: 'in_progress',
        planned_start_at: '2026-10-18T05:45:00.000Z',
        planned_end_at: '2026-10-18T20:00:00.000Z',
        steps: [
          {
            stage_log_id: 1,
            stage_name: 'Embroidery Line',
            stage_order: 1,
            production_line_id: 1,
            machine_id: 55,
            status: 'completed',
            planned_start_at: '2026-10-18T05:45:00.000Z',
            planned_end_at: '2026-10-18T06:10:00.000Z',
            rework_of_log_id: null,
          },
          {
            stage_log_id: 3,
            stage_name: 'Cloth Cutting',
            stage_order: 3,
            production_line_id: 3,
            machine_id: 55,
            status: 'pending',
            planned_start_at: '2026-10-18T12:00:00.000Z',
            planned_end_at: '2026-10-18T13:00:00.000Z',
            rework_of_log_id: null,
          },
        ],
      },
    ];
    expect(findLiveWorkOnMachine(55, batches)).toBeNull();
  });

  it('does not treat batch machine_id as occupancy when the step has no machine', () => {
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 4,
        batch_number: 'BATCH-BATCH-MACHINE',
        status: 'in_progress',
        machine_id: 88,
        planned_start_at: '2026-06-15T08:00:00.000Z',
        planned_end_at: '2026-06-15T16:00:00.000Z',
        steps: [
          {
            stage_log_id: 11,
            stage_name: 'Ring',
            stage_order: 1,
            production_line_id: 1,
            machine_id: null,
            status: 'in_progress',
            planned_start_at: '2026-06-15T09:00:00.000Z',
            planned_end_at: '2026-06-15T11:00:00.000Z',
            rework_of_log_id: null,
          },
        ],
      },
    ];
    expect(findLiveWorkOnMachine(88, batches)).toBeNull();
  });

  it('uses in_progress step status even when planned window is still in the future', () => {
    const batches: ProductionScheduleBatch[] = [
      {
        batch_id: 3,
        batch_number: 'BATCH-EARLY',
        status: 'in_progress',
        planned_start_at: '2026-06-20T08:00:00.000Z',
        planned_end_at: '2026-06-20T16:00:00.000Z',
        steps: [
          {
            stage_log_id: 10,
            stage_name: 'Spin',
            stage_order: 1,
            production_line_id: 1,
            machine_id: 77,
            status: 'in_progress',
            planned_start_at: '2026-06-20T14:00:00.000Z',
            planned_end_at: '2026-06-20T16:00:00.000Z',
            rework_of_log_id: null,
          },
        ],
      },
    ];
    expect(findLiveWorkOnMachine(77, batches)).toEqual({
      batchNumber: 'BATCH-EARLY',
      stageName: 'Spin',
      stageLogId: 10,
    });
  });
});
