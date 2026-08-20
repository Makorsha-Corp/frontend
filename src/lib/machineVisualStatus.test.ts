import { describe, expect, it } from 'vitest';
import type { Machine } from '@/types/machine';
import {
  getMachineVisualKind,
  machineVisualKindFromEventType,
} from './machineVisualStatus';

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

describe('getMachineVisualKind', () => {
  it('maps maintenance, running, idle, and off', () => {
    expect(getMachineVisualKind(machine({ latest_status_type: 'MAINTENANCE' }))).toBe('maintenance');
    expect(getMachineVisualKind(machine({ is_running: true }))).toBe('running');
    expect(getMachineVisualKind(machine({ latest_status_type: 'IDLE' }))).toBe('idle');
    expect(getMachineVisualKind(machine({ latest_status_type: 'OFF' }))).toBe('off');
  });
});

describe('machineVisualKindFromEventType', () => {
  it('maps event types to visual kinds', () => {
    expect(machineVisualKindFromEventType('RUNNING')).toBe('running');
    expect(machineVisualKindFromEventType('MAINTENANCE')).toBe('maintenance');
    expect(machineVisualKindFromEventType('IDLE')).toBe('idle');
    expect(machineVisualKindFromEventType('OFF')).toBe('off');
  });
});
