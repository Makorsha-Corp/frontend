/** Prefill for Add batch from the schedule day popup (date only; recipe supplies lines). */
export type ScheduleBatchCreateSeed = {
  /** Local calendar day (time part ignored for default clock). */
  day: Date;
};

/** Default planned start: local calendar day at 08:00 for datetime-local inputs. */
export function plannedStartLocalAtEight(day: Date): string {
  const copy = new Date(day);
  copy.setHours(8, 0, 0, 0);
  const y = copy.getFullYear();
  const m = String(copy.getMonth() + 1).padStart(2, '0');
  const d = String(copy.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T08:00`;
}

export type StageDraftDefaults = {
  include: boolean;
  lineId: string;
  minutes: string;
  machineId: string;
};

type FormulaStageLike = {
  id: number;
  stage_order: number;
  route_step_id?: number | null;
  production_line_id?: number | null;
  expected_duration_minutes?: number | null;
  machine_id?: number | null;
};

type RouteStepLike = {
  id: number;
  step_order: number;
  production_line_id?: number | null;
};

export function resolveDefaultStageLineId(
  stage: FormulaStageLike,
  routeSteps: RouteStepLike[],
): number | null {
  const step =
    routeSteps.find((row) => row.id === stage.route_step_id) ??
    routeSteps.find((row) => row.step_order === stage.stage_order);
  return step?.production_line_id ?? stage.production_line_id ?? null;
}

export function buildStageDraftDefaults(
  formulaStages: FormulaStageLike[],
  routeSteps: RouteStepLike[],
): Record<number, StageDraftDefaults> {
  const next: Record<number, StageDraftDefaults> = {};
  for (const stage of formulaStages) {
    const defaultLine = resolveDefaultStageLineId(stage, routeSteps);
    next[stage.id] = {
      include: true,
      lineId: defaultLine != null ? String(defaultLine) : '',
      minutes: stage.expected_duration_minutes != null ? String(stage.expected_duration_minutes) : '',
      machineId: stage.machine_id != null ? String(stage.machine_id) : '',
    };
  }
  return next;
}
