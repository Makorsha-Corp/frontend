import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RecipePathTimeline from '@/components/newcomponents/customui/production/RecipePathTimeline';
import type { RouteStepAddPayload } from '@/components/newcomponents/customui/production/RouteStepPicker';
import {
  useAppendRecipeRouteStepMutation,
  useDeleteProductionRouteStepMutation,
  useGetProductionRouteByIdQuery,
  useRemoveFormulaStageMutation,
  useUpdateFormulaStageMutation,
  useUpdateProductionRouteMutation,
  useUpdateProductionRouteStepMutation,
} from '@/features/production/productionApi';
import type { ProductionFormulaStage, ProductionLine, ProductionRouteStep } from '@/types/production';
import { appToast } from '@/lib/appToast';

export interface SetupRecipeRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formulaId: number;
  factoryId: number | null;
  routeId: number | null;
  stages: ProductionFormulaStage[];
  routeSteps: ProductionRouteStep[];
  lines: ProductionLine[];
}

const SetupRecipeRouteDialog: React.FC<SetupRecipeRouteDialogProps> = ({
  open,
  onOpenChange,
  formulaId,
  factoryId,
  routeId,
  stages,
  routeSteps,
  lines,
}) => {
  const { data: route } = useGetProductionRouteByIdQuery(routeId ?? 0, { skip: !routeId || !open });
  const [updateRoute] = useUpdateProductionRouteMutation();
  const [updateStep, { isLoading: updatingStep }] = useUpdateProductionRouteStepMutation();
  const [updateFormulaStage] = useUpdateFormulaStageMutation();
  const [removeStage, { isLoading: removingStage }] = useRemoveFormulaStageMutation();
  const [deleteRouteStep] = useDeleteProductionRouteStepMutation();
  const [appendStep, { isLoading: addingStep }] = useAppendRecipeRouteStepMutation();
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    setNameDraft(route?.name ?? '');
  }, [open, route?.id, route?.name]);

  const sortedSteps = useMemo(
    () => [...routeSteps].sort((a, b) => a.step_order - b.step_order || a.id - b.id),
    [routeSteps],
  );

  const stageByRouteStepId = useMemo(() => {
    const map = new Map<number, ProductionFormulaStage>();
    for (const stage of stages) {
      if (stage.route_step_id != null) {
        map.set(stage.route_step_id, stage);
      }
    }
    return map;
  }, [stages]);

  const resolveStageForStep = (step: ProductionRouteStep): ProductionFormulaStage | undefined => {
    const linked = stageByRouteStepId.get(step.id);
    if (linked) return linked;
    return stages.find(
      (row) => row.stage_order === step.step_order && row.production_line_id === step.production_line_id,
    );
  };

  const saveName = async () => {
    if (!routeId || !route) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === route.name) return;
    try {
      await updateRoute({ id: routeId, name: trimmed }).unwrap();
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to rename path');
      setNameDraft(route.name);
    }
  };

  const syncStageForStep = async (
    step: ProductionRouteStep,
    payload: RouteStepAddPayload,
  ) => {
    const stage = resolveStageForStep(step);
    if (!stage) return;
    await updateFormulaStage({
      id: stage.id,
      formulaId,
      data: {
        production_line_id: payload.production_line_id,
        machine_id: payload.machine_id,
      },
    }).unwrap();
  };

  const handleUpdateStep = async (stepId: number, payload: RouteStepAddPayload) => {
    if (!routeId) return;
    const step = sortedSteps.find((s) => s.id === stepId);
    if (!step) return;
    try {
      await updateStep({
        id: stepId,
        routeId,
        production_line_id: payload.production_line_id,
      }).unwrap();
      await syncStageForStep(step, payload);
      appToast.success('Step updated');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to update step');
      throw error;
    }
  };

  const handleMoveStep = async (index: number, direction: -1 | 1) => {
    if (!routeId) return;
    const neighborIndex = index + direction;
    if (neighborIndex < 0 || neighborIndex >= sortedSteps.length) return;
    const current = sortedSteps[index];
    const neighbor = sortedSteps[neighborIndex];
    try {
      await updateStep({
        id: current.id,
        routeId,
        step_order: neighbor.step_order,
      }).unwrap();
      await updateStep({
        id: neighbor.id,
        routeId,
        step_order: current.step_order,
      }).unwrap();
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to reorder step');
    }
  };

  const handleRemoveStep = async (step: ProductionRouteStep) => {
    const stage = resolveStageForStep(step);
    try {
      if (stage) {
        await removeStage({ id: stage.id, formulaId }).unwrap();
        appToast.success('Step removed');
        return;
      }
      if (!routeId) {
        appToast.error('No recipe step linked to this path step');
        return;
      }
      await deleteRouteStep({ id: step.id, routeId }).unwrap();
      appToast.success('Step removed');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to remove step');
    }
  };

  const handleAddStep = async (payload: RouteStepAddPayload) => {
    const line = lines.find((row) => row.id === payload.production_line_id);
    if (!line || factoryId == null) return;
    try {
      const createdStage = await appendStep({
        formulaId,
        production_line_id: payload.production_line_id,
        name: line.name,
        factory_id: factoryId,
      }).unwrap();
      if (payload.machine_id != null) {
        await updateFormulaStage({
          id: createdStage.id,
          formulaId,
          data: { machine_id: payload.machine_id },
        }).unwrap();
      }
      appToast.success('Step added');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to add step');
      throw error;
    }
  };

  const busy = updatingStep || removingStage || addingStep;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex min-h-[min(28rem,55vh)] max-h-[min(48rem,85vh)] w-[min(42rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit recipe path</DialogTitle>
          <DialogDescription>
            Set production lines in order. Edit materials and run targets in the main setup view.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-recipe-path-name">Path name</Label>
            <Input
              id="edit-recipe-path-name"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => void saveName()}
              disabled={!routeId}
            />
          </div>

          <RecipePathTimeline
            sortedSteps={sortedSteps}
            lines={lines}
            resolveStage={resolveStageForStep}
            pathActionsEnabled={Boolean(routeId)}
            onUpdateStep={handleUpdateStep}
            onMoveStep={handleMoveStep}
            onRemoveStep={handleRemoveStep}
            onAddStep={handleAddStep}
            addingStep={addingStep}
            updatingStep={updatingStep}
            removingStep={removingStage}
            minSteps={1}
          />
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SetupRecipeRouteDialog;
