import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import RouteFlowPreview, { type RouteFlowStep } from '@/components/newcomponents/customui/production/RouteFlowPreview';
import RouteStepPicker, {
  type RouteStepAddPayload,
} from '@/components/newcomponents/customui/production/RouteStepPicker';
import type { ProductionLine, ProductionRouteStep } from '@/types/production';
import { cn } from '@/lib/utils';

export const productionRecipePathBarTitleClass =
  'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export interface ProductionRecipePathBarProps {
  flowSteps: RouteFlowStep[];
  sortedRouteSteps: ProductionRouteStep[];
  lines: ProductionLine[];
  selectedStepId: number | null;
  onSelectStep: (stepId: number) => void;
  /** Pinned machine for the selected step (formula stage). */
  editInitialMachineId?: number | null;
  pathActionsEnabled?: boolean;
  onUpdateStep: (stepId: number, payload: RouteStepAddPayload) => void | Promise<void>;
  onMoveStep: (index: number, direction: -1 | 1) => void | Promise<void>;
  onRemoveStep: (step: ProductionRouteStep) => void | Promise<void>;
  onAddStep: (payload: RouteStepAddPayload) => void | Promise<void>;
  addingStep?: boolean;
  updatingStep?: boolean;
  removingStep?: boolean;
  emptyStepsMessage?: string;
  addButtonLabel?: string;
  minSteps?: number;
  className?: string;
  /** Wrap in bordered section padding (Setup route editor). */
  variant?: 'inline' | 'section';
}

const ProductionRecipePathBar: React.FC<ProductionRecipePathBarProps> = ({
  flowSteps,
  sortedRouteSteps,
  lines,
  selectedStepId,
  onSelectStep,
  editInitialMachineId = null,
  pathActionsEnabled = true,
  onUpdateStep,
  onMoveStep,
  onRemoveStep,
  onAddStep,
  addingStep = false,
  updatingStep = false,
  removingStep = false,
  emptyStepsMessage = 'No steps yet — use Add step to add a production line.',
  addButtonLabel = 'Add step',
  minSteps = 1,
  className,
  variant = 'inline',
}) => {
  const [editStepPopoverOpen, setEditStepPopoverOpen] = useState(false);
  const [addStepPopoverOpen, setAddStepPopoverOpen] = useState(false);

  const selectedStepIndex =
    selectedStepId != null ? sortedRouteSteps.findIndex((s) => s.id === selectedStepId) : -1;
  const selectedRouteStep = selectedStepIndex >= 0 ? sortedRouteSteps[selectedStepIndex] : null;
  const busy = addingStep || updatingStep || removingStep;
  const canEdit = pathActionsEnabled && selectedRouteStep != null && lines.length > 0;
  const canAdd = pathActionsEnabled && lines.length > 0;
  const canRemove = sortedRouteSteps.length > minSteps;

  const handleFlowStepSelect = (step: RouteFlowStep) => {
    onSelectStep(step.id);
  };

  const inner = (
    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-2', className)}>
      <p className={cn(productionRecipePathBarTitleClass, 'shrink-0')}>Path</p>
      {flowSteps.length === 0 ? (
        <span className="text-sm text-muted-foreground">{emptyStepsMessage}</span>
      ) : (
        <RouteFlowPreview
          steps={flowSteps}
          selectedStepId={selectedStepId}
          onStepSelect={handleFlowStepSelect}
        />
      )}
      <div className="min-w-2 flex-1 basis-8" aria-hidden />
      <Popover open={editStepPopoverOpen} onOpenChange={setEditStepPopoverOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="outline" className="shrink-0" disabled={!canEdit || busy}>
            <Pencil className="mr-1 h-4 w-4" />
            Edit step
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(20rem,92vw)] p-3" align="end">
          {selectedRouteStep ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{selectedRouteStep.name}</p>
              <RouteStepPicker
                embedded
                mode="edit"
                lines={lines}
                initialLineId={selectedRouteStep.production_line_id ?? undefined}
                initialMachineId={editInitialMachineId}
                disabled={!pathActionsEnabled || lines.length === 0}
                isSaving={updatingStep}
                onUpdate={(payload) => onUpdateStep(selectedRouteStep.id, payload)}
                onSaved={() => setEditStepPopoverOpen(false)}
              />
              <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedStepIndex <= 0 || busy}
                  onClick={() => void onMoveStep(selectedStepIndex, -1)}
                  aria-label="Move step earlier"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedStepIndex < 0 || selectedStepIndex >= sortedRouteSteps.length - 1 || busy}
                  onClick={() => void onMoveStep(selectedStepIndex, 1)}
                  aria-label="Move step later"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="ml-auto text-destructive hover:text-destructive"
                  disabled={!canRemove || busy}
                  onClick={() => {
                    if (!canRemove) return;
                    if (!window.confirm(`Remove "${selectedRouteStep.name}" from this path?`)) return;
                    void onRemoveStep(selectedRouteStep);
                    setEditStepPopoverOpen(false);
                  }}
                >
                  {removingStep ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1 h-4 w-4" />
                  )}
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a path step to edit.</p>
          )}
        </PopoverContent>
      </Popover>
      <Popover open={addStepPopoverOpen} onOpenChange={setAddStepPopoverOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant="outline" className="shrink-0" disabled={!canAdd || busy}>
            <Plus className="mr-1 h-4 w-4" />
            {addButtonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(20rem,92vw)] p-3" align="end">
          <RouteStepPicker
            embedded
            lines={lines}
            onAdd={onAddStep}
            disabled={!pathActionsEnabled || lines.length === 0}
            isAdding={addingStep}
            onAdded={() => setAddStepPopoverOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  if (variant === 'section') {
    return <section className="shrink-0 border-b border-border p-4">{inner}</section>;
  }

  return inner;
};

export default ProductionRecipePathBar;
