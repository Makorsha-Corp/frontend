import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import FormulaStageMaterialsBlock, {
  type FormulaStageMaterialsHandle,
} from '@/components/newcomponents/customui/production/FormulaStageMaterialsBlock';

import SetupRecipeStepList, {
  type SetupRecipeStepListHandle,
} from '@/components/newcomponents/customui/production/SetupRecipeStepList';

import SetupRecipePathPanel from '@/components/newcomponents/customui/production/SetupRecipePathPanel';

import {

  useGetAllFormulaStageItemsQuery,

  useGetFormulaStagesQuery,

  useGetProductionRouteStepsQuery,

  useUpdateFormulaStageMutation,

} from '@/features/production/productionApi';

import type { ProductionFormula, ProductionLine, ProductionRouteStep } from '@/types/production';

import { appToast } from '@/lib/appToast';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { Loader2, Info, Plus } from 'lucide-react';



function stationSummary(

  fill: ProductionRouteStep | undefined,

  lines: ProductionLine[],

): string {

  if (!fill || fill.production_line_id == null) return 'No station yet';

  const line = lines.find((row) => row.id === fill.production_line_id);

  if (!line) return 'Station set';

  return line.name;

}



interface SetupRecipeWorkspaceProps {

  factoryId: number | null;

  formulas: ProductionFormula[];

  loadingFormulas: boolean;

  formulasError: unknown;

  lines: ProductionLine[];

  items: { id: number; name: string; unit?: string }[];

  getItemName: (id: number) => string;

  onAddRecipe: () => void;

  onEditRecipe: (formulaId: number) => void;

  onDeleteRecipe?: (formulaId: number) => void;

  isDeletingRecipe?: boolean;

  focusFormulaId?: number | null;

  onFocusFormulaHandled?: () => void;

}



const SetupRecipeWorkspace: React.FC<SetupRecipeWorkspaceProps> = ({

  factoryId,

  formulas,

  loadingFormulas,

  formulasError,

  lines,

  items,

  getItemName,

  onAddRecipe,

  onEditRecipe,

  onDeleteRecipe,

  isDeletingRecipe = false,

  focusFormulaId = null,

  onFocusFormulaHandled,

}) => {

  const { t } = useTranslation('production');

  const [selectedFormulaId, setSelectedFormulaId] = useState<number | null>(null);

  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);

  const materialsRef = useRef<FormulaStageMaterialsHandle>(null);

  const stepsRef = useRef<SetupRecipeStepListHandle>(null);

  const [materialsDirty, setMaterialsDirty] = useState(false);

  const [stepsDirty, setStepsDirty] = useState(false);

  const [savingRecipe, setSavingRecipe] = useState(false);

  const recipeDirty = materialsDirty || stepsDirty;

  useEffect(() => {

    if (!recipeDirty) return undefined;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {

      event.preventDefault();

    };

    window.addEventListener('beforeunload', onBeforeUnload);

    return () => window.removeEventListener('beforeunload', onBeforeUnload);

  }, [recipeDirty]);

  const toastError = (error: unknown, fallback: string) => {

    const detail = (error as { data?: { detail?: string } })?.data?.detail;

    appToast.error(detail || fallback);

  };



  const [updateStage] = useUpdateFormulaStageMutation();



  useEffect(() => {

    const active = formulas.filter((row) => row.is_active);

    if (active.length === 0) {

      setSelectedFormulaId(null);

      return;

    }

    setSelectedFormulaId((prev) =>

      prev != null && active.some((formula) => formula.id === prev) ? prev : active[0].id,

    );

  }, [formulas]);



  useEffect(() => {

    if (focusFormulaId == null) return;

    const target = formulas.find((row) => row.id === focusFormulaId && row.is_active);

    if (!target) return;

    setSelectedFormulaId(target.id);

    onFocusFormulaHandled?.();

  }, [focusFormulaId, formulas, onFocusFormulaHandled]);



  const formula = formulas.find((row) => row.id === selectedFormulaId) ?? null;

  const formulaId = formula?.id ?? 0;

  const routeId = formula?.route_id ?? null;



  const { data: stagesRaw = [], isLoading: loadingStages } = useGetFormulaStagesQuery(formulaId, {

    skip: !formula,

  });

  const stages = useMemo(

    () => [...stagesRaw].sort((a, b) => a.stage_order - b.stage_order),

    [stagesRaw],

  );

  const { data: stageItems = [], isLoading: loadingItems } = useGetAllFormulaStageItemsQuery(formulaId, {

    skip: !formula,

  });



  useEffect(() => {

    setSelectedStageId(null);

  }, [formula?.id]);



  useEffect(() => {

    if (stages.length === 0) {

      setSelectedStageId(null);

      return;

    }

    setSelectedStageId((prev) =>

      prev != null && stages.some((stage) => stage.id === prev) ? prev : stages[0].id,

    );

  }, [stages]);



  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? null;



  const selectedStageIndex = selectedStage ? stages.findIndex((stage) => stage.id === selectedStage.id) : -1;

  const previousStageForHandoff = selectedStageIndex > 0 ? stages[selectedStageIndex - 1] : null;

  const previousOutputCount = previousStageForHandoff

    ? stageItems.filter(

        (row) => row.formula_stage_id === previousStageForHandoff.id && row.item_role === 'output',

      ).length

    : 0;

  const inputHandoff = {

    requiresPreviousOutputs: selectedStageIndex > 0,

    previousOutputCount,

  };



  const { data: fillsRaw = [] } = useGetProductionRouteStepsQuery(routeId ?? 0, {

    skip: !routeId,

  });



  const pathSteps = useMemo(() => {

    return stages.map((stage) => {

      const fill =

        fillsRaw.find((step) => step.id === stage.route_step_id) ??

        fillsRaw.find((step) => step.step_order === stage.stage_order);

      return {

        id: fill?.id ?? stage.id,

        stageId: stage.id,

        name: stage.name,

        unassigned: !fill || fill.production_line_id == null,

        fill,

      };

    });

  }, [stages, fillsRaw]);



  const selectedFill = pathSteps.find((step) => step.stageId === selectedStageId) ?? null;



  const selectedStepDisplayName = useMemo(() => {

    if (!selectedStage) return undefined;

    const step = pathSteps.find((row) => row.stageId === selectedStage.id);

    if (!step) return selectedStage.name;

    return step.unassigned ? step.name : stationSummary(step.fill, lines);

  }, [selectedStage, pathSteps, lines]);



  const handlePatchStage = async (

    stageId: number,

    data: { expected_duration_minutes?: number | null },

  ) => {

    if (!formula) return;

    try {

      await updateStage({ id: stageId, formulaId: formula.id, data }).unwrap();

    } catch (error: unknown) {

      toastError(error, 'Failed to update step');

      throw error;

    }

  };



  const selectFormula = (id: number) => {

    if (id === selectedFormulaId) return;

    if (recipeDirty && !window.confirm('Discard unsaved recipe edits?')) return;

    setMaterialsDirty(false);

    setStepsDirty(false);

    setSelectedFormulaId(id);

  };



  const saveRecipeEdits = async () => {

    setSavingRecipe(true);

    try {

      const materialsOk = (await materialsRef.current?.save()) ?? true;

      const stepsOk = (await stepsRef.current?.save()) ?? true;

      if (materialsOk && stepsOk) appToast.success(t('recipeSaved'));

    } finally {

      setSavingRecipe(false);

    }

  };



  return (

    <div className="flex min-h-0 flex-1 overflow-hidden">

      <div className="flex w-56 shrink-0 flex-col border-r border-border">

        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">

          <div className="flex min-w-0 items-center gap-0.5">

            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recipes')}</span>

            <Tooltip>

              <TooltipTrigger asChild>

                <Button

                  type="button"

                  variant="ghost"

                  size="icon"

                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"

                  aria-label={t('aboutRecipes')}

                >

                  <Info className="h-3.5 w-3.5" />

                </Button>

              </TooltipTrigger>

              <TooltipContent side="bottom" align="start" className="max-w-xs text-sm">

                {t('aboutRecipesBody')}

              </TooltipContent>

            </Tooltip>

          </div>

          <Button type="button" size="sm" variant="outline" onClick={onAddRecipe}>

            <Plus className="h-4 w-4" />

          </Button>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">

          {formulasError ? (

            <p className="px-1 text-sm text-destructive">{t('failedRecipes')}</p>

          ) : loadingFormulas ? (

            <div className="flex justify-center py-6">

              <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />

            </div>

          ) : formulas.length === 0 ? (

            <p className="px-1 text-sm text-muted-foreground">{t('noRecipesYet')}</p>

          ) : (

            <div className="flex flex-col gap-1">

              {formulas.map((row) => (

                <button

                  key={row.id}

                  type="button"

                  onClick={() => selectFormula(row.id)}

                  className={`rounded-md px-2 py-1.5 text-left text-sm ${

                    row.id === formula?.id ? 'bg-brand-primary/10 font-medium' : 'hover:bg-muted/40'

                  }`}

                >

                  <span className="block truncate">{row.name}</span>

                  <span className="block truncate text-xs text-muted-foreground">{row.formula_code}</span>

                </button>

              ))}

            </div>

          )}

        </div>

      </div>



      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {!formula ? (

          <p className="p-4 text-sm text-muted-foreground">{t('addRecipeHint')}</p>

        ) : (

          <>

            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">{formula.name}</p>

                <p className="truncate text-xs text-muted-foreground">{formula.formula_code}</p>

              </div>

              <div className="flex shrink-0 items-center gap-2">

                <Button
                  type="button"
                  size="sm"
                  disabled={!recipeDirty || savingRecipe}
                  onClick={() => void saveRecipeEdits()}
                >
                  {savingRecipe ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                </Button>

                <Button type="button" size="sm" variant="outline" onClick={() => onEditRecipe(formula.id)}>

                  {t('editRecipe')}

                </Button>

                {onDeleteRecipe ? (

                  <Button

                    type="button"

                    size="sm"

                    variant="outline"

                    className="text-destructive hover:text-destructive"

                    disabled={isDeletingRecipe}

                    onClick={() => onDeleteRecipe(formula.id)}

                  >

                    {isDeletingRecipe ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate recipe'}

                  </Button>

                ) : null}

              </div>

            </div>



            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-2">

              <div className="flex min-h-0 flex-col gap-3 overflow-y-auto border-border p-4 md:border-r">

                <SetupRecipePathPanel
                  formulaId={formula.id}
                  factoryId={factoryId}
                  routeId={routeId}
                  stages={stages}
                  routeSteps={fillsRaw}
                  lines={lines}
                />

                {loadingStages ? (

                  <div className="flex justify-center py-6">

                    <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />

                  </div>

                ) : (

                  <div className="flex min-h-0 flex-1 flex-col gap-3">

                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Run defaults
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Default time and output per step. Skip steps when creating a batch.
                    </p>
                    <SetupRecipeStepList
                      key={formula.id}
                      ref={stepsRef}
                      stages={stages}
                      fills={fillsRaw}
                      lines={lines}
                      stageItems={stageItems}
                      getItemName={getItemName}
                      selectedStageId={selectedStageId}
                      onSelect={setSelectedStageId}
                      onPatch={(stageId, data) => handlePatchStage(stageId, data)}
                      onDirtyChange={setStepsDirty}
                    />
                  </div>

                )}

              </div>

              <div className="min-h-0 overflow-y-auto p-4">

                {selectedStage ? (

                  <FormulaStageMaterialsBlock

                    key={formula.id}

                    ref={materialsRef}

                    formulaId={formula.id}

                    stageId={selectedStage.id}

                    stageTitle={selectedStepDisplayName}

                    stageUnassigned={selectedFill?.unassigned ?? false}

                    stageItems={stageItems.filter((row) => row.formula_stage_id === selectedStage.id)}

                    items={items}

                    getItemName={getItemName}

                    factoryId={factoryId}

                    isLoading={loadingItems}

                    inputHandoff={inputHandoff}

                    onDirtyChange={setMaterialsDirty}

                  />

                ) : (

                  <p className="text-sm text-muted-foreground">{t('selectStepHint')}</p>

                )}

              </div>

            </div>

          </>

        )}

      </div>

    </div>

  );

};



export default SetupRecipeWorkspace;

