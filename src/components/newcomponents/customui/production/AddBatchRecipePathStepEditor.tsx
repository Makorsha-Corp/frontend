import React, { type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductionLineMachineSelect from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import type {
  ProductionFormulaStage,
  ProductionLine,
  ProductionRouteStep,
  ProductionScheduleBatch,
} from '@/types/production';
import type { ProductionPlannedWindow } from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import type { AddBatchStageDraft } from './AddBatchRecipePathList';

function recipeLineIdForStage(
  stage: ProductionFormulaStage,
  routeSteps: ProductionRouteStep[],
): number | null {
  const fill =
    routeSteps.find((step) => step.id === stage.route_step_id) ??
    routeSteps.find((step) => step.step_order === stage.stage_order);
  return fill?.production_line_id ?? stage.production_line_id ?? null;
}

interface AddBatchRecipePathStepEditorProps {
  stage: ProductionFormulaStage | null;
  draft: AddBatchStageDraft | null;
  lines: ProductionLine[];
  routeSteps: ProductionRouteStep[];
  showMachine?: boolean;
  factoryId?: number;
  scheduleBatches?: ProductionScheduleBatch[];
  plannedWindow?: ProductionPlannedWindow | null;
  onPatch: (patch: Partial<AddBatchStageDraft>) => void;
  children?: ReactNode;
}

const AddBatchRecipePathStepEditor: React.FC<AddBatchRecipePathStepEditorProps> = ({
  stage,
  draft,
  lines,
  routeSteps,
  showMachine = false,
  factoryId,
  scheduleBatches,
  plannedWindow,
  onPatch,
  children,
}) => {
  if (!stage || !draft) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        Select a step to edit line and duration.
      </p>
    );
  }

  const disabled = !draft.include;
  const recipeLineId = recipeLineIdForStage(stage, routeSteps);
  const overrideLineId = draft.lineId.trim() !== '' ? Number(draft.lineId) : null;
  const effectiveLineId = overrideLineId ?? recipeLineId;
  const stepLine = effectiveLineId != null ? lines.find((l) => l.id === effectiveLineId) : undefined;
  const lineSelectValue = effectiveLineId != null ? String(effectiveLineId) : undefined;
  const machineValue = draft.machineId.trim() !== '' ? Number(draft.machineId) : null;

  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Selected step
      </p>
      <p className="mb-3 truncate text-sm font-medium">{stage.name}</p>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <div className="grid min-w-0 gap-1">
          <Label className="text-xs">Line override</Label>
          <Select
            value={lineSelectValue}
            onValueChange={(value) => {
              const picked = Number(value);
              onPatch({
                lineId: recipeLineId != null && picked === recipeLineId ? '' : value,
                machineId: '',
              });
            }}
            disabled={disabled || lineSelectValue == null}
          >
            <SelectTrigger className="h-8 min-w-0 w-full gap-1 overflow-hidden ps-2.5 pe-2 [&>span]:line-clamp-none [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-start">
              <SelectValue placeholder="Select line" />
            </SelectTrigger>
            <SelectContent>
              {lines.map((l) => {
                const isRecipeDefault = recipeLineId != null && l.id === recipeLineId;
                return (
                  <SelectItem key={l.id} value={String(l.id)} showIndicator={false}>
                    {l.name}
                    {isRecipeDefault ? ' (default)' : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 gap-1">
          <Label className="text-xs">Minutes</Label>
          <Input
            className="h-8 tabular-nums"
            inputMode="numeric"
            placeholder="Min"
            value={draft.minutes}
            disabled={disabled}
            onChange={(e) => onPatch({ minutes: e.target.value })}
          />
        </div>
      </div>
      {showMachine ? (
        <ProductionLineMachineSelect
          className="mt-3"
          line={stepLine}
          disabled={disabled}
          value={machineValue}
          factoryId={factoryId}
          scheduleBatches={scheduleBatches}
          plannedWindow={plannedWindow}
          id={`batch-step-machine-${stage.id}`}
          onChange={(id) => onPatch({ machineId: id != null ? String(id) : '' })}
        />
      ) : null}
      {children ? (
        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Materials
          </p>
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default AddBatchRecipePathStepEditor;
