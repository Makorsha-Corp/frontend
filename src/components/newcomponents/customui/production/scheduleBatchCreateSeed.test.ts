import { describe, expect, it } from 'vitest';
import {
  buildStageDraftDefaults,
  plannedStartLocalAtEight,
  resolveDefaultStageLineId,
} from '@/components/newcomponents/customui/production/scheduleBatchCreateSeed';

describe('scheduleBatchCreateSeed', () => {
  const stages = [
    {
      id: 10,
      stage_order: 1,
      route_step_id: 100,
      production_line_id: 5,
      expected_duration_minutes: 60,
      machine_id: 1,
    },
    {
      id: 11,
      stage_order: 2,
      route_step_id: 101,
      production_line_id: 6,
      expected_duration_minutes: 30,
      machine_id: 2,
    },
  ];
  const routeSteps = [
    { id: 100, step_order: 1, production_line_id: 7 },
    { id: 101, step_order: 2, production_line_id: 8 },
  ];

  it('uses route step lines per stage', () => {
    const drafts = buildStageDraftDefaults(stages, routeSteps);
    expect(drafts[10].lineId).toBe('7');
    expect(drafts[11].lineId).toBe('8');
  });

  it('resolveDefaultStageLineId uses route step then stage line', () => {
    expect(resolveDefaultStageLineId(stages[0], routeSteps)).toBe(7);
    expect(resolveDefaultStageLineId(stages[1], routeSteps)).toBe(8);
    expect(resolveDefaultStageLineId(stages[0], [])).toBe(5);
  });

  it('plannedStartLocalAtEight uses local 08:00 on that day', () => {
    const day = new Date(2026, 9, 21, 15, 30, 0);
    expect(plannedStartLocalAtEight(day)).toBe('2026-10-21T08:00');
  });
});
