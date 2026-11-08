import { describe, expect, it } from 'vitest';
import { isLastOpenStep } from './productionStepWorkflow';
import type { ProductionBatchStageLog } from '@/types/production';

function log(partial: Partial<ProductionBatchStageLog> & Pick<ProductionBatchStageLog, 'id' | 'status'>): ProductionBatchStageLog {
  return {
    stage_name: 'Step',
    stage_order: partial.stage_order ?? partial.id,
    batch_id: 1,
    workspace_id: 1,
    ...partial,
  } as ProductionBatchStageLog;
}

describe('isLastOpenStep', () => {
  it('true when only target is still in progress', () => {
    const stageLogs = [
      log({ id: 1, status: 'completed', stage_order: 0 }),
      log({ id: 2, status: 'in_progress', stage_order: 1 }),
    ];
    expect(isLastOpenStep(stageLogs[1], stageLogs)).toBe(true);
  });

  it('false when another step is still open', () => {
    const stageLogs = [
      log({ id: 1, status: 'pending', stage_order: 0 }),
      log({ id: 2, status: 'in_progress', stage_order: 1 }),
    ];
    expect(isLastOpenStep(stageLogs[1], stageLogs)).toBe(false);
  });
});
