import { describe, expect, it } from 'vitest';

import { countLinesWithoutMachines, productionLineHasMachines } from './productionLineMachines';
import type { ProductionLine } from '@/types/production';

function line(partial: Partial<ProductionLine>): ProductionLine {
  return {
    id: 1,
    workspace_id: 1,
    factory_id: 1,
    machine_id: null,
    name: 'Line',
    description: null,
    is_active: true,
    created_by: null,
    updated_by: null,
    ...partial,
  };
}

describe('productionLineHasMachines', () => {
  it('is false when no machines are linked', () => {
    expect(productionLineHasMachines(line({}))).toBe(false);
  });

  it('is true when machines briefs exist', () => {
    expect(
      productionLineHasMachines(
        line({ machines: [{ id: 1, name: 'M1', is_running: false }] }),
      ),
    ).toBe(true);
  });

  it('counts lines without machines', () => {
    const lines = [
      line({ id: 1, machines: [{ id: 1, name: 'M', is_running: false }] }),
      line({ id: 2 }),
    ];
    expect(countLinesWithoutMachines(lines)).toBe(1);
  });
});
