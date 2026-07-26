import { describe, expect, it } from 'vitest';

import type { WorkOrder } from '@/types/workOrder';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';

import {
  buildRecurrenceProgramSummary,
  buildProgramSummariesByWorkOrderId,
  buildRecurringProgramList,
} from './workOrderRecurrenceProgram';

function order(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 1,
    workspace_id: 1,
    work_order_number: 'WO-2026-001',
    work_order_type_id: 1,
    work_order_type_name: 'Maintenance',
    title: 'Test',
    description: null,
    priority: 'MEDIUM',
    status: 'DRAFT',
    factory_id: 1,
    machine_id: 5,
    project_component_id: null,
    work_order_template_id: 12,
    planned_date: '2026-08-02',
    end_date: null,
    uses_inventory: false,
    cost: null,
    account_id: null,
    invoice_id: null,
    assigned_to: null,
    required_approvals: null,
    approved_by: null,
    approved_at: null,
    started_by: null,
    started_at: null,
    completed_by: null,
    completed_at: null,
    void_note: null,
    voided_at: null,
    voided_by: null,
    completion_notes: null,
    created_at: '2026-07-20T10:00:00Z',
    created_by: 1,
    updated_at: null,
    updated_by: null,
    is_active: true,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    ...overrides,
  };
}

const template: WorkOrderTemplate = {
  id: 12,
  workspace_id: 1,
  template_name: 'Weekly lube',
  description: null,
  work_order_type_id: 1,
  work_order_type_name: 'Maintenance',
  priority: 'MEDIUM',
  assigned_to: null,
  uses_inventory: false,
  account_id: null,
  cost: null,
  requires_approval: false,
  notes: null,
  is_active: true,
  is_recurring: true,
  recurrence_type: 'weekly',
  recurrence_day: 0,
  next_generation_date: null,
  recurrence_start_date: null,
  recurrence_end_date: '2026-09-01',
  auto_generate: true,
  default_factory_section_id: null,
  default_machine_id: 5,
  created_by: 1,
  created_at: '2026-07-01T00:00:00Z',
  updated_by: null,
  updated_at: null,
};

describe('buildRecurrenceProgramSummary', () => {
  it('groups draft siblings by template and machine', () => {
    const current = order({ id: 1, planned_date: '2026-08-02' });
    const sibling = order({ id: 2, work_order_number: 'WO-2026-002', planned_date: '2026-08-09' });
    const summary = buildRecurrenceProgramSummary({
      currentOrder: current,
      allOrders: [current, sibling],
      templateById: new Map([[12, template]]),
      referenceDate: new Date('2026-07-26T12:00:00'),
    });

    expect(summary?.futureDraftCount).toBe(2);
    expect(summary?.futureDrafts.map((d) => d.plannedDate)).toEqual(['2026-08-02', '2026-08-09']);
    expect(summary?.futureDrafts[0]?.isCurrentRow).toBe(true);
  });

  it('returns null for one-off templates', () => {
    const current = order();
    const summary = buildRecurrenceProgramSummary({
      currentOrder: current,
      allOrders: [current],
      templateById: new Map([[12, { ...template, is_recurring: false }]]),
    });
    expect(summary).toBeNull();
  });

  it('maps in-progress recurring rows to the same program group', () => {
    const active = order({ id: 3, status: 'IN_PROGRESS', planned_date: '2026-07-26' });
    const draft = order({ id: 2, planned_date: '2026-08-09' });
    const map = buildProgramSummariesByWorkOrderId({
      allOrders: [active, draft],
      templateById: new Map([[12, template]]),
      referenceDate: new Date('2026-07-26T12:00:00'),
    });

    expect(map.has(3)).toBe(true);
    expect(map.get(3)?.futureDraftCount).toBe(1);
    expect(map.get(3)?.futureDrafts[0]?.plannedDate).toBe('2026-08-09');
    expect(map.get(3)?.inProgressOccurrences[0]?.plannedDate).toBe('2026-07-26');
  });

  it('includes completed dates in the program summary', () => {
    const completed = order({
      id: 4,
      status: 'COMPLETED',
      planned_date: '2026-07-19',
      completed_at: '2026-07-20T14:30:00Z',
    });
    const draft = order({ id: 2, planned_date: '2026-08-09' });
    const summary = buildRecurrenceProgramSummary({
      currentOrder: draft,
      allOrders: [completed, draft],
      templateById: new Map([[12, template]]),
      referenceDate: new Date('2026-07-26T12:00:00'),
    });

    expect(summary?.completedOccurrences).toHaveLength(1);
    expect(summary?.completedOccurrences[0]?.displayDate).toBe('2026-07-20');
  });
});

describe('buildRecurringProgramList', () => {
  it('returns one row per template and machine group', () => {
    const draftA = order({ id: 1, machine_id: 5, planned_date: '2026-08-02' });
    const draftB = order({
      id: 2,
      machine_id: 6,
      work_order_template_id: 12,
      planned_date: '2026-08-09',
    });
    const list = buildRecurringProgramList({
      orders: [draftA, draftB],
      templates: [template],
      machineNameById: new Map([
        [5, 'Loom 3'],
        [6, 'Loom 4'],
      ]),
    });

    expect(list).toHaveLength(2);
    expect(list.map((item) => item.machineName).sort()).toEqual(['Loom 3', 'Loom 4']);
  });

  it('filters programs by machine scope', () => {
    const draftA = order({ id: 1, machine_id: 5 });
    const draftB = order({ id: 2, machine_id: 99, planned_date: '2026-08-09' });
    const list = buildRecurringProgramList({
      orders: [draftA, draftB],
      templates: [template],
      machineNameById: new Map([[5, 'Loom 3']]),
      machineIdsInScope: new Set([5]),
    });

    expect(list).toHaveLength(1);
    expect(list[0]?.machineId).toBe(5);
  });

  it('returns empty when no recurring templates exist', () => {
    const list = buildRecurringProgramList({
      orders: [order()],
      templates: [{ ...template, is_recurring: false }],
      machineNameById: new Map([[5, 'Loom 3']]),
    });
    expect(list).toHaveLength(0);
  });
});
