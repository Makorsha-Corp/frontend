import { describe, expect, it } from 'vitest';

import type { ProductionBatchEvent } from '@/types/production';

import {
  batchEventMatchesFilter,
  countBatchEventsForFilter,
  filterBatchEvents,
} from './batchEventLogFilters';

function event(event_type: string): ProductionBatchEvent {
  return {
    id: 1,
    workspace_id: 1,
    batch_id: 1,
    batch_stage_log_id: null,
    event_type,
    description: 'test',
    metadata: null,
    performed_by: null,
    user_name: null,
    created_at: '2026-01-01T00:00:00Z',
  };
}

describe('batchEventLogFilters', () => {
  const events = [
    event('batch_started'),
    event('step_finished'),
    event('item_actual_changed'),
    event('condition_actual_changed'),
    event('shift_changed'),
  ];

  it('returns all events for all filter', () => {
    expect(filterBatchEvents(events, 'all')).toHaveLength(5);
  });

  it('filters by category', () => {
    expect(filterBatchEvents(events, 'lifecycle').map((e) => e.event_type)).toEqual(['batch_started']);
    expect(filterBatchEvents(events, 'steps').map((e) => e.event_type)).toEqual(['step_finished']);
    expect(filterBatchEvents(events, 'materials').map((e) => e.event_type)).toEqual([
      'item_actual_changed',
    ]);
    expect(filterBatchEvents(events, 'conditions').map((e) => e.event_type)).toEqual([
      'condition_actual_changed',
    ]);
    expect(filterBatchEvents(events, 'planning').map((e) => e.event_type)).toEqual(['shift_changed']);
  });

  it('counts per filter', () => {
    expect(countBatchEventsForFilter(events, 'materials')).toBe(1);
    expect(countBatchEventsForFilter(events, 'all')).toBe(5);
  });

  it('unknown types only show under all', () => {
    const custom = event('custom_future_type');
    expect(batchEventMatchesFilter(custom, 'steps')).toBe(false);
    expect(batchEventMatchesFilter(custom, 'all')).toBe(true);
  });
});
