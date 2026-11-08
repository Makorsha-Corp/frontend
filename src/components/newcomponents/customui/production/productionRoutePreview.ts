import type { RouteFlowStep } from '@/components/newcomponents/customui/production/RouteFlowPreview';

import type {

  ProductionFormulaStage,

  ProductionLine,

  ProductionRoute,

  ProductionRouteStep,

} from '@/types/production';



export type RouteLinkKind = 'selected' | 'available';



export function getRouteLinkKind(

  route: ProductionRoute,

  formulaRouteId: number | null | undefined,

): RouteLinkKind {

  if (formulaRouteId != null && formulaRouteId === route.id) return 'selected';

  return 'available';

}



export function routeLinkBadgeLabel(kind: RouteLinkKind): string {

  switch (kind) {

    case 'selected':

      return 'Selected';

    default:

      return 'Factory route';

  }

}



function stationLabelForFill(fill: ProductionRouteStep, lines: ProductionLine[]): string {

  const line = lines.find((row) => row.id === fill.production_line_id);

  return line?.name ?? fill.name;

}



function findFillForStage(

  stage: ProductionFormulaStage,

  fills: ProductionRouteStep[],

): ProductionRouteStep | undefined {

  return (

    fills.find((row) => row.id === stage.route_step_id) ??

    fills.find((row) => row.step_order === stage.stage_order)

  );

}



/** Preview steps for a route (picker + trigger): physical stations on the path. */

export function buildRoutePreviewSteps(params: {

  route: ProductionRoute;

  formulaId: number;

  stages: ProductionFormulaStage[];

  fills: ProductionRouteStep[];

  lines: ProductionLine[];

}): RouteFlowStep[] {

  void params.formulaId;

  void params.stages;

  const { fills, lines } = params;

  const sortedFills = [...fills].sort((a, b) => a.step_order - b.step_order || a.id - b.id);

  return sortedFills.map((fill) => {

    const unassigned = fill.production_line_id == null;

    return {

      id: fill.id,

      name: unassigned ? fill.name : stationLabelForFill(fill, lines),

      unassigned,

    };

  });

}



export function formatRouteStepSummaryLine(steps: RouteFlowStep[], maxVisible = 4): string {

  if (steps.length === 0) return 'No steps yet';

  const names = steps.map((s) => s.name);

  if (names.length <= maxVisible) return names.join(' → ');

  const head = names.slice(0, maxVisible).join(' → ');

  return `${head} → …`;

}



export function routeStepMetaLine(steps: RouteFlowStep[]): string {

  const unassigned = steps.filter((s) => s.unassigned).length;

  const count = steps.length;

  if (count === 0) return 'No steps';

  if (unassigned === 0) return `${count} step${count === 1 ? '' : 's'}`;

  return `${count} step${count === 1 ? '' : 's'} · ${unassigned} unassigned`;

}



/** Flow chips from route steps only (recipe private path). No legacy stage-name fallback. */
export function buildPathFlowFromRouteSteps(
  fills: ProductionRouteStep[],
  lines: ProductionLine[],
): RouteFlowStep[] {
  const sortedFills = [...fills].sort((a, b) => a.step_order - b.step_order || a.id - b.id);
  return sortedFills.map((fill) => {
    const unassigned = fill.production_line_id == null;
    return {
      id: fill.id,
      name: unassigned ? fill.name : stationLabelForFill(fill, lines),
      unassigned,
    };
  });
}

function machineLabelForStage(
  stage: ProductionFormulaStage,
  lines: ProductionLine[],
): string | null {
  if (stage.machine_id == null) return null;
  const line = lines.find((row) => row.id === stage.production_line_id);
  const machine = line?.machines?.find((m) => m.id === stage.machine_id);
  return machine?.name ?? null;
}

/** Route flow chips with optional pinned machine suffix from linked formula stages. */
export function buildPathFlowFromRouteStepsWithStages(
  fills: ProductionRouteStep[],
  lines: ProductionLine[],
  stages: ProductionFormulaStage[],
): RouteFlowStep[] {
  const stageByRouteStepId = new Map<number, ProductionFormulaStage>();
  for (const stage of stages) {
    if (stage.route_step_id != null) {
      stageByRouteStepId.set(stage.route_step_id, stage);
    }
  }
  return buildPathFlowFromRouteSteps(fills, lines).map((step) => {
    const stage = stageByRouteStepId.get(step.id);
    if (!stage) return step;
    const machineName = machineLabelForStage(stage, lines);
    if (!machineName) return step;
    return { ...step, name: `${step.name} · ${machineName}` };
  });
}

/** Workspace flow: recipe stage names with station assignment from route steps by order. */

export function buildWorkspaceFlowSteps(

  stages: ProductionFormulaStage[],

  fills: ProductionRouteStep[],

  lines: ProductionLine[],

): RouteFlowStep[] {

  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  return sortedStages.map((stage) => {

    const fill = findFillForStage(stage, fills);

    const unassigned = !fill || fill.production_line_id == null;

    return {

      id: stage.id,

      name: unassigned ? stage.name : stationLabelForFill(fill, lines),

      unassigned,

    };

  });

}


