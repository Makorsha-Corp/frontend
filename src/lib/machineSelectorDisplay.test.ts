import { describe, expect, it } from 'vitest';
import type { Machine } from '@/types/machine';
import { formatMachineTileSubtext } from './machineSelectorDisplay';

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

describe('formatMachineTileSubtext', () => {
  it('shows floor label only without planned window', () => {
    expect(formatMachineTileSubtext(machine({ latest_status_type: 'IDLE' }))).toBe('Idle');
  });

  it('shows Available when idle and window free', () => {
    expect(
      formatMachineTileSubtext(machine({ latest_status_type: 'IDLE' }), { state: 'free' }, {
        hasPlannedWindow: true,
        windowIncludesNow: false,
      }),
    ).toBe('Available');
  });

  it('shows maintenance label when unavailable', () => {
    expect(
      formatMachineTileSubtext(machine({ latest_status_type: 'MAINTENANCE' }), { state: 'free' }, {
        hasPlannedWindow: true,
        windowIncludesNow: false,
      }),
    ).toBe('Maintenance');
  });
});
