import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ItemRole,
  ProductionBatchItem,
  ProductionBatchStageItem,
  ProductionBatchStageLog,
  ProductionBatchStageParameter,
  ProductionFormulaStage,
  ProductionFormulaStageItem,
  ProductionFormulaStageParameter,
} from '@/types/production';
import type { SaveBatchConditionInput } from '@/lib/batchStageConditionSave';
import {
  buildBatchStepMaterialRows,
  isMaterialActualMissing,
  type BatchStepMaterialRow,
} from '@/lib/batchStepMaterialRows';
import { formatProductionQuantity } from '@/lib/productionQuantity';
import {
  resolveConditionPlannedDisplay,
  shortenConditionUnitLabel,
  sortStageParameters,
} from '@/lib/productionStageMaterialsDisplay';
import { cn } from '@/lib/utils';

const EXPECTED_COL_CLASS = 'w-[4.5rem]';
const ACTUAL_COL_CLASS = 'w-[5.75rem]';
const CONDITION_LABEL_COL_CLASS = 'min-w-0 w-[42%] max-w-[11rem]';
const EXPECTED_INPUT_CLASS = `ml-auto h-9 ${EXPECTED_COL_CLASS} max-w-[4.5rem] px-2 text-right tabular-nums`;
const ACTUAL_INPUT_CLASS = `ml-auto h-9 ${ACTUAL_COL_CLASS} max-w-[5.75rem] px-2 text-right tabular-nums`;

export type BatchRunStepMaterialsHandle = {
  flushDraftActuals: () => Promise<{
    ok: boolean;
    mergedStepItems: ProductionBatchStageItem[];
  }>;
  saveConditions: () => Promise<{
    ok: boolean;
    changed: boolean;
    parameters: ProductionBatchStageParameter[];
  }>;
};

export interface BatchRunStepMaterialsProps {
  stageLog: ProductionBatchStageLog | null;
  stageLogs?: ProductionBatchStageLog[];
  formulaStageItems: ProductionFormulaStageItem[];
  formulaStages?: Pick<ProductionFormulaStage, 'id' | 'expected_output_item_id'>[];
  batchItems: ProductionBatchItem[];
  stepItems?: ProductionBatchStageItem[];
  getItemName: (id: number) => string;
  canMutateItems: boolean;
  canEditActuals: boolean;
  onSaveExpected: (row: ProductionBatchItem, raw: string) => void;
  onSaveActual: (row: ProductionBatchItem, raw: string) => void;
  onSaveStepInput?: (
    row: ProductionBatchStageItem,
    raw: string,
    options?: { silent?: boolean },
  ) => Promise<boolean> | boolean | void;
  stageParameters?: ProductionBatchStageParameter[];
  formulaStageParameters?: ProductionFormulaStageParameter[];
  onSaveCondition?: (
    input: SaveBatchConditionInput,
  ) => Promise<
    | { ok: true; parameter?: ProductionBatchStageParameter }
    | { ok: false }
    | void
  >;
  sectionBreakBleedClassName?: string;
  highlightMissingActualRowKeys?: string[];
  highlightMissingConditionSourceIds?: number[];
  materialsSectionRef?: React.RefObject<HTMLDivElement | null>;
}

type MaterialRow = BatchStepMaterialRow;

const BatchRunStepMaterials = forwardRef<BatchRunStepMaterialsHandle, BatchRunStepMaterialsProps>(({
  stageLog,
  stageLogs = [],
  formulaStageItems,
  formulaStages = [],
  batchItems,
  stepItems = [],
  getItemName,
  canMutateItems,
  canEditActuals,
  onSaveActual,
  onSaveStepInput,
  stageParameters = [],
  formulaStageParameters = [],
  onSaveCondition,
  sectionBreakBleedClassName = '-mx-4',
  highlightMissingActualRowKeys = [],
  highlightMissingConditionSourceIds = [],
  materialsSectionRef,
}, ref) => {
  const missingActualKeySet = useMemo(
    () => new Set(highlightMissingActualRowKeys),
    [highlightMissingActualRowKeys],
  );
  const missingConditionSourceIdSet = useMemo(
    () => new Set(highlightMissingConditionSourceIds),
    [highlightMissingConditionSourceIds],
  );
  const [draftActual, setDraftActual] = useState<Record<number, string>>({});
  const [draftConditionActual, setDraftConditionActual] = useState<Record<string, string>>({});
  const [draftConditionPlanned, setDraftConditionPlanned] = useState<Record<string, string>>({});

  const rows = useMemo(
    (): MaterialRow[] =>
      buildBatchStepMaterialRows({ stageLog, formulaStageItems, batchItems, stepItems }),
    [stageLog, formulaStageItems, batchItems, stepItems],
  );

  const byRole = useMemo(() => {
    const map: Record<ItemRole, MaterialRow[]> = {
      input: [],
      output: [],
      waste: [],
      byproduct: [],
    };
    for (const row of rows) {
      map[row.role].push(row);
    }
    return map;
  }, [rows]);

  const formulaConditionsForStage = useMemo(() => {
    const stageId = stageLog?.formula_stage_id;
    if (stageId == null) return [];
    return sortStageParameters(
      formulaStageParameters.filter((row) => row.formula_stage_id === stageId),
    );
  }, [stageLog?.formula_stage_id, formulaStageParameters]);

  const stepOpen = stageLog?.status === 'pending' || stageLog?.status === 'in_progress';
  const canEditConditions =
    stepOpen && (canMutateItems || canEditActuals) && Boolean(onSaveCondition);

  const displayConditions = useMemo(() => {
    const stageId = stageLog?.formula_stage_id ?? null;
    const batchBySource = new Map<number, ProductionBatchStageParameter>();
    for (const row of stageParameters) {
      if (row.source_parameter_id != null) {
        batchBySource.set(row.source_parameter_id, row);
      }
    }

    const batchParamsForStage = stageParameters.filter((batchParam) => {
      if (batchParam.source_parameter_id == null) return true;
      const source = formulaStageParameters.find((fp) => fp.id === batchParam.source_parameter_id);
      if (source == null) return false;
      if (stageId == null) return true;
      return source.formula_stage_id === stageId;
    });

    if (formulaConditionsForStage.length > 0) {
      return formulaConditionsForStage.map((formulaRow) => {
        const batchParam = batchBySource.get(formulaRow.id) ?? null;
        const baseLabel = batchParam?.label ?? formulaRow.label;
        const { planned, unitSuffix } = resolveConditionPlannedDisplay({
          planned_value: batchParam?.planned_value ?? formulaRow.planned_value,
          planned_value_numeric:
            batchParam?.planned_value_numeric ?? formulaRow.planned_value_numeric,
          unit: batchParam?.unit ?? formulaRow.unit,
        });
        return {
          key: batchParam ? `batch-${batchParam.id}` : `formula-${formulaRow.id}`,
          label: baseLabel,
          planned,
          unit: unitSuffix,
          batchParam,
          sourceParameterId: formulaRow.id,
        };
      });
    }

    return batchParamsForStage.map((batchParam) => {
      const { planned, unitSuffix } = resolveConditionPlannedDisplay({
        planned_value: batchParam.planned_value,
        planned_value_numeric: batchParam.planned_value_numeric,
        unit: batchParam.unit,
      });
      return {
        key: `batch-${batchParam.id}`,
        label: batchParam.label,
        planned,
        unit: unitSuffix,
        batchParam,
        sourceParameterId: batchParam.source_parameter_id,
      };
    });
  }, [stageParameters, formulaConditionsForStage, formulaStageParameters, stageLog?.formula_stage_id]);

  const hasAnyConditions = displayConditions.length > 0;

  const saveConditions = async () => {
    let ok = true;
    let changed = false;
    const parameters: ProductionBatchStageParameter[] = [];
    for (const row of displayConditions) {
      const draftKey = row.batchParam?.id ?? row.key;
      const plannedDraft = draftConditionPlanned[draftKey];
      if (plannedDraft != null && plannedDraft !== row.planned) {
        const result = await onSaveCondition?.({
          field: 'planned_value',
          batchParam: row.batchParam,
          sourceParameterId: row.sourceParameterId,
          raw: plannedDraft,
          persistedPlanned: row.planned,
        });
        if (result && !result.ok) ok = false;
        if (result?.ok && result.parameter) {
          changed = true;
          parameters.push(result.parameter);
        }
      }
      const actualDraft = draftConditionActual[draftKey];
      const savedActual = row.batchParam?.actual_value ?? '';
      if (actualDraft != null && actualDraft !== String(savedActual)) {
        const result = await onSaveCondition?.({
          field: 'actual_value',
          batchParam: row.batchParam,
          sourceParameterId: row.sourceParameterId,
          raw: actualDraft,
        });
        if (result && !result.ok) ok = false;
        if (result?.ok && result.parameter) {
          changed = true;
          parameters.push(result.parameter);
        }
      }
    }
    return { ok, changed, parameters };
  };

  useImperativeHandle(
    ref,
    () => ({
      saveConditions,
      flushDraftActuals: async () => {
        if (!stageLog || !onSaveStepInput) {
          return { ok: true, mergedStepItems: stepItems };
        }
        const rowsForStep = buildBatchStepMaterialRows({
          stageLog,
          formulaStageItems,
          batchItems,
          stepItems,
        });
        const mergedById = new Map(stepItems.map((row) => [row.id, { ...row }]));
        for (const row of rowsForStep) {
          const stepRow = row.stepItem;
          if (!stepRow) continue;
          const canEdit =
            stageLog.status === 'pending' || stageLog.status === 'in_progress';
          if (!canEdit) continue;
          const draftKey = stepRow.id;
          const draftVal = draftActual[draftKey];
          if (draftVal === undefined) continue;
          const saved =
            stepRow.actual_quantity != null ? String(stepRow.actual_quantity) : '';
          if (draftVal.trim() === saved.trim()) {
            continue;
          }
          const result = await onSaveStepInput(stepRow, draftVal, { silent: true });
          if (result === false) {
            return { ok: false, mergedStepItems: stepItems };
          }
          const parsed =
            draftVal.trim() === ''
              ? null
              : Number.parseFloat(draftVal.trim());
          const nextActual =
            draftVal.trim() === '' || !Number.isFinite(parsed) ? null : parsed;
          mergedById.set(stepRow.id, { ...stepRow, actual_quantity: nextActual });
          setDraftActual((prev) => {
            const next = { ...prev };
            delete next[draftKey];
            return next;
          });
        }
        return { ok: true, mergedStepItems: [...mergedById.values()] };
      },
    }),
    [
      stageLog,
      onSaveStepInput,
      stepItems,
      formulaStageItems,
      batchItems,
      draftActual,
      saveConditions,
    ],
  );

  const renderMaterialTable = (roleRows: MaterialRow[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className={`${EXPECTED_COL_CLASS} text-right`}>Expected</TableHead>
          <TableHead className={`${ACTUAL_COL_CLASS} text-right`}>Actual</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roleRows.map((row) => {
          const bi = row.batchItem;
          const stepRow = row.stepItem;
          const editStepActual =
            stepRow != null &&
            (stageLog?.status === 'pending' || stageLog?.status === 'in_progress') &&
            Boolean(onSaveStepInput);
          const draftKey = stepRow != null ? stepRow.id : bi?.id;
          const emphasizeActual =
            missingActualKeySet.has(row.key) && isMaterialActualMissing(row);

          return (
            <TableRow
              key={row.key}
              className={cn(emphasizeActual && 'bg-amber-500/10 dark:bg-amber-500/15')}
            >
              <TableCell className="font-medium">
                <div>{getItemName(row.itemId)}</div>
              </TableCell>
              <TableCell className="text-right">
                <span className="tabular-nums">
                  {row.expected != null ? formatProductionQuantity(Number(row.expected)) : '—'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {editStepActual && stepRow ? (
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      className={cn(
                        ACTUAL_INPUT_CLASS,
                        emphasizeActual &&
                          'border-amber-500 ring-2 ring-amber-500/40 focus-visible:ring-amber-500',
                      )}
                      inputMode="decimal"
                      value={
                        draftActual[stepRow.id] ??
                        (stepRow.actual_quantity != null ? String(stepRow.actual_quantity) : '')
                      }
                      aria-invalid={emphasizeActual || undefined}
                      onChange={(e) => {
                        setDraftActual((prev) => ({ ...prev, [stepRow.id]: e.target.value }));
                      }}
                      onBlur={() =>
                        onSaveStepInput?.(
                          stepRow,
                          draftActual[stepRow.id] ??
                            (stepRow.actual_quantity != null ? String(stepRow.actual_quantity) : ''),
                        )
                      }
                    />
                    {row.unit ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{row.unit}</span>
                    ) : null}
                  </div>
                ) : stepRow == null && bi && (canMutateItems || canEditActuals) ? (
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      className={cn(
                        ACTUAL_INPUT_CLASS,
                        emphasizeActual &&
                          'border-amber-500 ring-2 ring-amber-500/40 focus-visible:ring-amber-500',
                      )}
                      inputMode="decimal"
                      value={
                        draftKey != null
                          ? draftActual[draftKey] ??
                            (bi.actual_quantity != null ? String(bi.actual_quantity) : '')
                          : ''
                      }
                      aria-invalid={emphasizeActual || undefined}
                      onChange={(e) => {
                        if (draftKey == null) return;
                        setDraftActual((prev) => ({ ...prev, [draftKey]: e.target.value }));
                      }}
                      onBlur={() =>
                        onSaveActual(
                          bi,
                          draftKey != null
                            ? draftActual[draftKey] ??
                              (bi.actual_quantity != null ? String(bi.actual_quantity) : '')
                            : '',
                        )
                      }
                    />
                    {row.unit ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{row.unit}</span>
                    ) : null}
                  </div>
                ) : (
                  <span className="tabular-nums">
                    {row.actual != null ? formatProductionQuantity(Number(row.actual)) : '—'}
                    {row.unit ? ` ${row.unit}` : ''}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const renderEmptySide = (label: string) => (
    <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">
      No {label.toLowerCase()} lines yet
    </p>
  );

  if (!stageLog) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
        Select a step to view materials.
      </p>
    );
  }

  if (rows.length === 0 && !hasAnyConditions) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
        No materials for this step.
      </p>
    );
  }

  const inputRows = byRole.input;
  const outputRows = byRole.output;
  const wasteRows = byRole.waste;
  const byproductRows = byRole.byproduct;
  const hasOutputSection = outputRows.length > 0 || wasteRows.length > 0 || byproductRows.length > 0;

  const sectionTitle = (label: string) => (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
  );

  const conditionsTable = hasAnyConditions ? (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className={cn(CONDITION_LABEL_COL_CLASS, 'px-2')}>
            <span className="block truncate">Condition</span>
          </TableHead>
          <TableHead className={cn(EXPECTED_COL_CLASS, 'px-2 text-right')}>Expected</TableHead>
          <TableHead className={cn(ACTUAL_COL_CLASS, 'px-2 text-right')}>Actual</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayConditions.map((row) => {
          const draftKey = row.batchParam?.id ?? row.key;
          const plannedVal = draftConditionPlanned[draftKey] ?? row.planned;
          const actVal =
            draftConditionActual[draftKey] ??
            (row.batchParam?.actual_value != null ? row.batchParam.actual_value : '');
          const emphasizeConditionActual =
            row.sourceParameterId != null &&
            missingConditionSourceIdSet.has(row.sourceParameterId) &&
            (row.batchParam?.actual_value == null ||
              String(row.batchParam.actual_value).trim() === '');
          return (
            <TableRow
              key={row.key}
              className={cn(emphasizeConditionActual && 'bg-amber-500/10 dark:bg-amber-500/15')}
            >
              <TableCell className={cn(CONDITION_LABEL_COL_CLASS, 'px-2 py-2')}>
                <div
                  className="flex min-w-0 items-baseline gap-1.5"
                  title={[row.label, row.unit].filter(Boolean).join(' · ')}
                >
                  <span className="min-w-0 truncate font-medium">{row.label}</span>
                  {row.unit ? (
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground" title={row.unit}>
                      {shortenConditionUnitLabel(row.unit)}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="px-2 text-right">
                {canEditConditions ? (
                  <Input
                    className={EXPECTED_INPUT_CLASS}
                    value={plannedVal}
                    onChange={(e) =>
                      setDraftConditionPlanned((prev) => ({
                        ...prev,
                        [draftKey]: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <span className="tabular-nums">{row.planned || '—'}</span>
                )}
              </TableCell>
              <TableCell className="px-2 text-right">
                {canEditConditions ? (
                  <Input
                    className={cn(
                      ACTUAL_INPUT_CLASS,
                      emphasizeConditionActual &&
                        'border-amber-500 ring-2 ring-amber-500/40 focus-visible:ring-amber-500',
                    )}
                    value={actVal}
                    aria-invalid={emphasizeConditionActual || undefined}
                    onChange={(e) =>
                      setDraftConditionActual((prev) => ({
                        ...prev,
                        [draftKey]: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <span className="tabular-nums">
                    {row.batchParam?.actual_value?.trim() ? row.batchParam.actual_value : '—'}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  ) : null;

  return (
    <div ref={materialsSectionRef} className="min-w-0 scroll-mt-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:items-stretch md:gap-y-4">
      <div className="min-h-[8rem] min-w-0 space-y-4 md:pr-5">
        <div className="space-y-2">
          {inputRows.length > 0 ? sectionTitle('Inputs') : null}
          {inputRows.length > 0 ? renderMaterialTable(inputRows) : renderEmptySide('inputs')}
        </div>

        {hasAnyConditions ? (
          <div className="space-y-2">
            {sectionTitle('Conditions')}
            {conditionsTable}
          </div>
        ) : null}
      </div>

      <div
        className="max-md:hidden min-h-[8rem] w-px shrink-0 bg-border"
        role="separator"
        aria-orientation="vertical"
        aria-hidden
      />

      <div className="min-h-[8rem] min-w-0 space-y-4 md:pl-5">
        {hasOutputSection ? (
          <>
            {outputRows.length > 0 ? (
              <div className="space-y-2">
                {sectionTitle('Outputs')}
                {renderMaterialTable(outputRows)}
              </div>
            ) : null}
            {(wasteRows.length > 0 || byproductRows.length > 0) && (
              <>
                {outputRows.length > 0 ? (
                  <div
                    className={cn('h-px shrink-0 bg-border', sectionBreakBleedClassName)}
                    role="separator"
                    aria-hidden
                  />
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0 space-y-2">
                    {sectionTitle('Waste')}
                    {wasteRows.length > 0 ? renderMaterialTable(wasteRows) : renderEmptySide('waste')}
                  </div>
                  <div className="min-w-0 space-y-2">
                    {sectionTitle('Byproducts')}
                    {byproductRows.length > 0 ? renderMaterialTable(byproductRows) : renderEmptySide('byproduct')}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          renderEmptySide('outputs')
        )}
      </div>
    </div>
    </div>
  );
});

BatchRunStepMaterials.displayName = 'BatchRunStepMaterials';

export default BatchRunStepMaterials;
