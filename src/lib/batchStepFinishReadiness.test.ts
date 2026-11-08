import { describe, expect, it } from 'vitest';
import { getStepFinishReadiness } from './batchStepFinishReadiness';
import type { ProductionBatchStageLog } from '@/types/production';

const inProgressLog = {
  id: 1,
  status: 'in_progress',
  formula_stage_id: 10,
  stage_name: 'Embroidery',
} as ProductionBatchStageLog;

describe('getStepFinishReadiness', () => {
  it('blocks finish when material actuals are missing', () => {
    const result = getStepFinishReadiness({
      stageLog: inProgressLog,
      formulaStageItems: [
        {
          id: 100,
          formula_stage_id: 10,
          item_id: 5,
          item_role: 'output',
          quantity: 20,
          unit: 'kg',
        } as never,
      ],
      batchItems: [
        {
          id: 1,
          item_id: 5,
          item_role: 'output',
          expected_quantity: 20,
          actual_quantity: null,
        } as never,
      ],
      formulaStageParameters: [],
      stageParameters: [],
      getItemName: () => 'Yarn',
    });
    expect(result.ready).toBe(false);
    expect(result.missingMaterialLabels.some((l) => l.includes('Yarn'))).toBe(true);
  });

  it('blocks finish when a step row has expected qty but no actual', () => {
    const result = getStepFinishReadiness({
      stageLog: inProgressLog,
      formulaStageItems: [
        {
          id: 100,
          formula_stage_id: 10,
          item_id: 5,
          item_role: 'output',
          quantity: 20,
          unit: 'kg',
        } as never,
      ],
      batchItems: [
        {
          id: 1,
          item_id: 5,
          item_role: 'output',
          expected_quantity: 20,
          actual_quantity: null,
        } as never,
      ],
      stepItems: [
        {
          id: 9,
          batch_stage_log_id: 1,
          item_id: 5,
          item_role: 'output',
          expected_quantity: 20,
          actual_quantity: null,
        } as never,
      ],
      formulaStageParameters: [],
      stageParameters: [],
      getItemName: () => 'Yarn',
    });
    expect(result.ready).toBe(false);
    expect(result.missingMaterialLabels.some((l) => l.includes('Yarn'))).toBe(true);
  });

  it('allows finish when the step row actual is set', () => {
    const result = getStepFinishReadiness({
      stageLog: inProgressLog,
      formulaStageItems: [],
      batchItems: [],
      stepItems: [
        {
          id: 9,
          batch_stage_log_id: 1,
          item_id: 5,
          item_role: 'output',
          expected_quantity: 20,
          actual_quantity: 18,
        } as never,
      ],
      formulaStageParameters: [],
      stageParameters: [],
      getItemName: () => 'Yarn',
    });
    expect(result.ready).toBe(true);
  });

  it('allows finish when all actuals are set', () => {
    const result = getStepFinishReadiness({
      stageLog: inProgressLog,
      formulaStageItems: [
        {
          id: 100,
          formula_stage_id: 10,
          item_id: 5,
          item_role: 'output',
          quantity: 20,
          unit: null,
        } as never,
      ],
      batchItems: [
        {
          id: 1,
          item_id: 5,
          item_role: 'output',
          expected_quantity: 20,
          actual_quantity: 18,
        } as never,
      ],
      formulaStageParameters: [],
      stageParameters: [],
      getItemName: () => 'Yarn',
    });
    expect(result.ready).toBe(true);
  });
});
