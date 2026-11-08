import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RouteFlowPreview, { type RouteFlowStep } from '@/components/newcomponents/customui/production/RouteFlowPreview';
import RouteStepPicker from '@/components/newcomponents/customui/production/RouteStepPicker';
import {
  buildRoutePreviewSteps,
  formatRouteStepSummaryLine,
  routeStepMetaLine,
} from '@/components/newcomponents/customui/production/productionRoutePreview';
import {
  productionApi,
  useAddProductionRouteStepMutation,
  useCreateProductionRouteMutation,
  useDeleteProductionRouteStepMutation,
} from '@/features/production/productionApi';
import type {
  ProductionFormula,
  ProductionFormulaStage,
  ProductionLine,
  ProductionRoute,
  ProductionRouteStep,
} from '@/types/production';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { appToast } from '@/lib/appToast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface SetupRoutePickerProps {
  id?: string;
  factoryId: number;
  routes: ProductionRoute[];
  formulas: ProductionFormula[];
  formula: ProductionFormula;
  stages: ProductionFormulaStage[];
  lines: ProductionLine[];
  selectedRouteId: number | null;
  selectedFlowSteps: RouteFlowStep[];
  loadingRoutes: boolean;
  disabled?: boolean;
  onSelectRoute: (routeId: number) => void | Promise<void>;
}

const SetupRoutePicker: React.FC<SetupRoutePickerProps> = ({
  id = 'setup-route-select',
  factoryId,
  routes,
  formulas,
  formula,
  stages,
  lines,
  selectedRouteId,
  selectedFlowSteps,
  loadingRoutes,
  disabled = false,
  onSelectRoute,
}) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [browseId, setBrowseId] = useState<number | null>(selectedRouteId);
  const [newName, setNewName] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [createRoute, { isLoading: creating }] = useCreateProductionRouteMutation();
  const [addStep, { isLoading: addingStep }] = useAddProductionRouteStepMutation();
  const [deleteStep, { isLoading: deletingStep }] = useDeleteProductionRouteStepMutation();

  useEffect(() => {
    if (!open) return;
    setBrowseId(selectedRouteId ?? routes[0]?.id ?? null);
    for (const route of routes) {
      void dispatch(productionApi.endpoints.getProductionRouteSteps.initiate(route.id));
    }
  }, [open, routes, selectedRouteId, dispatch]);

  const stepsByRouteId = useAppSelector((state) => {
    const map: Record<number, ProductionRouteStep[] | undefined> = {};
    for (const route of routes) {
      map[route.id] = productionApi.endpoints.getProductionRouteSteps.select(route.id)(state).data;
    }
    return map;
  });

  const selectedRoute = useMemo(
    () => routes.find((row) => row.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );
  const browsed = routes.find((row) => row.id === browseId) ?? null;
  const browsedSteps = browseId != null ? stepsByRouteId[browseId] ?? [] : [];
  const browsedPreview = browsed
    ? buildRoutePreviewSteps({
        route: browsed,
        formulaId: formula.id,
        stages,
        fills: browsedSteps,
        lines,
      })
    : [];

  const recipeCount = (routeId: number) =>
    formulas.filter((row) => row.is_active && row.route_id === routeId).length;

  const triggerPlaceholder = loadingRoutes
    ? 'Loading routes…'
    : routes.length === 0
      ? 'No routes yet'
      : 'Choose a route…';

  const handleUse = (routeId: number) => {
    void Promise.resolve(onSelectRoute(routeId)).then(() => setOpen(false));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const route = await createRoute({ factory_id: factoryId, name: newName.trim() }).unwrap();
      setNewName('');
      setBrowseId(route.id);
      appToast.success('Route created');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to create route');
    }
  };

  const handleAddLine = async (payload: { production_line_id: number }) => {
    if (!browsed) return;
    const line = lines.find((row) => row.id === payload.production_line_id);
    const nextOrder = browsedSteps.reduce((max, step) => Math.max(max, step.step_order), 0) + 1;
    try {
      await addStep({
        routeId: browsed.id,
        production_line_id: payload.production_line_id,
        step_order: nextOrder,
        name: line?.name,
      }).unwrap();
      setAddOpen(false);
      appToast.success('Step added');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to add step');
    }
  };

  const handleDeleteStep = async (step: ProductionRouteStep) => {
    if (!browsed) return;
    try {
      await deleteStep({ id: step.id, routeId: browsed.id }).unwrap();
      appToast.success('Step removed');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to remove step');
    }
  };

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled || loadingRoutes}
        onClick={() => setOpen(true)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-medium', !selectedRoute && 'font-normal text-muted-foreground')}>
            {selectedRoute?.name ?? triggerPlaceholder}
          </span>
          {selectedRoute ? (
            <span className="block truncate text-xs text-muted-foreground">
              {selectedFlowSteps.length > 0
                ? formatRouteStepSummaryLine(selectedFlowSteps)
                : 'No steps yet'}
            </span>
          ) : null}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
            <DialogTitle>Routes</DialogTitle>
            <DialogDescription>Factory paths. Pick one for this recipe, or add lines to a path.</DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 md:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {routes.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">No routes in this factory.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {routes.map((route) => {
                      const fills = stepsByRouteId[route.id] ?? [];
                      const preview = buildRoutePreviewSteps({
                        route,
                        formulaId: formula.id,
                        stages,
                        fills,
                        lines,
                      });
                      const inUse = route.id === formula.route_id;
                      const active = route.id === browseId;
                      return (
                        <li key={route.id}>
                          <button
                            type="button"
                            className={cn(
                              'w-full rounded-md px-2 py-2 text-left hover:bg-muted/50',
                              active && 'bg-muted',
                            )}
                            onClick={() => setBrowseId(route.id)}
                          >
                            <span className="flex items-center gap-2">
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">{route.name}</span>
                              {inUse ? (
                                <Badge variant="outline" className="shrink-0 text-xs font-normal">
                                  This recipe
                                </Badge>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {routeStepMetaLine(preview)}
                              {recipeCount(route.id) > 0 ? ` · ${recipeCount(route.id)} recipe${recipeCount(route.id) === 1 ? '' : 's'}` : ''}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 gap-2 border-t border-border p-2">
                <Input
                  value={newName}
                  placeholder="New route name"
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleCreate();
                  }}
                />
                <Button type="button" size="sm" disabled={creating || !newName.trim()} onClick={() => void handleCreate()}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
              {!browsed ? (
                <p className="text-sm text-muted-foreground">Select a route.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{browsed.name}</p>
                      <p className="text-xs text-muted-foreground">{routeStepMetaLine(browsedPreview)}</p>
                    </div>
                    <Button type="button" size="sm" disabled={disabled} onClick={() => handleUse(browsed.id)}>
                      Use for this recipe
                    </Button>
                  </div>
                  {browsedPreview.length > 0 ? (
                    <RouteFlowPreview steps={browsedPreview} />
                  ) : (
                    <p className="text-sm text-muted-foreground">No lines on this route yet.</p>
                  )}
                  <ul className="flex flex-col gap-1">
                    {[...browsedSteps]
                      .sort((a, b) => a.step_order - b.step_order)
                      .map((step, index) => {
                        const line = lines.find((row) => row.id === step.production_line_id);
                        return (
                          <li
                            key={step.id}
                            className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                          >
                            <span className="w-5 text-xs text-muted-foreground">{index + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-sm">{line?.name ?? step.name}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled={deletingStep}
                              aria-label={`Remove ${line?.name ?? step.name}`}
                              onClick={() => void handleDeleteStep(step)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        );
                      })}
                  </ul>
                  <Popover open={addOpen} onOpenChange={setAddOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" size="sm" variant="outline" disabled={lines.length === 0}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add line
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(20rem,92vw)] p-3" align="start">
                      <Label className="mb-2 block text-xs text-muted-foreground">Production line</Label>
                      <RouteStepPicker
                        embedded
                        lines={lines}
                        isAdding={addingStep}
                        onAdd={(payload) => void handleAddLine(payload)}
                        onAdded={() => setAddOpen(false)}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SetupRoutePicker;
