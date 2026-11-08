import type {
  ProductionBatchStageParameter,
  UpdateProductionBatchStageParameterDTO,
} from '@/types/production';

export type BatchConditionField = 'planned_value' | 'actual_value';

export type SaveBatchConditionInput = {
  field: BatchConditionField;
  batchParam: ProductionBatchStageParameter | null;
  sourceParameterId: number | null;
  raw: string;
  /** Formula or batch baseline shown in Expected column before edit */
  persistedPlanned?: string;
};

export type ConditionSaveValidation =
  | { ok: true; patch: UpdateProductionBatchStageParameterDTO }
  | { ok: false; errorMessage?: string; noop?: boolean };

export function prepareBatchConditionSave(input: SaveBatchConditionInput): ConditionSaveValidation {
  const trimmed = input.raw.trim();

  if (input.field === 'planned_value') {
    if (!trimmed) {
      return { ok: false, errorMessage: 'Expected value is required' };
    }
    const current = (input.persistedPlanned ?? '').trim();
    if (trimmed === current) {
      return { ok: false, noop: true };
    }
    return { ok: true, patch: { planned_value: trimmed } };
  }

  const next = trimmed === '' ? null : trimmed;
  const currentRaw = input.batchParam?.actual_value;
  const current =
    currentRaw == null || (typeof currentRaw === 'string' && currentRaw.trim() === '')
      ? null
      : String(currentRaw).trim();
  if (next === current) {
    return { ok: false, noop: true };
  }
  return { ok: true, patch: { actual_value: next } };
}
