import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { ProductionFormulaStage, ProductionLine, ProductionRouteStep } from '@/types/production';

export type AddBatchStageDraft = {
  include: boolean;
  lineId: string;
  minutes: string;
  machineId: string;
};

interface AddBatchRecipePathListProps {
  stages: ProductionFormulaStage[];
  routeSteps: ProductionRouteStep[];
  lines: ProductionLine[];
  stageDrafts: Record<number, AddBatchStageDraft>;
  selectedStageId: number | null;
  onSelect: (stageId: number) => void;
  onPatch: (stageId: number, patch: Partial<AddBatchStageDraft>) => void;
}

function lineName(
  stage: ProductionFormulaStage,
  fills: ProductionRouteStep[],
  lines: ProductionLine[],
): string {
  const fill =
    fills.find((step) => step.id === stage.route_step_id) ??
    fills.find((step) => step.step_order === stage.stage_order);
  const lineId = fill?.production_line_id ?? stage.production_line_id;
  return lines.find((line) => line.id === lineId)?.name ?? stage.name;
}

const AddBatchRecipePathList: React.FC<AddBatchRecipePathListProps> = ({
  stages,
  routeSteps,
  lines,
  stageDrafts,
  selectedStageId,
  onSelect,
  onPatch,
}) => {
  const sorted = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  return (
    <ul className="flex flex-col gap-1.5">
      {sorted.map((stage, index) => {
        const draft = stageDrafts[stage.id];
        if (!draft) return null;
        const disabled = !draft.include;
        const selected = stage.id === selectedStageId;
        return (
          <li key={stage.id}>
            <div
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('[data-path-step-field]')) return;
                if (!disabled) onSelect(stage.id);
              }}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2.5 py-2 transition-colors',
                disabled ? 'opacity-60' : 'cursor-pointer hover:bg-muted/40',
                selected && !disabled
                  ? 'border-brand-primary/50 bg-brand-primary/5 hover:bg-brand-primary/10'
                  : 'border-border',
              )}
            >
              <div data-path-step-field onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={draft.include}
                  onCheckedChange={(checked) => onPatch(stage.id, { include: checked })}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {lineName(stage, routeSteps, lines)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default AddBatchRecipePathList;
