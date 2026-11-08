import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReferenceId } from '@/components/newcomponents/customui/ReferenceId';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGetFormulaStagesQuery,
  useUpdateFormulaStageMutation,
  useGetProductionRoutesQuery,
  useGetProductionRouteStepsQuery,
  useUpdateProductionFormulaMutation,
  useGetAllFormulaStageItemsQuery,
} from '@/features/production/productionApi';
import {
  estimatedRecipeDurationMinutes,
  finishedGoodOutputQuantity,
} from '@/lib/recipeDerivedMetrics';
import RouteFlowPreview from '@/components/newcomponents/customui/production/RouteFlowPreview';
import FormulaStageMaterialsBlock from '@/components/newcomponents/customui/production/FormulaStageMaterialsBlock';
import type { ProductionFormula, ProductionLine } from '@/types/production';
import { cn } from '@/lib/utils';
import { appToast } from '@/lib/appToast';
import { Loader2 } from 'lucide-react';

export interface FormulaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: ProductionFormula;
  lines: ProductionLine[];
  factoryId?: number | null;
  items: { id: number; name: string; unit?: string }[];
  getItemName: (id: number) => string;
  onEditRequest?: () => void;
}

const FORMULA_DIALOG_SELECT_TRIGGER =
  'focus:ring-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:ring-offset-0 data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-inset data-[state=open]:ring-offset-0';

const FormulaDetailsDialog: React.FC<FormulaDetailsDialogProps> = ({
  open,
  onOpenChange,
  formula,
  lines: _lines,
  factoryId = null,
  items,
  getItemName,
  onEditRequest,
}) => {
  const formulaId = formula.id;
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const { data: formulaStagesRaw = [], isLoading: loadingStages } = useGetFormulaStagesQuery(formulaId, {
    skip: !open,
  });
  const formulaStages = useMemo(
    () => [...formulaStagesRaw].sort((a, b) => a.stage_order - b.stage_order),
    [formulaStagesRaw]
  );
  const [updateFormulaStage] = useUpdateFormulaStageMutation();
  const routeBound = formula.route_id != null;
  const { data: routes = [] } = useGetProductionRoutesQuery(
    factoryId ? { factory_id: factoryId } : undefined,
    { skip: !open || !factoryId },
  );
  const { data: linkedRouteStepsRaw = [], isLoading: loadingRouteSteps } = useGetProductionRouteStepsQuery(
    formula.route_id ?? 0,
    { skip: !open || formula.route_id == null },
  );
  const linkedRouteSteps = useMemo(
    () => [...linkedRouteStepsRaw].sort((a, b) => a.step_order - b.step_order),
    [linkedRouteStepsRaw],
  );
  const [updateFormula, { isLoading: savingRoute }] = useUpdateProductionFormulaMutation();
  const { data: allStageItems = [], isLoading: loadingStageItems } = useGetAllFormulaStageItemsQuery(formulaId, {
    skip: !open || !routeBound,
  });
  const recipeFinishedGoodQty = useMemo(
    () => finishedGoodOutputQuantity(formulaStages, allStageItems),
    [formulaStages, allStageItems],
  );
  const recipeEstMinutes = useMemo(
    () => estimatedRecipeDurationMinutes(formulaStages),
    [formulaStages],
  );
  const [targetDrafts, setTargetDrafts] = useState<Record<number, { minutes: string }>>({});
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
    if (!routeBound || formulaStages.length === 0) {
      setSelectedStageId(null);
      return;
    }
    setSelectedStageId((prev) => {
      if (prev != null && formulaStages.some((s) => s.id === prev)) return prev;
      return formulaStages[0]?.id ?? null;
    });
  }, [routeBound, formulaStages, formulaId]);

  const selectedStage = useMemo(
    () => formulaStages.find((s) => s.id === selectedStageId) ?? null,
    [formulaStages, selectedStageId],
  );

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

  const selectedRouteStepId = useMemo(() => {
    if (!selectedStage) return null;
    if (selectedStage.route_step_id != null) return selectedStage.route_step_id;
    const idx = formulaStages.findIndex((s) => s.id === selectedStage.id);
    return linkedRouteSteps[idx]?.id ?? null;
  }, [selectedStage, formulaStages, linkedRouteSteps]);

  const handleFlowStepSelect = (step: { id: number; name: string }, index: number) => {
    const stage =
      formulaStages.find((s) => s.route_step_id === step.id) ?? formulaStages[index] ?? null;
    if (stage) setSelectedStageId(stage.id);
  };

  const metaParts = [formula.formula_code, `v${formula.version}`].filter(Boolean);

  const stagesListBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {!routeBound && (
        <div className="mb-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          Attach a factory route below, or build routes on Production → Setup. Steps sync automatically when a
          route is linked.
        </div>
      )}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Production route</p>
        {routeBound && (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => {
              onOpenChange(false);
              appToast.success('Use Production Setup to add or reorder route steps.');
            }}
          >
            Edit route on Setup
          </Button>
        )}
      </div>
      <div className="mb-3 grid gap-1.5">
        <Label>Route</Label>
        <Select
          value={formula.route_id != null ? String(formula.route_id) : 'none'}
          disabled={savingRoute || !factoryId}
          onValueChange={async (value) => {
            try {
              await updateFormula({
                id: formulaId,
                data: { route_id: value === 'none' ? null : Number(value) },
              }).unwrap();
              appToast.success(value === 'none' ? 'Route cleared' : 'Route attached');
            } catch (error: unknown) {
              const detail = (error as { data?: { detail?: string } })?.data?.detail;
              appToast.error(detail || 'Failed to set route');
            }
          }}
        >
          <SelectTrigger className={FORMULA_DIALOG_SELECT_TRIGGER}>
            <SelectValue placeholder="No route" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No route</SelectItem>
            {routes.map((route) => (
              <SelectItem key={route.id} value={String(route.id)}>
                {route.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator className="mb-3 shrink-0" />
      {!routeBound ? (
        <p className="text-sm text-muted-foreground">
          Pick a route to see its step flow here. Set planned minutes and output under each step; materials on the right.
        </p>
      ) : loadingRouteSteps || loadingStages ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
          <RouteFlowPreview
            steps={linkedRouteSteps}
            emptyMessage="This route has no steps yet — add them on Production Setup."
            selectedStepId={selectedRouteStepId}
            onStepSelect={handleFlowStepSelect}
          />
          {selectedStage ? (
            <div className="space-y-3 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedStage.stage_order}. {selectedStage.name}
                </p>
              </div>
              {(() => {
                const draft = targetDrafts[selectedStage.id] ?? { minutes: '' };
                const stepOutputLines = stageItemsForSelected.filter((row) => row.item_role === 'output');
                const formatOutputLine = (row: (typeof stageItemsForSelected)[number]) => {
                  const unit = items.find((i) => i.id === row.item_id)?.unit;
                  const label = getItemName(row.item_id);
                  const name = unit ? `${label} (${unit})` : label;
                  return `${name} · ${row.quantity}`;
                };
                return (
                  <div className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Step targets
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Expected output</p>
                      {stepOutputLines.length > 0 ? (
                        <ul className="text-sm text-foreground list-inside list-disc space-y-0.5">
                          {stepOutputLines.map((row) => (
                            <li key={row.id}>{formatOutputLine(row)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="grid flex-1 gap-1.5">
                        <Label htmlFor={`stage-${selectedStage.id}-minutes`}>Expected minutes</Label>
                        <Input
                          id={`stage-${selectedStage.id}-minutes`}
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
                                expected_duration_minutes: draft.minutes.trim()
                                  ? parseInt(draft.minutes, 10)
                                  : null,
                              },
                            }).unwrap();
                            appToast.success('Duration saved');
                          } catch (error: unknown) {
                            const detail = (error as { data?: { detail?: string } })?.data?.detail;
                            appToast.error(detail || 'Failed to save duration');
                          }
                        }}
                      >
                        Save duration
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Click a step in the flow to edit targets and materials.</p>
          )}
        </div>
      )}
    </div>
  );

  const selectedStagePanel =
    selectedStage && selectedStageId != null ? (
      <div className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto pb-2">
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
      </div>
    ) : (
      <div className="flex min-h-0 flex-col rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground shadow-sm">
        {routeBound ? 'Click a step in the route flow on the left.' : 'Link a route on the left first.'}
      </div>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle className="text-foreground">{formula.name}</DialogTitle>
          <DialogDescription asChild>
            <ReferenceId>{metaParts.join(' · ')}</ReferenceId>
          </DialogDescription>
          {formula.description?.trim() && (
            <p className="text-sm text-muted-foreground">{formula.description.trim()}</p>
          )}
          {routeBound ? (
            <dl className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Finished good (last step)</dt>
                <dd className="font-medium tabular-nums">
                  {recipeFinishedGoodQty > 0 ? recipeFinishedGoodQty : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Est. duration</dt>
                <dd className="font-medium tabular-nums">
                  {recipeEstMinutes != null ? `${recipeEstMinutes} min` : '—'}
                </dd>
              </div>
            </dl>
          ) : null}
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto px-6 py-4 md:grid-cols-2 md:gap-8 md:overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-col md:overflow-y-auto md:pr-2">{stagesListBlock}</div>
          <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:pl-8 md:pt-0 md:overflow-y-auto">
            {selectedStagePanel}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
          {onEditRequest && (
            <Button type="button" variant="outline" onClick={onEditRequest}>
              Edit formula
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaDetailsDialog;
