import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RouteFlowPreview from '@/components/newcomponents/customui/production/RouteFlowPreview';
import { buildWorkspaceFlowSteps } from '@/components/newcomponents/customui/production/productionRoutePreview';
import {
  useGetProductionRouteByIdQuery,
  useGetProductionRouteStepsQuery,
  useUpdateProductionRouteMutation,
} from '@/features/production/productionApi';
import type { ProductionFormulaStage, ProductionLine } from '@/types/production';
import { appToast } from '@/lib/appToast';

interface SetupRecipePathEditorProps {
  routeId: number | null;
  stages: ProductionFormulaStage[];
  lines: ProductionLine[];
}

const SetupRecipePathEditor: React.FC<SetupRecipePathEditorProps> = ({ routeId, stages, lines }) => {
  const { data: route } = useGetProductionRouteByIdQuery(routeId ?? 0, { skip: !routeId });
  const { data: steps = [] } = useGetProductionRouteStepsQuery(routeId ?? 0, { skip: !routeId });
  const [updateRoute] = useUpdateProductionRouteMutation();
  const [nameDraft, setNameDraft] = useState('');

  useEffect(() => {
    setNameDraft(route?.name ?? '');
  }, [route?.id, route?.name]);

  const flowSteps = buildWorkspaceFlowSteps(stages, steps, lines);

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

  if (!routeId) {
    return (
      <p className="text-sm text-muted-foreground">
        No path yet. Add a production line below to start this recipe&apos;s path.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-1.5">
        <Label htmlFor="recipe-path-name">Path name</Label>
        <Input
          id="recipe-path-name"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => void saveName()}
          placeholder="Recipe path"
        />
      </div>
      {flowSteps.length > 0 ? <RouteFlowPreview steps={flowSteps} size="compact" /> : null}
    </div>
  );
};

export default SetupRecipePathEditor;
