import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RouteStepPicker, {
  type RouteStepAddPayload,
} from '@/components/newcomponents/customui/production/RouteStepPicker';
import type { ProductionFormulaStage, ProductionLine, ProductionRouteStep } from '@/types/production';
import { cn } from '@/lib/utils';

function lineLabelForStep(step: ProductionRouteStep, lines: ProductionLine[]): string {
  const line = lines.find((row) => row.id === step.production_line_id);
  return line?.name ?? step.name;
}

function machineSubtitle(
  stage: ProductionFormulaStage | undefined,
  lines: ProductionLine[],
): string {
  if (!stage?.machine_id) return 'Any machine';
  const line = lines.find((row) => row.id === stage.production_line_id);
  const machine = line?.machines?.find((m) => m.id === stage.machine_id);
  return machine?.name ?? 'Any machine';
}

export interface RecipePathTimelineProps {
  sortedSteps: ProductionRouteStep[];
  lines: ProductionLine[];
  resolveStage: (step: ProductionRouteStep) => ProductionFormulaStage | undefined;
  pathActionsEnabled?: boolean;
  onUpdateStep: (stepId: number, payload: RouteStepAddPayload) => void | Promise<void>;
  onMoveStep: (index: number, direction: -1 | 1) => void | Promise<void>;
  onRemoveStep: (step: ProductionRouteStep) => void | Promise<void>;
  onAddStep: (payload: RouteStepAddPayload) => void | Promise<void>;
  addingStep?: boolean;
  updatingStep?: boolean;
  removingStep?: boolean;
  minSteps?: number;
}

const RecipePathTimeline: React.FC<RecipePathTimelineProps> = ({
  sortedSteps,
  lines,
  resolveStage,
  pathActionsEnabled = true,
  onUpdateStep,
  onMoveStep,
  onRemoveStep,
  onAddStep,
  addingStep = false,
  updatingStep = false,
  removingStep = false,
  minSteps = 1,
}) => {
  const [expandedStepId, setExpandedStepId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const busy = addingStep || updatingStep || removingStep;
  const canRemove = sortedSteps.length > minSteps;

  const openStepEditor = (stepId: number) => {
    setAddOpen(false);
    setExpandedStepId((prev) => (prev === stepId ? null : stepId));
  };

  return (
    <div className="space-y-0">
      {sortedSteps.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          No lines on this path yet — add a production line below.
        </p>
      ) : (
        sortedSteps.map((step, index) => {
          const stage = resolveStage(step);
          const isExpanded = expandedStepId === step.id;
          const isLast = index === sortedSteps.length - 1;
          return (
            <div key={step.id} className="relative flex gap-3">
              <div className="flex w-8 shrink-0 flex-col items-center">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums',
                    isExpanded
                      ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                {!isLast ? <div className="min-h-2 w-px flex-1 bg-border" aria-hidden /> : null}
              </div>
              <div className={cn('min-w-0 flex-1 pb-4', isLast && 'pb-2')}>
                <div
                  className={cn(
                    'rounded-lg border bg-card shadow-sm transition-colors',
                    isExpanded ? 'border-brand-primary/40 ring-1 ring-brand-primary/20' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 p-3 text-left transition-colors hover:bg-muted/30"
                    onClick={() => openStepEditor(step.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{lineLabelForStep(step, lines)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {machineSubtitle(stage, lines)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index <= 0 || busy || !pathActionsEnabled}
                        aria-label="Move step earlier"
                        onClick={() => void onMoveStep(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index >= sortedSteps.length - 1 || busy || !pathActionsEnabled}
                        aria-label="Move step later"
                        onClick={() => void onMoveStep(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={!canRemove || busy || !pathActionsEnabled}
                        aria-label="Remove step"
                        onClick={() => {
                          if (!canRemove) return;
                          if (!window.confirm(`Remove "${lineLabelForStep(step, lines)}" from this path?`)) return;
                          void onRemoveStep(step);
                          if (expandedStepId === step.id) setExpandedStepId(null);
                        }}
                      >
                        {removingStep ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </button>
                  {isExpanded ? (
                    <div className="border-t border-border px-3 pb-3 pt-2">
                      <RouteStepPicker
                        embedded
                        mode="edit"
                        lines={lines}
                        initialLineId={step.production_line_id ?? undefined}
                        initialMachineId={stage?.machine_id ?? null}
                        disabled={!pathActionsEnabled || lines.length === 0}
                        isSaving={updatingStep}
                        onUpdate={(payload) => onUpdateStep(step.id, payload)}
                        onSaved={() => setExpandedStepId(null)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className="relative flex gap-3 pt-1">
        <div className="flex w-8 shrink-0 justify-center">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border bg-muted/20 text-muted-foreground">
            <Plus className="h-4 w-4" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {addOpen ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3">
              <RouteStepPicker
                embedded
                lines={lines}
                disabled={!pathActionsEnabled || lines.length === 0}
                isAdding={addingStep}
                onAdd={onAddStep}
                onAdded={() => {
                  setAddOpen(false);
                  setExpandedStepId(null);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                disabled={busy}
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/10 px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-primary/30 hover:bg-muted/30 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={!pathActionsEnabled || lines.length === 0 || busy}
              onClick={() => {
                setExpandedStepId(null);
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add line to path
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipePathTimeline;
