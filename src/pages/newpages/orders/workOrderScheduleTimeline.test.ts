import { describe, expect, it } from 'vitest';

import type { WorkOrder, WorkOrderEvent } from '@/types/workOrder';

import { buildWorkOrderEventLogEntries } from './workOrderScheduleTimeline';

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
    status: 'COMPLETED',
    factory_id: 1,
    machine_id: 1,
    project_component_id: null,
    work_order_template_id: null,
    planned_date: '2026-07-23',
    end_date: null,
    calendar_date: '2026-07-23',
    uses_inventory: false,
    cost: null,
    account_id: null,
    invoice_id: null,
    assigned_to: null,
    required_approvals: null,
    approved_by: null,
    approved_at: null,
    started_by: 1,
    started_at: '2026-07-21T09:00:00Z',
    completed_by: 1,
    completed_at: '2026-07-25T17:00:00Z',
    void_note: null,
    voided_at: null,
    voided_by: null,
    completion_notes: null,
    created_at: '2026-07-20T10:00:00Z',
    created_by: 1,
    updated_at: '2026-07-25T17:00:00Z',
    updated_by: 1,
    is_active: true,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    ...overrides,
  };
}

function event(overrides: Partial<WorkOrderEvent>): WorkOrderEvent {
  return {
    id: 1,
    workspace_id: 1,
    work_order_id: 1,
    event_type: 'started',
    description: 'Work started',
    metadata: null,
    performed_by: 1,
    user_name: 'Test User',
    created_at: '2026-07-21T09:00:00Z',
    ...overrides,
  };
}

describe('buildWorkOrderEventLogEntries', () => {
  it('injects synthetic scheduled event when legacy work order has planned date only', () => {
    const entries = buildWorkOrderEventLogEntries(
      order(),
      [event({ id: 2, event_type: 'completed', description: 'Done', created_at: '2026-07-25T17:00:00Z' })],
      { showUpdateEvents: false },
    );
    expect(entries.some((e) => e.event_type === 'scheduled')).toBe(true);
    const scheduled = entries.find((e) => e.event_type === 'scheduled');
    expect(scheduled?.description).toContain('Planned for Jul 23, 2026');
    expect(scheduled?.scheduleDetails).toEqual([]);
  });

  it('adds schedule details on started and completed rows', () => {
    const entries = buildWorkOrderEventLogEntries(
      order(),
      [
        event({ id: 2, event_type: 'started', description: 'Work started — no inventory' }),
        event({ id: 3, event_type: 'completed', description: 'Marked complete', created_at: '2026-07-25T17:00:00Z' }),
      ],
      { showUpdateEvents: false },
    );
    const started = entries.find((e) => e.event_type === 'started');
    const completed = entries.find((e) => e.event_type === 'completed');
    expect(started?.scheduleDetails).toHaveLength(1);
    expect(started?.scheduleDetails[0]).toMatch(/Actual start:.*early/);
    expect(completed?.scheduleDetails[0]).toMatch(/Completed:.*late/);
  });

  it('shows retrospective note for complete-as-planned lifecycle events', () => {
    const entries = buildWorkOrderEventLogEntries(
      order({
        started_at: '2026-07-23T12:00:00Z',
        completed_at: '2026-07-23T12:00:00Z',
      }),
      [
        event({
          id: 2,
          event_type: 'started',
          metadata: { completion_mode: 'complete_as_planned', variance_label: 'On plan' },
        }),
        event({
          id: 3,
          event_type: 'completed',
          description: 'Marked complete',
          created_at: '2026-07-23T12:00:00Z',
          metadata: { completion_mode: 'complete_as_planned', variance_label: 'On plan' },
        }),
      ],
      { showUpdateEvents: false },
    );
    const started = entries.find((e) => e.event_type === 'started');
    const completed = entries.find((e) => e.event_type === 'completed');
    expect(started?.scheduleDetails).toEqual(['Logged retrospectively on planned date']);
    expect(completed?.scheduleDetails).toEqual(['Logged retrospectively on planned date']);
  });

  it('promotes planned date changes from hidden updated events', () => {
    const entries = buildWorkOrderEventLogEntries(
      order(),
      [
        event({
          id: 10,
          event_type: 'updated',
          description: 'Order details updated',
          created_at: '2026-07-22T12:00:00Z',
          metadata: {
            changes: [
              {
                field: 'planned_date',
                label: 'Planned date',
                from_value: '2026-07-08',
                to_value: '2026-07-23',
              },
            ],
          },
        }),
      ],
      { showUpdateEvents: false },
    );
    expect(entries.some((e) => e.event_type === 'schedule_updated')).toBe(true);
    expect(entries.some((e) => e.event_type === 'updated')).toBe(false);
    expect(entries.find((e) => e.event_type === 'schedule_updated')?.scheduleDetails[0]).toContain('2026-07-08');
  });
});
