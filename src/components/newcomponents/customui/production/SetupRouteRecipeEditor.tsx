import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProductionRecipePathBar, {
  productionRecipePathBarTitleClass,
} from '@/components/newcomponents/customui/production/ProductionRecipePathBar';
import { buildPathFlowFromRouteStepsWithStages } from '@/components/newcomponents/customui/production/productionRoutePreview';
import FormulaStageMaterialsBlock from '@/components/newcomponents/customui/production/FormulaStageMaterialsBlock';
import {
  useGetAllFormulaStageItemsQuery,
  useGetFormulaStagesQuery,
  useUpdateFormulaStageMutation,
  useUpdateProductionFormulaMutation,
} from '@/features/production/productionApi';
import type {
  ProductionFormula,
  ProductionLine,
  ProductionRoute,
  ProductionRouteStep,
} from '@/types/production';
import { cn } from '@/lib/utils';
import { appToast } from '@/lib/appToast';
import { Loader2, Plus } from 'lucide-react';

export interface SetupRouteRecipeEditorProps {
  factoryId: number;
  routes: ProductionRoute[];
  loadingRoutes: boolean;
  selectedRouteId: number | null;
  onSelectRoute: (routeId: number) => void;
  onCreateRouteClick: () => void;
  steps: ProductionRouteStep[];
  lines: ProductionLine[];
  formulas: ProductionFormula[];
  loadingFormulas: boolean;
  formulasError: unknown;
  onAddRecipe: () => void;
  onEditRecipe: (formulaId: number) => void;
  items: { id: number; name: string; unit?: string }[];
  getItemName: (id: number) => string;
  onMoveStep: (index: number, direction: -1 | 1) => void;
  onDeleteStep: (stepId: number) => void;
  onAddStep: (payload: { production_line_id: number; machine_id: number | null }) => void | Promise<void>;
  onUpdateStep: (
    stepId: number,
    payload: { production_line_id: number; machine_id: number | null },
  ) => void | Promise<void>;
  addingStep: boolean;
  updatingStep: boolean;
}

const sectionTitleClass = productionRecipePathBarTitleClass;

const SetupRouteRecipeEditor: React.FC<SetupRouteRecipeEditorProps> = ({
  factoryId,
  routes,
  loadingRoutes,
  selectedRouteId,
  onSelectRoute,
  onCreateRouteClick,
  steps,
  lines,
  formulas,
  loadingFormulas,
  formulasError,
  onAddRecipe,
  onEditRecipe,
  items,
  getItemName,
  onMoveStep,
  onDeleteStep,
  onAddStep,
  onUpdateStep,
  addingStep,
  updatingStep,
}) => {
  const [selectedRouteStepId, setSelectedRouteStepId] = useState<number | null>(null);
  const [activeFormulaId, setActiveFormulaId] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [targetDrafts, setTargetDrafts] = useState<Record<number, { minutes: string }>>({});

  const formulasOnRoute = useMemo(
    () => (selectedRouteId == null ? [] : formulas.filter((f) => f.route_id === selectedRouteId)),
    [formulas, selectedRouteId],
  );

  useEffect(() => {
    if (selectedRouteId == null) {
      setActiveFormulaId(null);
      return;
    }
    setActiveFormulaId((prev) => {
      if (prev != null && formulasOnRoute.some((f) => f.id === prev)) return prev;
      return formulasOnRoute[0]?.id ?? null;
    });
  }, [selectedRouteId, formulasOnRoute]);

  const activeFormula = useMemo(
    () => formulasOnRoute.find((f) => f.id === activeFormulaId) ?? null,
    [formulasOnRoute, activeFormulaId],
  );

  const formulaId = activeFormula?.id ?? 0;

  const { data: formulaStagesRaw = [], isLoading: loadingStages } = useGetFormulaStagesQuery(formulaId, {
    skip: !activeFormula,
  });
  const formulaStages = useMemo(
    () => [...formulaStagesRaw].sort((a, b) => a.stage_order - b.stage_order),
    [formulaStagesRaw],
  );

  const { data: allStageItems = [], isLoading: loadingStageItems } = useGetAllFormulaStageItemsQuery(formulaId, {
    skip: !activeFormula,
  });

  const [updateFormulaStage] = useUpdateFormulaStageMutation();
  const [updateFormula, { isLoading: savingMeta }] = useUpdateProductionFormulaMutation();

  useEffect(() => {
    if (!activeFormula) {
      setNameDraft('');
      return;
    }
    setNameDraft(activeFormula.name);
  }, [activeFormula?.id, activeFormula?.name]);

  useEffect(() => {
    const next: Record<number, { minutes: string }> = {};
    for (const stage of formulaStages) {
      next[stage.id] = {
        minutes: stage.expected_duration_minutes != null ? String(stage.expected_duration_minutes) : '',
      };
    }
    setTargetDrafts(next);
  }, [formulaStages]);

  useEffect(() => {
    if (steps.length === 0) {
      setSelectedRouteStepId(null);
      return;
    }
    setSelectedRouteStepId((prev) => {
      if (prev != null && steps.some((s) => s.id === prev)) return prev;
      return steps[0].id;
    });
  }, [steps, selectedRouteId]);

  const selectedStage = useMemo(() => {
    if (selectedRouteStepId == null) return null;
    return (
      formulaStages.find((s) => s.route_step_id === selectedRouteStepId) ??
      formulaStages[steps.findIndex((s) => s.id === selectedRouteStepId)] ??
      null
    );
  }, [formulaStages, selectedRouteStepId, steps]);

  const selectedStageId = selectedStage?.id ?? null;

  const stageItemsForSelected = useMemo(
    () => (selectedStageId != null ? allStageItems.filter((row) => row.formula_stage_id === selectedStageId) : []),
    [allStageItems, selectedStageId],
  );

  const inputHandoff = useMemo(() => {
    if (selectedStageId == null) {
      return { requiresPreviousOutputs: false, previousOutputCount: 0 };
    }
    const stageIndex = formulaStages.findIndex((stage) => stage.id === selectedStageId);
    const previousStage = stageIndex > 0 ? formulaStages[stageIndex - 1] : null;
    const previousOutputCount = previousStage
      ? allStageItems.filter(
          (row) => row.formula_stage_id === previousStage.id && row.item_role === 'output',
        ).length
      : 0;
    return {
      requiresPreviousOutputs: stageIndex > 0,
      previousOutputCount,
    };
  }, [allStageItems, formulaStages, selectedStageId]);

  const sortedRouteSteps = useMemo(
    () => [...steps].sort((a, b) => a.step_order - b.step_order || a.id - b.id),
    [steps],
  );

  const pathFlowSteps = useMemo(
    () => buildPathFlowFromRouteStepsWithStages(steps, lines, formulaStages),
    [steps, lines, formulaStages],
  );

  const saveRecipeMeta = async () => {
    if (!activeFormula) return;
    const name = nameDraft.trim();
    if (!name) {
      appToast.error('Recipe name is required');
      return;
    }
    if (name === activeFormula.name) return;
    try {
      await updateFormula({
        id: activeFormula.id,
        data: { name },
      }).unwrap();
      appToast.success('Recipe updated');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to update recipe');
    }
  };

  const routeSubtitle = (routeId: number) => {
    const onRoute = formulas.filter((f) => f.route_id === routeId);
    if (onRoute.length === 0) return 'No recipe yet';
    if (onRoute.length === 1) return onRoute[0].name;
    return `${onRoute.length} recipes`;
  };

  const renderStepTargetsPanel = () => {
    if (!activeFormula) return null;
    if (selectedRouteStepId == null) {
      return (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          Select a path step for step targets.
        </p>
      );
    }
    if (loadingStages || loadingStageItems) {
      return (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      );
    }
    if (!selectedStage || selectedStageId == null) {
      return (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          No BOM step for this line yet. Save the path and try again in a moment.
        </p>
      );
    }
    const draft = targetDrafts[selectedStage.id] ?? { minutes: '' };
    const stepOutputLines = stageItemsForSelected.filter((row) => row.item_role === 'output');
    return (
      <div className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
        <p className={sectionTitleClass}>Step targets</p>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Expected output (from materials)</p>
          {stepOutputLines.length > 0 ? (
            <ul className="list-inside list-disc space-y-0.5 text-sm text-foreground">
              {stepOutputLines.map((row) => {
                const unit = items.find((i) => i.id === row.item_id)?.unit;
                const label = getItemName(row.item_id);
                const name = unit ? `${label} (${unit})` : label;
                return (
                  <li key={row.id}>
                    {name} · {row.quantity}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor={`setup-stage-${selectedStage.id}-minutes`}>Expected minutes</Label>
            <Input
              id={`setup-stage-${selectedStage.id}-minutes`}
              value={draft.minutes}
              inputMode="numeric"
              placeholder="e.g. 45"
              onChange={(event) =>
                setTargetDrafts((prev) => ({
                  ...prev,
                  [selectedStage.id]: { ...draft, minutes: event.target.value },
                }))
              }
            />
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 sm:mb-0.5"
            onClick={async () => {
              try {
                await updateFormulaStage({
                  id: selectedStage.id,
                  formulaId,
                  data: {
                    expected_duration_minutes: draft.minutes.trim() ? parseInt(draft.minutes, 10) : null,
                  },
                }).unwrap();
                appToast.success('Step timing saved');
              } catch (error: unknown) {
                const detail = (error as { data?: { detail?: string } })?.data?.detail;
                appToast.error(detail || 'Failed to save timing');
              }
            }}
          >
            Save duration
          </Button>
        </div>
      </div>
    );
  };

  const renderStepMaterials = () => {
    if (!activeFormula) return null;
    if (selectedRouteStepId == null) {
      return (
        <p className="text-sm text-muted-foreground">Click a path step to edit materials.</p>
      );
    }
    if (loadingStages || loadingStageItems) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      );
    }
    if (!selectedStage || selectedStageId == null) {
      return (
        <p className="text-sm text-muted-foreground">
          No BOM step for this line yet. Save the path and try again in a moment.
        </p>
      );
    }
    return (
      <FormulaStageMaterialsBlock
        formulaId={formulaId}
        stageId={selectedStageId}
        stageItems={stageItemsForSelected}
        items={items}
        getItemName={getItemName}
        factoryId={factoryId}
        isLoading={loadingStageItems}
        inputHandoff={inputHandoff}
      />
    );
  };

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="w-[min(240px,38vw)] shrink-0 overflow-y-auto border-r border-border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className={sectionTitleClass}>Routes</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={onCreateRouteClick}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add route
          </Button>
        </div>
        {loadingRoutes ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          </div>
        ) : routes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No routes yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {routes.map((route) => {
              const selected = route.id === selectedRouteId;
              return (
                <Button
                  key={route.id}
                  type="button"
                  size="sm"
                  variant={selected ? 'default' : 'ghost'}
                  className={cn(
                    'h-auto flex-col items-start gap-0.5 py-2 text-left',
                    selected && 'bg-brand-primary hover:bg-brand-primary-hover',
                  )}
                  onClick={() => onSelectRoute(route.id)}
                >
                  <span className="w-full truncate">{route.name}</span>
                  <span
                    className={cn(
                      'w-full truncate text-[11px] font-normal',
                      selected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {routeSubtitle(route.id)}
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {!selectedRouteId ? (
            <p className="p-4 text-sm text-muted-foreground">Select or create a route to begin.</p>
          ) : (
            <>
              <ProductionRecipePathBar
                variant="section"
                flowSteps={pathFlowSteps}
                sortedRouteSteps={sortedRouteSteps}
                lines={lines}
                selectedStepId={selectedRouteStepId}
                onSelectStep={setSelectedRouteStepId}
                editInitialMachineId={selectedStage?.machine_id ?? null}
                pathActionsEnabled={Boolean(selectedRouteId)}
                onUpdateStep={onUpdateStep}
                onMoveStep={onMoveStep}
                onRemoveStep={(step) => onDeleteStep(step.id)}
                onAddStep={onAddStep}
                addingStep={addingStep}
                updatingStep={updatingStep}
              />

              <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                {!activeFormula ? (
                  <div className="flex justify-end">
                    <Button type="button" size="sm" variant="outline" onClick={onAddRecipe}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add recipe
                    </Button>
                  </div>
                ) : null}
                {formulasError ? (
                  <p className="text-sm text-destructive">Failed to load recipes</p>
                ) : loadingFormulas ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                  </div>
                ) : !activeFormula ? (
                  <p className="text-sm text-muted-foreground">
                    Add a recipe for this route, then click a path step to edit materials.
                  </p>
                ) : (
                  <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-2 md:items-stretch md:gap-0">
                    <div className="flex min-w-0 flex-col gap-3 md:border-r md:border-border md:pr-4">
                      <div className="min-w-0 space-y-2 rounded-md border border-border bg-muted/10 p-3">
                        <div className="flex items-end justify-between gap-2">
                          <div className="grid min-w-0 flex-1 gap-1.5">
                            <Label htmlFor="setup-recipe-name">Recipe name</Label>
                            <div className="flex min-w-0 items-center gap-3">
                              <Input
                                id="setup-recipe-name"
                                className="min-w-0 flex-1"
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                onBlur={() => void saveRecipeMeta()}
                              />
                              <span className="shrink-0 text-sm">
                                <span className="text-muted-foreground">Code: </span>
                                {activeFormula.formula_code}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => onEditRecipe(activeFormula.id)}
                          >
                            Edit recipe
                          </Button>
                        </div>
                        {savingMeta ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
                      </div>
                      {renderStepTargetsPanel()}
                    </div>
                    <div className="min-w-0 md:pl-4">{renderStepMaterials()}</div>
                  </div>
                )}

              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupRouteRecipeEditor;
