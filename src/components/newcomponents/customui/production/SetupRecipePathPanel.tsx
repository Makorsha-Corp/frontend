import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RouteFlowPreview from '@/components/newcomponents/customui/production/RouteFlowPreview';
import {
  buildPathFlowFromRouteSteps,
  formatRouteStepSummaryLine,
} from '@/components/newcomponents/customui/production/productionRoutePreview';
import SetupRecipeRouteDialog from '@/components/newcomponents/customui/production/SetupRecipeRouteDialog';
import type { ProductionFormulaStage, ProductionLine, ProductionRouteStep } from '@/types/production';

interface SetupRecipePathPanelProps {
  formulaId: number;
  factoryId: number | null;
  routeId: number | null;
  stages: ProductionFormulaStage[];
  routeSteps: ProductionRouteStep[];
  lines: ProductionLine[];
}

const SetupRecipePathPanel: React.FC<SetupRecipePathPanelProps> = ({
  formulaId,
  factoryId,
  routeId,
  stages,
  routeSteps,
  lines,
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const flowSteps = buildPathFlowFromRouteSteps(routeSteps, lines);
  const summary = formatRouteStepSummaryLine(flowSteps, 5);

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Path</p>
            <p className="mt-0.5 truncate text-sm text-foreground" title={summary}>
              {routeId ? summary : 'No lines yet'}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit path
          </Button>
        </div>
        {flowSteps.length > 0 ? (
          <div className="mt-3">
            <RouteFlowPreview steps={flowSteps} size="compact" />
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Open Edit path to add production lines in run order.
          </p>
        )}
      </div>

      <SetupRecipeRouteDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        formulaId={formulaId}
        factoryId={factoryId}
        routeId={routeId}
        stages={stages}
        routeSteps={routeSteps}
        lines={lines}
      />
    </>
  );
};

export default SetupRecipePathPanel;
