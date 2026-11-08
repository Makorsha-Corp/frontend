import { describe, expect, it } from 'vitest';
import { prepareBatchConditionSave } from './batchStageConditionSave';

describe('prepareBatchConditionSave', () => {
  it('rejects empty planned', () => {
    const result = prepareBatchConditionSave({
      field: 'planned_value',
      batchParam: null,
      sourceParameterId: 1,
      raw: '   ',
      persistedPlanned: '10',
    });
    expect(result).toEqual({ ok: false, errorMessage: 'Expected value is required' });
  });

  it('noops unchanged planned', () => {
    const result = prepareBatchConditionSave({
      field: 'planned_value',
      batchParam: null,
      sourceParameterId: 1,
      raw: '10',
      persistedPlanned: '10',
    });
    expect(result).toEqual({ ok: false, noop: true });
  });

  it('builds planned patch', () => {
    const result = prepareBatchConditionSave({
      field: 'planned_value',
      batchParam: null,
      sourceParameterId: 1,
      raw: '12',
      persistedPlanned: '10',
    });
    expect(result).toEqual({ ok: true, patch: { planned_value: '12' } });
  });

  it('clears actual with empty string', () => {
    const result = prepareBatchConditionSave({
      field: 'actual_value',
      batchParam: { id: 1, actual_value: '5' } as never,
      sourceParameterId: null,
      raw: '',
    });
    expect(result).toEqual({ ok: true, patch: { actual_value: null } });
  });
});
