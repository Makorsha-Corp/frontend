import { describe, expect, it } from 'vitest';
import type { Machine } from '@/types/machine';
import {
  isMachinePickOccupied,
  plannedWindowIncludesNow,
  resolveMachinePickerTileDisplay,
} from './machinePickerAvailability';
import { evaluateMachinePick, warningsForStartStepConfirm } from './productionMachinePickPolicy';

function machine(partial: Partial<Machine>): Machine {
  return {
    id: 1,
    workspace_id: 1,
    name: 'M1',
    factory_id: 1,
    factory_section_id: null,
    is_running: false,
    is_active: true,
    is_deleted: false,
    latest_status_type: 'IDLE',
    ...partial,
  } as Machine;
}

const futureWindow = {
  plannedStartAt: new Date(Date.now() + 86_400_000).toISOString(),
  plannedEndAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
};

const liveWindow = {
  plannedStartAt: new Date(Date.now() - 3_600_000).toISOString(),
  plannedEndAt: new Date(Date.now() + 3_600_000).toISOString(),
};

describe('plannedWindowIncludesNow', () => {
  it('treats missing window as live (start now)', () => {
    expect(plannedWindowIncludesNow(undefined)).toBe(true);
  });

  it('detects future vs live windows', () => {
    expect(plannedWindowIncludesNow(futureWindow)).toBe(false);
    expect(plannedWindowIncludesNow(liveWindow)).toBe(true);
  });
});

describe('resolveMachinePickerTileDisplay', () => {
  it('idle free window shows Available', () => {
    const row = resolveMachinePickerTileDisplay(machine({}), { state: 'free' }, true, false);
    expect(row?.subtext).toBe('Available');
    expect(row?.topBarClass).toContain('emerald');
  });

  it('running without live step shows busy now note', () => {
    const row = resolveMachinePickerTileDisplay(
      machine({ is_running: true }),
      { state: 'free' },
      true,
      false,
    );
    expect(row?.subtext).toBe('Available · busy now');
  });

  it('busy now includes batch tooltip when live work known', () => {
    const row = resolveMachinePickerTileDisplay(
      machine({ is_running: true }),
      { state: 'free' },
      true,
      false,
      { batchNumber: 'BATCH-2026-042', stageName: 'Spin', stageLogId: 1 },
    );
    expect(row?.subtext).toContain('In production');
    expect(row?.subtextTitle).toBe('Busy with BATCH-2026-042 · Spin');
  });

  it('in-progress live work on future planned window shows In production not busy now', () => {
    const row = resolveMachinePickerTileDisplay(
      machine({ latest_status_type: 'IDLE' }),
      { state: 'free' },
      true,
      false,
      { batchNumber: 'BATCH-LIVE', stageName: 'Card', stageLogId: 50 },
    );
    expect(row?.subtext).toBe('In production · Card');
    expect(row?.bucket).toBe('occupied');
  });

  it('running in live window without in-progress step stays busy now not in production tile', () => {
    const row = resolveMachinePickerTileDisplay(
      machine({ is_running: true }),
      { state: 'free' },
      true,
      true,
    );
    expect(row?.subtext).toBe('Available · busy now');
    expect(row?.bucket).toBe('available_busy_now');
  });

  it('scheduled overlap shows Planned', () => {
    const row = resolveMachinePickerTileDisplay(
      machine({ latest_status_type: 'IDLE' }),
      { state: 'scheduled', batchNumber: 'B-12' },
      true,
      false,
    );
    expect(row?.subtext).toBe('Planned · B-12');
  });
});

describe('warningsForStartStepConfirm', () => {
  it('drops planned overlap only', () => {
    expect(
      warningsForStartStepConfirm(['schedule_overlap', 'occupied', 'maintenance']),
    ).toEqual(['occupied', 'maintenance']);
  });
});

describe('evaluateMachinePick with overlap rules', () => {
  const pickContext = (window: typeof futureWindow, extra?: Record<string, unknown>) => ({
    hasPlannedWindow: true,
    plannedWindow: window,
    windowIncludesNow: plannedWindowIncludesNow(window),
    ...extra,
  });

  it('future running is not blocked in block_overlap without live step', () => {
    const result = evaluateMachinePick(
      machine({ is_running: true }),
      'block_overlap',
      { state: 'free' },
      pickContext(futureWindow),
    );
    expect(result.blocked).toBe(false);
    expect(result.warnings).not.toContain('occupied');
  });

  it('live in-progress step is occupied and blocked in block_overlap', () => {
    const result = evaluateMachinePick(
      machine({ latest_status_type: 'IDLE' }),
      'block_overlap',
      { state: 'free' },
      pickContext(futureWindow, {
        liveWorkOnMachine: { batchNumber: 'B-2', stageName: 'Spin', stageLogId: 99 },
      }),
    );
    expect(result.warnings).toContain('occupied');
    expect(result.blocked).toBe(true);
  });

  it('scheduled overlap warns but does not block in block_overlap', () => {
    const result = evaluateMachinePick(
      machine({ latest_status_type: 'IDLE' }),
      'block_overlap',
      { state: 'scheduled' },
      pickContext(futureWindow),
    );
    expect(result.warnings).toContain('schedule_overlap');
    expect(result.blocked).toBe(false);
  });

  it('isMachinePickOccupied is schedule booking only', () => {
    expect(isMachinePickOccupied({ state: 'free' })).toBe(false);
    expect(isMachinePickOccupied({ state: 'scheduled' })).toBe(true);
  });
});
