import { describe, expect, it } from 'vitest';
import {
  estimatedRecipeDurationMinutes,
  finishedGoodOutputQuantity,
  lastFormulaStage,
} from './recipeDerivedMetrics';
import type { ProductionFormulaStage, ProductionFormulaStageItem } from '@/types/production';

const stages: ProductionFormulaStage[] = [
  {
    id: 1,
    workspace_id: 1,
    formula_id: 1,
    stage_order: 1,
    name: 'Spin',
    production_line_id: 1,
    machine_id: null,
    expected_duration_minutes: 30,
    expected_output_quantity: null,
    expected_output_item_id: null,
    notes: null,
  },
  {
    id: 2,
    workspace_id: 1,
    formula_id: 1,
    stage_order: 2,
    name: 'Pack',
    production_line_id: 2,
    machine_id: null,
    expected_duration_minutes: 15,
    expected_output_quantity: null,
    expected_output_item_id: null,
    notes: null,
  },
];

const stageItems: ProductionFormulaStageItem[] = [
  {
    id: 10,
    workspace_id: 1,
    formula_stage_id: 1,
    item_id: 100,
    item_role: 'output',
    quantity: 500,
    unit: 'kg',
    is_optional: false,
    tolerance_percentage: null,
  },
  {
    id: 11,
    workspace_id: 1,
    formula_stage_id: 2,
    item_id: 200,
    item_role: 'output',
    quantity: 1000,
    unit: 'kg',
    is_optional: false,
    tolerance_percentage: null,
  },
];

describe('recipeDerivedMetrics', () => {
  it('uses last step outputs only for finished good qty', () => {
    expect(lastFormulaStage(stages)?.id).toBe(2);
    expect(finishedGoodOutputQuantity(stages, stageItems)).toBe(1000);
  });

  it('sums step minutes for recipe duration', () => {
    expect(estimatedRecipeDurationMinutes(stages)).toBe(45);
  });
});
