import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  ProductionFormulaStage,
  ProductionFormulaStageItem,
  ProductionLine,
  ProductionRouteStep,
} from '@/types/production';
import { formatProductionQuantity } from '@/lib/productionQuantity';
import { cn } from '@/lib/utils';

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

export interface SetupRecipeStepListHandle {
  isDirty: () => boolean;
  save: () => Promise<boolean>;
}

interface SetupRecipeStepListProps {
  stages: ProductionFormulaStage[];
  fills: ProductionRouteStep[];
  lines: ProductionLine[];
  stageItems: ProductionFormulaStageItem[];
  getItemName: (id: number) => string;
  selectedStageId: number | null;
  onSelect: (stageId: number) => void;
  onPatch: (
    stageId: number,
    data: { expected_duration_minutes?: number | null },
  ) => void | Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

const SetupRecipeStepList = forwardRef<SetupRecipeStepListHandle, SetupRecipeStepListProps>(function SetupRecipeStepList({
  stages,
  fills,
  lines,
  stageItems,
  getItemName,
  selectedStageId,
  onSelect,
  onPatch,
  onDirtyChange,
}, ref) {
  const [drafts, setDrafts] = useState<Record<number, { minutes: string }>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const stage of stages) {
        if (next[stage.id] != null) continue;
        next[stage.id] = {
          minutes: stage.expected_duration_minutes != null ? String(stage.expected_duration_minutes) : '',
        };
      }
      return next;
    });
  }, [stages]);

  const minutesDirty = useMemo(() => {
    return stages.some((stage) => {
      const draft = drafts[stage.id]?.minutes;
      if (draft == null) return false;
      const saved = stage.expected_duration_minutes != null ? String(stage.expected_duration_minutes) : '';
      return draft !== saved;
    });
  }, [stages, drafts]);

  useEffect(() => {
    onDirtyChange?.(minutesDirty);
  }, [minutesDirty, onDirtyChange]);

  useImperativeHandle(ref, () => ({
    isDirty: () => minutesDirty,
    save: async () => {
      let ok = true;
      for (const stage of stages) {
        const draft = drafts[stage.id]?.minutes;
        if (draft == null) continue;
        const saved = stage.expected_duration_minutes != null ? String(stage.expected_duration_minutes) : '';
        if (draft === saved) continue;
        const parsed = draft.trim() ? parseInt(draft, 10) : null;
        if (draft.trim() && !Number.isFinite(parsed)) {
          ok = false;
          continue;
        }
        try {
          await onPatch(stage.id, {
            expected_duration_minutes: parsed,
          });
          setDrafts((prev) => ({
            ...prev,
            [stage.id]: { minutes: parsed != null ? String(parsed) : '' },
          }));
        } catch {
          ok = false;
        }
      }
      return ok;
    },
  }), [minutesDirty, stages, drafts, onPatch]);

  if (stages.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
        No steps yet. Use Edit path to add production lines.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {stages.map((stage, index) => {
        const draft = drafts[stage.id] ?? { minutes: '' };
        const selected = stage.id === selectedStageId;
        const output = stageItems.find(
          (row) => row.formula_stage_id === stage.id && row.item_role === 'output',
        );
        return (
          <li key={stage.id}>
            <div
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('[data-step-minutes-field]')) return;
                onSelect(stage.id);
              }}
              className={cn(
                'rounded-md border px-3 py-2 text-left transition-colors',
                'cursor-pointer hover:bg-muted/40',
                selected ? 'border-brand-primary/50 bg-brand-primary/5 hover:bg-brand-primary/10' : 'border-border',
              )}
            >
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="text-xs text-muted-foreground">{index + 1}</span>
                <span className="min-w-0 truncate">{lineName(stage, fills, lines)}</span>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <div
                  data-step-minutes-field
                  className="grid w-full max-w-[5.75rem] shrink-0 gap-1"
                >
                  <Label
                    htmlFor={`minutes-${stage.id}`}
                    className="text-xs leading-tight"
                    title="Expected duration (minutes)"
                  >
                    Minutes
                  </Label>
                  <Input
                    id={`minutes-${stage.id}`}
                    inputMode="numeric"
                    className="h-8 tabular-nums"
                    value={draft.minutes}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [stage.id]: { minutes: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                  <span className="text-xs text-muted-foreground">Output</span>
                  <div
                    className={cn(
                      'flex min-h-8 w-full items-center rounded-md border border-input bg-background px-3 py-1.5 text-sm leading-snug',
                      !output && 'text-muted-foreground',
                    )}
                  >
                    {output ? (
                      <p className="min-w-0 break-words">
                        <span className="font-medium">{getItemName(output.item_id)}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {' '}
                          · {formatProductionQuantity(Number(output.quantity))}
                        </span>
                      </p>
                    ) : (
                      <p className="min-w-0 text-muted-foreground">Not set — add on Output tab →</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export default SetupRecipeStepList;
