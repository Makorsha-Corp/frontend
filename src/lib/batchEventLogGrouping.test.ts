import { describe, expect, it } from 'vitest';

import type { ProductionBatchEvent } from '@/types/production';

import {
  BATCH_EVENT_STEP_UPDATE_SESSION_MS,
  buildBatchEventGroupTitle,
  buildBatchEventTimeline,
  clusterStepUpdateSessions,
} from './batchEventLogGrouping';

function ev(
  partial: Partial<ProductionBatchEvent> & Pick<ProductionBatchEvent, 'id' | 'event_type' | 'created_at'>,
): ProductionBatchEvent {
  return {
    workspace_id: 1,
    batch_id: 1,
    batch_stage_log_id: null,
    description: 'x',
    metadata: null,
    performed_by: 1,
    user_name: 'U',
    ...partial,
  };
}

describe('clusterStepUpdateSessions', () => {
  it('merges transitive chain within window', () => {
    const events = [
      ev({ id: 1, event_type: 'item_actual_changed', batch_stage_log_id: 9, created_at: '2026-10-05T12:00:00Z' }),
      ev({ id: 2, event_type: 'condition_actual_changed', batch_stage_log_id: 9, created_at: '2026-10-05T12:09:00Z' }),
      ev({ id: 3, event_type: 'item_actual_changed', batch_stage_log_id: 9, created_at: '2026-10-05T12:18:00Z' }),
    ];
    const sessions = clusterStepUpdateSessions(events);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toHaveLength(3);
  });

  it('splits when gap exceeds window', () => {
    const events = [
      ev({ id: 1, event_type: 'item_actual_changed', batch_stage_log_id: 9, created_at: '2026-10-05T12:00:00Z' }),
      ev({ id: 2, event_type: 'item_actual_changed', batch_stage_log_id: 9, created_at: '2026-10-05T12:15:00Z' }),
    ];
    expect(clusterStepUpdateSessions(events)).toHaveLength(2);
  });
});

describe('buildBatchEventTimeline', () => {
  it('groups non-adjacent feed order when same session', () => {
    const t0 = '2026-10-05T12:00:00Z';
    const t1 = '2026-10-05T12:01:00Z';
    const events = [
      ev({ id: 10, event_type: 'step_started', batch_stage_log_id: 9, created_at: '2026-10-05T12:00:30Z' }),
      ev({
        id: 2,
        event_type: 'condition_actual_changed',
        batch_stage_log_id: 9,
        created_at: t0,
        metadata: { stage_name: 'Carding' },
      }),
      ev({
        id: 1,
        event_type: 'item_actual_changed',
        batch_stage_log_id: 9,
        created_at: t1,
        metadata: { stage_name: 'Carding' },
      }),
    ];
    const units = buildBatchEventTimeline(events, 'all');
    const groups = units.filter((u) => u.kind === 'group');
    expect(groups).toHaveLength(1);
    expect(units.some((u) => u.kind === 'single' && u.event.event_type === 'step_started')).toBe(true);
  });

  it('single-event session stays single row', () => {
    const events = [
      ev({
        id: 1,
        event_type: 'item_actual_changed',
        batch_stage_log_id: 9,
        created_at: '2026-10-05T12:00:00Z',
      }),
    ];
    const units = buildBatchEventTimeline(events, 'all');
    expect(units).toHaveLength(1);
    expect(units[0].kind).toBe('single');
  });

  it('includes full session when filter matches one member', () => {
    const t0 = '2026-10-05T12:00:00Z';
    const t1 = '2026-10-05T12:01:00Z';
    const events = [
      ev({ id: 1, event_type: 'item_actual_changed', batch_stage_log_id: 9, created_at: t0 }),
      ev({ id: 2, event_type: 'condition_actual_changed', batch_stage_log_id: 9, created_at: t1 }),
    ];
    const units = buildBatchEventTimeline(events, 'materials');
    expect(units).toHaveLength(1);
    expect(units[0].kind).toBe('group');
    if (units[0].kind === 'group') {
      expect(units[0].events).toHaveLength(2);
    }
  });

  it('does not merge different stage logs', () => {
    const t = '2026-10-05T12:00:00Z';
    const events = [
      ev({ id: 2, event_type: 'item_actual_changed', batch_stage_log_id: 2, created_at: t }),
      ev({ id: 1, event_type: 'item_actual_changed', batch_stage_log_id: 1, created_at: t }),
    ];
    expect(buildBatchEventTimeline(events, 'all')).toHaveLength(2);
  });

  it('uses 10 minute session constant', () => {
    expect(BATCH_EVENT_STEP_UPDATE_SESSION_MS).toBe(600_000);
  });

  it('titles a session as the line updated', () => {
    const title = buildBatchEventGroupTitle([
      ev({
        id: 1,
        event_type: 'condition_actual_changed',
        batch_stage_log_id: 9,
        created_at: '2026-10-05T12:00:00Z',
        metadata: { stage_name: 'Carding & Ring Spinning Line 1' },
      }),
    ]);
    expect(title).toBe('Carding & Ring Spinning Line 1 updated');
  });
});
