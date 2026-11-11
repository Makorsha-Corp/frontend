import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RouteStepPicker from '@/components/newcomponents/customui/production/RouteStepPicker';
import RouteFlowPreview from '@/components/newcomponents/customui/production/RouteFlowPreview';
import type { ProductionLine, ProductionRoute, ProductionRouteStep } from '@/types/production';
import { Loader2, Trash2 } from 'lucide-react';

export interface SetupProcessRouteSectionProps {
  loadingRoutes: boolean;
  routes: ProductionRoute[];
  selectedRouteId: number | null;
  onSelectRoute: (routeId: number) => void;
  onDeleteRoute: (routeId: number) => void;
  steps: ProductionRouteStep[];
  lines: ProductionLine[];
  onMoveStep: (index: number, direction: -1 | 1) => void;
  onDeleteStep: (stepId: number) => void;
  onAddStep: (payload: { production_line_id: number; machine_id: number | null }) => void | Promise<void>;
  addingStep: boolean;
  className?: string;
  /** Hide route chip row when routes are listed in a side rail. */
  omitRouteList?: boolean;
}

const SetupProcessRouteSection: React.FC<SetupProcessRouteSectionProps> = ({
  loadingRoutes,
  routes,
  selectedRouteId,
  onSelectRoute,
  onDeleteRoute,
  steps,
  lines,
  onMoveStep: _onMoveStep,
  onDeleteStep: _onDeleteStep,
  onAddStep,
  addingStep,
  className,
  omitRouteList = false,
}) => {
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? null;

  return (
    <div className={cn('space-y-3', className)}>
      {loadingRoutes ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
        </div>
      ) : routes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a process route, then add production lines as steps.
        </p>
      ) : (
        <div className="space-y-4">
          {!omitRouteList && (
            <div className="flex flex-wrap gap-2">
              {routes.map((route) => {
                const selected = route.id === selectedRouteId;
                return (
                  <div key={route.id} className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      className={cn(
                        selected && 'bg-brand-primary hover:bg-brand-primary-hover ring-2 ring-brand-primary/40',
                      )}
                      onClick={() => onSelectRoute(route.id)}
                    >
                      {route.name}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => onDeleteRoute(route.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {selectedRoute ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/10 p-3">
              {steps.length === 0 ? (
                <RouteFlowPreview steps={[]} emptyMessage="No steps yet — pick a production line below." />
              ) : (
                <RouteFlowPreview steps={steps} />
              )}
              <RouteStepPicker
                lines={lines}
                onAdd={onAddStep}
                disabled={!selectedRouteId || lines.length === 0}
                isAdding={addingStep}
              />
            </div>
          ) : omitRouteList && selectedRouteId == null ? (
            <p className="text-sm text-muted-foreground">Select a route on the left.</p>
          ) : omitRouteList && !selectedRoute ? (
            <p className="text-sm text-muted-foreground">Route not found.</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SetupProcessRouteSection;
