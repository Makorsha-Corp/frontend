import { describe, expect, it } from 'vitest';
import type { Machine } from '@/types/machine';
import { evaluateMachinePick, parseProductionMachinePickPolicy } from './productionMachinePickPolicy';

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
    ...partial,
  } as Machine;
}

describe('parseProductionMachinePickPolicy', () => {
  it('defaults to soft', () => {
    expect(parseProductionMachinePickPolicy(undefined)).toBe('soft');
  });
});

describe('evaluateMachinePick', () => {
  it('soft warns on occupied and schedule but never blocks', () => {
    const evalResult = evaluateMachinePick(
      machine({ latest_status_type: 'OFF' }),
      'soft',
      { state: 'scheduled', batchNumber: 'B-1' },
      {
        hasPlannedWindow: true,
        windowIncludesNow: false,
        liveWorkOnMachine: { batchNumber: 'B-2', stageLogId: 1 },
      },
    );
    expect(evalResult.blocked).toBe(false);
    expect(evalResult.warnings).toContain('off');
    expect(evalResult.warnings).toContain('occupied');
    expect(evalResult.warnings).toContain('schedule_overlap');
  });

  it('block_unavailable blocks off and maintenance only', () => {
    expect(evaluateMachinePick(machine({ latest_status_type: 'OFF' }), 'block_unavailable').blocked).toBe(
      true,
    );
    expect(
      evaluateMachinePick(
        machine({ is_running: true }),
        'block_unavailable',
        { state: 'free' },
        { liveWorkOnMachine: { batchNumber: 'B-1', stageLogId: 2 } },
      ).blocked,
    ).toBe(false);
  });
});
