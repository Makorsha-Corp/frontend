import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useGetAllFormulaStageItemsQuery,
  useGetAllFormulaStageParametersQuery,
  useGetFormulaStagesQuery,
  useGetProductionRouteStepsQuery,
} from '@/features/production/productionApi';
import { formatProductionQuantity } from '@/lib/productionQuantity';
import {
  estimatedRecipeDurationMinutes,
  finishedGoodOutputItemIds,
  finishedGoodOutputQuantity,
} from '@/lib/recipeDerivedMetrics';
import {
  buildStageMaterialDisplayRows,
  formatStageParameterPlanned,
  stageHasMaterialsOrConditions,
} from '@/lib/productionStageMaterialsDisplay';
import type {
  ProductionFormula,
  ProductionFormulaStage,
  ProductionFormulaStageItem,
  ProductionLine,
  ProductionRouteStep,
} from '@/types/production';

function resolveStageLineId(
  stage: ProductionFormulaStage,
  routeSteps: ProductionRouteStep[],
): number | null {
  const step =
    routeSteps.find((row) => row.id === stage.route_step_id) ??
    routeSteps.find((row) => row.step_order === stage.stage_order);
  return step?.production_line_id ?? stage.production_line_id ?? null;
}

function lineLabel(lineId: number | null, lines: ProductionLine[]): string {
  if (lineId == null) return '—';
  return lines.find((l) => l.id === lineId)?.name ?? `Line #${lineId}`;
}

function machineLabel(stage: ProductionFormulaStage, line: ProductionLine | undefined): string | null {
  if (stage.machine_id == null) return null;
  const fromLine = line?.machines?.find((m) => m.id === stage.machine_id);
  return fromLine?.name ?? `Machine #${stage.machine_id}`;
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

interface RecipePickerPreviewProps {
  formula: ProductionFormula;
  lines: ProductionLine[];
  itemNameById: Map<number, string>;
}

const RecipePickerPreview: React.FC<RecipePickerPreviewProps> = ({ formula, lines, itemNameById }) => {
  const { data: stagesRaw, isLoading: loadingStages, isFetching: fetchingStages } =
    useGetFormulaStagesQuery(formula.id);
  const { data: stageItemsRaw, isLoading: loadingStageItems, isFetching: fetchingStageItems } =
    useGetAllFormulaStageItemsQuery(formula.id);
  const { data: stageParametersRaw, isLoading: loadingStageParams, isFetching: fetchingStageParams } =
    useGetAllFormulaStageParametersQuery(formula.id);
  const routeId = formula.route_id ?? 0;
  const {
    data: routeStepsRaw,
    isLoading: loadingRouteSteps,
    isFetching: fetchingRouteSteps,
  } = useGetProductionRouteStepsQuery(routeId, {
    skip: !formula.route_id,
  });

  const stages = stagesRaw ?? [];
  const stageItems = stageItemsRaw ?? [];
  const stageParameters = stageParametersRaw ?? [];
  const routeSteps = routeStepsRaw ?? [];

  const loadingPath =
    loadingStages ||
    fetchingStages ||
    loadingStageItems ||
    fetchingStageItems ||
    loadingStageParams ||
    fetchingStageParams ||
    (formula.route_id != null && (loadingRouteSteps || fetchingRouteSteps));

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.stage_order - b.stage_order),
    [stages],
  );

  const sortedRouteSteps = useMemo(
    () => [...routeSteps].sort((a, b) => a.step_order - b.step_order),
    [routeSteps],
  );

  const defaultOutput = useMemo(
    () => finishedGoodOutputQuantity(sortedStages, stageItems),
    [sortedStages, stageItems],
  );

  const outputNames = useMemo(
    () =>
      finishedGoodOutputItemIds(sortedStages, stageItems).map((id) => ({
        id,
        name: itemNameById.get(id) ?? `Item #${id}`,
      })),
    [sortedStages, stageItems, itemNameById],
  );

  const estDurationMinutes = useMemo(
    () => estimatedRecipeDurationMinutes(sortedStages),
    [sortedStages],
  );

  const renderMaterialRow = (row: ProductionFormulaStageItem) => (
    <li key={row.id} className="flex justify-between gap-2">
      <span className="truncate text-muted-foreground">
        {roleLabel(row.item_role)} · {itemNameById.get(row.item_id) ?? `Item #${row.item_id}`}
      </span>
      <span className="shrink-0 tabular-nums">
        {formatProductionQuantity(Number(row.quantity))}
        {row.unit ? ` ${row.unit}` : ''}
      </span>
    </li>
  );

  return (
    <div className="space-y-4 pr-1">
      <div>
        <h3 className="text-base font-semibold leading-tight">{formula.name}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formula.formula_code} · v{formula.version}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Default output</dt>
          <dd className="tabular-nums">
            {Number(defaultOutput) > 0 ? formatProductionQuantity(Number(defaultOutput)) : '—'}
          </dd>
          {outputNames.length > 0 ? (
            <dd className="col-span-2 text-sm text-foreground">
              <ul className="space-y-0.5">
                {outputNames.map((row) => (
                  <li key={row.id}>{row.name}</li>
                ))}
              </ul>
            </dd>
          ) : null}
          <dt className="text-muted-foreground">Est. duration</dt>
          <dd className="tabular-nums">
            {estDurationMinutes != null ? `${estDurationMinutes} min` : '—'}
          </dd>
        </dl>
        {formula.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{formula.description}</p>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Path</p>
        {loadingPath ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-primary" aria-label="Loading path" />
          </div>
        ) : sortedStages.length === 0 && sortedRouteSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {formula.route_id == null
              ? 'No path on this recipe yet — add steps in Production Setup.'
              : 'This route has no steps yet — add them on Production Setup.'}
          </p>
        ) : sortedStages.length === 0 ? (
          <ol className="space-y-3">
            {sortedRouteSteps.map((step, index) => {
              const lineId = step.production_line_id ?? null;
              return (
                <li key={step.id} className="rounded-md border border-border px-3 py-2">
                  <p className="text-sm font-medium">
                    {index + 1}. {step.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lineLabel(lineId, lines)}
                    {!line && lineId == null ? ' · Line not assigned' : ''}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Step targets and materials are on Production Setup for this recipe.
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="space-y-3">
            {sortedStages.map((stage, index) => {
              const lineId = resolveStageLineId(stage, routeSteps);
              const line = lines.find((l) => l.id === lineId);
              const machine = machineLabel(stage, line);
              const displayRows = buildStageMaterialDisplayRows(stageItems, stageParameters, stage.id);
              const hasLines = stageHasMaterialsOrConditions(stageItems, stageParameters, stage.id);
              return (
                <li key={stage.id} className="rounded-md border border-border px-3 py-2">
                  <p className="text-sm font-medium">
                    {index + 1}. {stage.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lineLabel(lineId, lines)}
                    {machine ? ` · ${machine}` : ''}
                    {stage.expected_duration_minutes != null
                      ? ` · ${stage.expected_duration_minutes} min est.`
                      : ''}
                  </p>
                  {hasLines ? (
                    <ul className="mt-2 space-y-0.5 border-t border-border/60 pt-2 text-xs">
                      {displayRows.map((entry) =>
                        entry.kind === 'condition' ? (
                          <li key={`cond-${entry.row.id}`} className="flex justify-between gap-2">
                            <span className="truncate text-muted-foreground">
                              Condition · {entry.row.label}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {formatStageParameterPlanned(entry.row)}
                            </span>
                          </li>
                        ) : (
                          renderMaterialRow(entry.row)
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No materials on this step.</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};

export interface RecipePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formulas: ProductionFormula[];
  lines: ProductionLine[];
  items: { id: number; name: string }[];
  selectedFormulaId: number | null;
  onConfirm: (formulaId: number) => void;
}

const RecipePickerDialog: React.FC<RecipePickerDialogProps> = ({
  open,
  onOpenChange,
  formulas,
  lines,
  items,
  selectedFormulaId,
  onConfirm,
}) => {
  const [search, setSearch] = useState('');
  const [highlightId, setHighlightId] = useState<number | null>(selectedFormulaId);

  const itemNameById = useMemo(() => new Map(items.map((i) => [i.id, i.name])), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return formulas;
    return formulas.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.formula_code.toLowerCase().includes(q),
    );
  }, [formulas, search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    setHighlightId((prev) => {
      if (selectedFormulaId != null && formulas.some((f) => f.id === selectedFormulaId)) {
        return selectedFormulaId;
      }
      if (prev != null && filtered.some((f) => f.id === prev)) return prev;
      return filtered[0]?.id ?? null;
    });
  }, [open, selectedFormulaId, formulas, filtered]);

  const highlighted = highlightId != null ? formulas.find((f) => f.id === highlightId) ?? null : null;

  const confirm = () => {
    if (highlightId == null) return;
    onConfirm(highlightId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Choose recipe</DialogTitle>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-2">
            <div className="relative shrink-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 pl-8"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search recipes"
              />
            </div>
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto rounded-md border border-border p-1">
              {filtered.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">No recipes match.</li>
              ) : (
                filtered.map((f) => {
                  const active = f.id === highlightId;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        className={cn(
                          'w-full rounded-md px-2 py-2 text-left text-sm transition-colors',
                          active
                            ? 'bg-brand-primary/10 text-foreground ring-1 ring-brand-primary/40'
                            : 'hover:bg-muted/50',
                        )}
                        onClick={() => setHighlightId(f.id)}
                        onDoubleClick={confirm}
                      >
                        <span className="line-clamp-2 font-medium leading-snug">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{f.formula_code}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
          <div className="min-h-0 overflow-y-auto rounded-md border border-border bg-muted/10 p-3">
            {highlighted ? (
              <RecipePickerPreview
                formula={highlighted}
                lines={lines}
                itemNameById={itemNameById}
              />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Select a recipe to preview path and materials.
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={highlightId == null} onClick={confirm}>
            Use this recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipePickerDialog;
