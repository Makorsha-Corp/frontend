import { describe, expect, it } from 'vitest';

import { resolveConditionPlannedDisplay } from '@/lib/productionStageMaterialsDisplay';

describe('resolveConditionPlannedDisplay', () => {
  it('uses planned_value when numeric', () => {
    expect(
      resolveConditionPlannedDisplay({
        planned_value: '350',
        planned_value_numeric: null,
        unit: '°C',
      }),
    ).toEqual({ planned: '350', unitSuffix: '°C' });
  });

  it('prefers planned_value_numeric', () => {
    expect(
      resolveConditionPlannedDisplay({
        planned_value: 'kg',
        planned_value_numeric: 1,
        unit: '1',
      }),
    ).toEqual({ planned: '1', unitSuffix: 'kg' });
  });

  it('fixes legacy swap when planned holds unit and unit holds number', () => {
    expect(
      resolveConditionPlannedDisplay({
        planned_value: 'rotations',
        planned_value_numeric: null,
        unit: '2',
      }),
    ).toEqual({ planned: '2', unitSuffix: 'rotations' });
  });
});
