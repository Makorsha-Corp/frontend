import { describe, expect, it } from 'vitest';

import {

  buildPathFlowFromRouteStepsWithStages,

  buildRoutePreviewSteps,

  buildWorkspaceFlowSteps,

  formatRouteStepSummaryLine,

  getRouteLinkKind,

} from '@/components/newcomponents/customui/production/productionRoutePreview';

import type { ProductionRoute } from '@/types/production';



describe('productionRoutePreview', () => {

  it('getRouteLinkKind uses formula.route_id', () => {

    expect(getRouteLinkKind({ id: 5 } as ProductionRoute, 5)).toBe('selected');

    expect(getRouteLinkKind({ id: 5 } as ProductionRoute, 3)).toBe('available');

    expect(getRouteLinkKind({ id: 5 } as ProductionRoute, null)).toBe('available');

  });



  it('buildRoutePreviewSteps lists route steps by order', () => {

    const steps = buildRoutePreviewSteps({

      route: { id: 1, name: 'R' } as ProductionRoute,

      formulaId: 10,

      stages: [],

      fills: [

        { id: 1, step_order: 1, production_line_id: 9, name: 'Fill' },

        { id: 2, step_order: 2, production_line_id: null, name: 'Open' },

      ] as never,

      lines: [{ id: 9, name: 'Line 1', machines: [] }] as never,

    });

    expect(steps).toHaveLength(2);

    expect(steps[0].name).toBe('Line 1');

    expect(steps[1].unassigned).toBe(true);

  });



  it('buildWorkspaceFlowSteps matches fills by step_order', () => {

    const steps = buildWorkspaceFlowSteps(

      [

        { id: 100, stage_order: 1, name: 'Stage A' },

        { id: 101, stage_order: 2, name: 'Stage B' },

      ] as never,

      [{ id: 1, step_order: 1, production_line_id: 9, name: 'Fill' }] as never,

      [{ id: 9, name: 'Line 1', machines: [] }] as never,

    );

    expect(steps[0].name).toBe('Line 1');

    expect(steps[1].name).toBe('Stage B');

    expect(steps[1].unassigned).toBe(true);

  });



  it('buildPathFlowFromRouteStepsWithStages appends pinned machine to chip label', () => {
    const steps = buildPathFlowFromRouteStepsWithStages(
      [{ id: 1, step_order: 1, production_line_id: 9, name: 'Fill' }] as never,
      [{ id: 9, name: 'Line 1', machines: [{ id: 42, name: 'M-1' }] }] as never,
      [{ id: 100, route_step_id: 1, production_line_id: 9, machine_id: 42 }] as never,
    );
    expect(steps[0].name).toBe('Line 1 · M-1');
  });

  it('formatRouteStepSummaryLine truncates long paths', () => {

    const line = formatRouteStepSummaryLine(

      [

        { id: 1, name: 'A' },

        { id: 2, name: 'B' },

        { id: 3, name: 'C' },

        { id: 4, name: 'D' },

        { id: 5, name: 'E' },

      ],

      4,

    );

    expect(line).toBe('A → B → C → D → …');

  });

});

