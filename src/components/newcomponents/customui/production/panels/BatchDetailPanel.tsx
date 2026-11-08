import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useGetProductionBatchByIdQuery,
  useGetBatchItemsQuery,
  useGetBatchStageLogsQuery,
  useGetBatchStageParametersQuery,
  useGetBatchStageItemsQuery,
  useUpdateBatchStageItemMutation,
  useUpdateBatchStageParameterMutation,
  useSetBatchStageParameterBySourceMutation,
  useGetFormulaStagesQuery,
  useGetAllFormulaStageItemsQuery,
  useGetAllFormulaStageParametersQuery,
  useUpdateBatchItemMutation,
  useUpdateProductionBatchMutation,
  useDeleteProductionBatchMutation,
  useRevertBatchToDraftMutation,
  useStartBatchStageLogMutation,
  useFinishBatchStageLogMutation,
  useUpdateBatchStageLogMutation,
  useGetLinkedProductionOrdersQuery,
} from '@/features/production/productionApi';
import { plannedStartLocalFromIso } from '@/lib/plannedStartLocal';
import { useAppSelector } from '@/app/hooks';
import {
  evaluateMachinePick,
  hasLiveStepConflictOnMachine,
  machinePickWarningLabel,
  parseProductionMachinePickPolicy,
  warningsForStartStepConfirm,
  type MachinePickWarningReason,
} from '@/lib/productionMachinePickPolicy';
import { plannedWindowIncludesNow } from '@/lib/machinePickerAvailability';
import { useGetMachineByIdQuery } from '@/features/machines/machinesApi';
import { findShiftForDate } from '@/lib/workspaceShiftChipUtils';
import {
  findProductionScheduleConflicts,
  sequentialStepWindows,
  type ProductionScheduleConflict,
} from '@/components/newcomponents/customui/production/productionScheduleConflict';
import {
  mergeScheduleBatchesForLiveWork,
  scheduleBatchFromOpenRun,
  buildMachineLiveWorkMap,
  buildMachineOccupancyForWindow,
  findLiveWorkOnMachine,
} from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import { ProductionScheduleConflictDialog } from '@/components/newcomponents/customui/production/ProductionScheduleConflictDialog';
import { ProductionMachinePickWarningDialog } from '@/components/newcomponents/customui/production/ProductionMachinePickWarningDialog';
import { ProductionStartLiveMachineDialog } from '@/components/newcomponents/customui/production/ProductionStartLiveMachineDialog';
import type { MachineLiveWork } from '@/components/newcomponents/customui/production/productionMachineOccupancy';
import ProductionLineMachineSelect, {
  machinesForLine,
  soleMachineIdOnLine,
  type ProductionPlannedWindow,
} from '@/components/newcomponents/customui/production/ProductionLineMachineSelect';
import type {
  ProductionLine,
  ProductionFormula,
  ProductionBatch,
  ProductionBatchItem,
  ProductionBatchStageParameter,
  ProductionBatchStageLog,
  ProductionBatchStageItem,
  ItemRole,
  ProductionScheduleBatch,
} from '@/types/production';
import {
  Loader2,
  Trash2,
  Play,
  Check,
  X,
} from 'lucide-react';
import {
  prepareBatchConditionSave,
  type SaveBatchConditionInput,
} from '@/lib/batchStageConditionSave';
import {
  getStepFinishReadiness,
  type StepFinishReadiness,
} from '@/lib/batchStepFinishReadiness';
import { batchStartStepDescription } from '@/lib/batchStartStepHeadline';
import { appToast } from '@/lib/appToast';
import { parseProductionQuantity } from '@/lib/productionQuantity';
import { formatOptionalPercent } from '../productionPageUtils';
import { resolveLineMachineIdForSchedule } from '../StationMachinesField';
import BatchRunVerticalStepper from './BatchRunVerticalStepper';
import BatchRunContextStrip from './BatchRunContextStrip';
import BatchRunSelectedStepPanel from './BatchRunSelectedStepPanel';
import BatchRunStepMaterials, {
  type BatchRunStepMaterialsHandle,
} from './BatchRunStepMaterials';
import { useGetWorkspaceShiftsQuery } from '@/features/workspaceShifts/workspaceShiftsApi';
import { millBatchDate } from '@/lib/millCalendarDate';
import { useMillTimezone } from '@/hooks/useMillTimezone';
import ProductionStartEarlierDialogButton from '@/components/newcomponents/customui/production/ProductionStartEarlierDialogButton';
import {
  defaultLocalDatetimeNow,
  startedAtForApi,
  validateStartedEarlier,
} from '@/lib/productionStartEarlier';
import {
  isLastOpenStep,
  earlierStepsBlockStart,
} from '@/lib/productionStepWorkflow';
import BatchStartStepDialogBody from '@/components/newcomponents/customui/production/BatchStartStepDialogBody';
import { useBatchInputStoragePreview } from '@/hooks/useBatchInputStoragePreview';
import { storageGapQty } from '@/lib/batchInputStorageCheck';
import BatchShortStockDialogs, {
  existingStorageForShort,
  type ShortStockSeed,
} from '@/components/newcomponents/customui/production/BatchShortStockDialogs';

function apiDetail(error: unknown, fallback: string): string {
  const detail = (error as { data?: { detail?: string } })?.data?.detail;
  return detail || fallback;
}

interface BatchDetailPanelProps {
  batchId: number;
  lines: ProductionLine[];
  factoryScheduleBatches: ProductionScheduleBatch[];
  onSchedulePlannedStartChange?: (plannedStartLocal: string) => void;
  formulas: ProductionFormula[];
  getItemName: (id: number) => string;
  getMachineName: (id: number) => string;
  getStatusBadge: (s: string) => string;
  onClose: () => void;
  onRequestStart: () => void;
  onComplete: (batch: ProductionBatch) => void;
  onCancel: (batch: ProductionBatch) => void;
  onDeleted: () => void;
  updateProductionBatch: ReturnType<typeof useUpdateProductionBatchMutation>[0];
  isUpdatingBatch: boolean;
  deleteProductionBatch: ReturnType<typeof useDeleteProductionBatchMutation>[0];
  isDeletingBatch: boolean;
}

function mergeSavedStageParameters(
  current: ProductionBatchStageParameter[],
  saved: ProductionBatchStageParameter[],
): ProductionBatchStageParameter[] {
  if (saved.length === 0) return current;
  const next = [...current];
  for (const row of saved) {
    const index = next.findIndex((item) => item.id === row.id);
    if (index >= 0) next[index] = { ...next[index], ...row };
    else next.push(row);
  }
  return next;
}

const BatchDetailPanel: React.FC<BatchDetailPanelProps> = ({
  batchId,
  lines,
  factoryScheduleBatches,
  onSchedulePlannedStartChange,
  formulas,
  getItemName,
  getMachineName,
  getStatusBadge,
  onClose,
  onRequestStart,
  onComplete,
  onCancel,
  onDeleted,
  updateProductionBatch,
  isUpdatingBatch: _isUpdatingBatch,
  deleteProductionBatch,
  isDeletingBatch,
}) => {
  const millTimezone = useMillTimezone();
  const {
    data: batch,
    isLoading: loadingBatch,
    error: batchError,
  } = useGetProductionBatchByIdQuery(batchId);
  const { data: batchItems = [] } = useGetBatchItemsQuery({ batchId }, { skip: !batchId });
  const [selectedStageLogId, setSelectedStageLogId] = useState<number | null>(null);
  const prevBatchIdForStepRef = useRef<number | null>(null);
  const { data: stageLogsRaw = [], isLoading: loadingStageLogs } = useGetBatchStageLogsQuery(batchId, {
    skip: !batchId,
  });
  const stageLogs = useMemo(
    () => [...stageLogsRaw].sort((a, b) => a.stage_order - b.stage_order || a.id - b.id),
    [stageLogsRaw]
  );

  useEffect(() => {
    if (stageLogs.length === 0) {
      setSelectedStageLogId(null);
      prevBatchIdForStepRef.current = batchId;
      return;
    }
    const batchChanged = prevBatchIdForStepRef.current !== batchId;
    prevBatchIdForStepRef.current = batchId;
    setSelectedStageLogId((prev) => {
      if (!batchChanged && prev != null && stageLogs.some((log) => log.id === prev)) {
        return prev;
      }
      const inProgress = stageLogs.find((log) => log.status === 'in_progress');
      if (inProgress) return inProgress.id;
      const pending = stageLogs.find((log) => log.status === 'pending');
      if (pending) return pending.id;
      return stageLogs[0].id;
    });
  }, [batchId, stageLogs]);
  const formulaIdForStages = batch?.formula_id ?? undefined;
  const { data: formulaStages = [] } = useGetFormulaStagesQuery(formulaIdForStages!, {
    skip: !formulaIdForStages,
  });
  const { data: formulaStageItems = [] } = useGetAllFormulaStageItemsQuery(formulaIdForStages ?? 0, {
    skip: !formulaIdForStages,
  });
  const { data: formulaStageParameters = [] } = useGetAllFormulaStageParametersQuery(
    formulaIdForStages ?? 0,
    { skip: !formulaIdForStages },
  );
  const { data: batchStageParameters = [] } = useGetBatchStageParametersQuery(batchId, {
    skip: !batchId,
  });
  const { data: batchStageItems = [] } = useGetBatchStageItemsQuery(batchId, {
    skip: !batchId,
  });
  const [updateBatchItem] = useUpdateBatchItemMutation();
  const [updateBatchStageItem] = useUpdateBatchStageItemMutation();
  const [updateBatchStageParameter] = useUpdateBatchStageParameterMutation();
  const [setBatchStageParameterBySource] = useSetBatchStageParameterBySourceMutation();
  const [startStageLog] = useStartBatchStageLogMutation();
  const [finishStageLog, { isLoading: finishingStep }] = useFinishBatchStageLogMutation();
  const [updateStageLog] = useUpdateBatchStageLogMutation();
  const [revertToDraft, { isLoading: isRevertingToDraft }] = useRevertBatchToDraftMutation();
  const { data: linkedOrders } = useGetLinkedProductionOrdersQuery(batchId, { skip: !batchId });
  const factoryForMachines = lines.find((row) => row.id === batch?.production_line_id)?.factory_id;

  const byRole = useMemo(() => {
    const map: Record<ItemRole, ProductionBatchItem[]> = {
      input: [],
      output: [],
      waste: [],
      byproduct: [],
    };
    for (const row of batchItems) {
      map[row.item_role as ItemRole].push(row);
    }
    return map;
  }, [batchItems]);

  const [editSelectedShiftId, setEditSelectedShiftId] = useState<number | null>(null);
  const { data: workspaceShifts = [] } = useGetWorkspaceShiftsQuery({ activeOnly: true });
  const [editExpectedOutput, setEditExpectedOutput] = useState('');
  const [editExpectedDuration, setEditExpectedDuration] = useState('');
  const [editActualOutput, setEditActualOutput] = useState('');
  const [editActualDuration, setEditActualDuration] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPlannedStart, setEditPlannedStart] = useState('');
  const [startStepLog, setStartStepLog] = useState<ProductionBatchStageLog | null>(null);
  const [startMachinePick, setStartMachinePick] = useState<number | null>(null);
  const [stepStartedEarlier, setStepStartedEarlier] = useState(false);
  const [stepStartedAtLocal, setStepStartedAtLocal] = useState(defaultLocalDatetimeNow);
  const [overlapConflicts, setOverlapConflicts] = useState<ProductionScheduleConflict[]>([]);
  const [startStepPickWarnings, setStartStepPickWarnings] = useState<MachinePickWarningReason[] | null>(
    null,
  );
  const [startStepLiveConflict, setStartStepLiveConflict] = useState<MachineLiveWork | null>(null);
  const pendingStartStepRef = useRef<{
    machineId?: number;
    started_at?: string;
  } | null>(null);
  const pendingOpenStageLogRef = useRef<ProductionBatchStageLog | null>(null);
  const startLiveAckMachineIdRef = useRef<number | null>(null);
  const workspaceSettings = useAppSelector((state) => state.auth.workspace?.settings);
  const productionMachinePickPolicy = parseProductionMachinePickPolicy(workspaceSettings);
  const materialsSectionRef = useRef<HTMLDivElement>(null);
  const materialsHandleRef = useRef<BatchRunStepMaterialsHandle>(null);
  const [emphasizeFinishFields, setEmphasizeFinishFields] = useState(false);
  const [finishReadinessSnapshot, setFinishReadinessSnapshot] =
    useState<StepFinishReadiness | null>(null);
  const [finishFlushBusy, setFinishFlushBusy] = useState(false);
  const [savingConditions, setSavingConditions] = useState(false);
  const [postFinishNext, setPostFinishNext] = useState<{
    afterLogId: number;
    nextLogId: number;
    nextStageName: string;
  } | null>(null);

  const startStepLine = startStepLog
    ? lines.find((row) => row.id === startStepLog.production_line_id)
    : undefined;

  const startStepStoragePreview = useBatchInputStoragePreview({
    batchId,
    lineFactoryId: startStepLine?.factory_id ?? factoryForMachines,
    enabled: !!startStepLog,
    stageLog: startStepLog,
    formulaStageItems,
    formulaStages,
    stageLogs,
    stepItems: batchStageItems,
    highlightStepInputs: true,
    onlyStepInputs: true,
  });
  const [shortStockSeed, setShortStockSeed] = useState<ShortStockSeed | null>(null);
  const [shortPurchaseSeed, setShortPurchaseSeed] = useState<ShortStockSeed | null>(null);

  const openShortStock = (row: { itemId: number; factoryId: number; required: number; onHand: number }, action: 'stock' | 'purchase') => {
    const quantity = storageGapQty(row.required, row.onHand);
    if (quantity <= 0) return;
    const seed: ShortStockSeed = {
      itemId: row.itemId,
      itemName: getItemName(row.itemId),
      factoryId: row.factoryId,
      quantity,
      existing: existingStorageForShort(startStepStoragePreview.storageRows, row.itemId, row.factoryId),
    };
    if (action === 'stock') setShortStockSeed(seed);
    else setShortPurchaseSeed(seed);
  };

  const startStepLineMachineCount = startStepLine ? machinesForLine(startStepLine).length : 0;

  const startStepNeedsMachinePick =
    startStepLog != null &&
    startStepLog.machine_id == null &&
    startStepLineMachineCount > 1;

  const startStepResolvedMachineId = useMemo(() => {
    if (!startStepLog) return null;
    if (startStepLog.machine_id != null) return startStepLog.machine_id;
    if (startMachinePick != null) return startMachinePick;
    return soleMachineIdOnLine(startStepLine);
  }, [startStepLog, startMachinePick, startStepLine]);

  const { data: startStepMachine, isLoading: loadingStartStepMachine } = useGetMachineByIdQuery(
    startStepResolvedMachineId ?? 0,
    { skip: startStepResolvedMachineId == null },
  );

  const startStepDialogDescription = useMemo(() => {
    if (!startStepLog) return '';
    return batchStartStepDescription({
      rows: startStepStoragePreview.rows,
      batchIsDraft: batch?.status === 'draft' || batch?.status === 'recurring',
      hasShortage: startStepStoragePreview.shortages.length > 0,
    });
  }, [startStepLog, startStepStoragePreview.rows, startStepStoragePreview.shortages.length, batch?.status]);

  useEffect(() => {
    if (postFinishNext && selectedStageLogId != null && selectedStageLogId !== postFinishNext.afterLogId) {
      setPostFinishNext(null);
    }
  }, [selectedStageLogId, postFinishNext]);

  const startStepMachineLabel = useMemo(() => {
    if (!startStepLog) return null;
    if (startStepLog.machine_id != null) {
      return getMachineName(startStepLog.machine_id);
    }
    if (startStepLine && machinesForLine(startStepLine).length === 1) {
      return machinesForLine(startStepLine)[0].name;
    }
    return null;
  }, [startStepLog, startStepLine, getMachineName]);

  useEffect(() => {
    onSchedulePlannedStartChange?.(editPlannedStart);
  }, [editPlannedStart, onSchedulePlannedStartChange]);

  const line = batch ? lines.find((l) => l.id === batch.production_line_id) : undefined;
  const formula = batch?.formula_id ? formulas.find((f) => f.id === batch.formula_id) : null;

  useEffect(() => {
    if (!batch) return;
    setEditSelectedShiftId(batch.shift_id ?? null);
    setEditExpectedOutput(batch.expected_output_quantity != null ? String(batch.expected_output_quantity) : '');
    setEditExpectedDuration(batch.expected_duration_minutes != null ? String(batch.expected_duration_minutes) : '');
    setEditActualOutput(batch.actual_output_quantity != null ? String(batch.actual_output_quantity) : '');
    setEditActualDuration(batch.actual_duration_minutes != null ? String(batch.actual_duration_minutes) : '');
    setEditNotes(batch.notes ?? '');
    setEditPlannedStart(plannedStartLocalFromIso(batch.planned_start_at));
    // Reset drafts only for a different batch or a newer server copy, not on
    // every refetched object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.id, batch?.updated_at]);

  const isPreStartBatch =
    batch?.status === 'draft' || batch?.status === 'recurring';
  const canMutateItems =
    batch && (isPreStartBatch || batch.status === 'in_progress');
  const canLogStages = batch && batch.status !== 'cancelled';
  /** Batch in progress: edit material/condition actuals on any step (including completed steps). */
  const canEditActuals = batch?.status === 'in_progress';
  const canEditStepMaterials =
    Boolean(canEditActuals) || (Boolean(canMutateItems) && isPreStartBatch);
  const canEditBatch = isPreStartBatch || batch?.status === 'in_progress';

  const persistBatchUpdate = async (
    data: Parameters<typeof updateProductionBatch>[0]['data'],
    successMessage = 'Saved',
  ) => {
    if (!batch || !canEditBatch) return;
    try {
      await updateProductionBatch({ id: batch.id, data }).unwrap();
      if (successMessage) appToast.success(successMessage);
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || 'Failed to save');
    }
  };

  const handleSaveBatchDetails = async (override?: {
    plannedStart?: string;
    shiftId?: number | null;
  }) => {
    if (!batch || !canEditBatch) return;
    const plannedStart = override?.plannedStart ?? editPlannedStart;
    const shiftId =
      override && 'shiftId' in override
        ? override.shiftId ?? null
        : plannedStart
          ? findShiftForDate(
              workspaceShifts.filter((shift) => shift.is_active),
              new Date(plannedStart),
            )?.id ?? null
          : null;
    try {
      const currentExpectedOutput =
        batch.expected_output_quantity ??
        byRole.output.reduce((sum, row) => sum + (row.expected_quantity ?? 0), 0);
      const nextExpectedOutput = editExpectedOutput.trim()
        ? parseProductionQuantity(editExpectedOutput) ?? undefined
        : batch.expected_output_quantity ?? undefined;

      if (overlapConflicts.length === 0 && plannedStart) {
        const stepPlans = stageLogs.length
          ? stageLogs.map((log) => ({
              productionLineId: log.production_line_id,
              machineId: resolveLineMachineIdForSchedule(
                lines.find((row) => row.id === log.production_line_id),
                log.machine_id,
              ),
              expectedMinutes: log.expected_duration_minutes ?? 0,
            }))
          : [
              {
                productionLineId: batch.production_line_id,
                machineId: resolveLineMachineIdForSchedule(
                  lines.find((row) => row.id === batch.production_line_id),
                  null,
                ),
                expectedMinutes: batch.expected_duration_minutes ?? 0,
              },
            ];
        const candidates = sequentialStepWindows({
          batchId: batch.id,
          batchNumber: batch.batch_number,
          plannedStartAt: new Date(plannedStart).toISOString(),
          steps: stepPlans,
        });
        const others = factoryScheduleBatches.flatMap((row) =>
          row.steps.map((step) => ({
            batchId: row.batch_id,
            batchNumber: row.batch_number,
            productionLineId: step.production_line_id,
            machineId: step.machine_id,
            plannedStartAt: step.planned_start_at,
            plannedEndAt: step.planned_end_at,
          })),
        );
        const conflicts = candidates.flatMap((candidate) => findProductionScheduleConflicts(candidate, others));
        const unique = conflicts.filter(
          (conflict, index) =>
            conflicts.findIndex((row) => row.batchId === conflict.batchId && row.reason === conflict.reason) === index,
        );
        if (unique.length > 0) {
          setOverlapConflicts(unique);
          return;
        }
      }
      setOverlapConflicts([]);

      const base = {
        batch_date: plannedStart
          ? millBatchDate({ plannedLocal: plannedStart, timeZone: millTimezone })
          : batch.batch_date.split('T')[0],
        notes: editNotes.trim() || undefined,
        planned_start_at: plannedStart ? new Date(plannedStart).toISOString() : null,
        ...(isPreStartBatch ? { shift_id: shiftId } : {}),
      };
      if (isPreStartBatch) {
        await updateProductionBatch({
          id: batch.id,
          data: {
            ...base,
            expected_output_quantity: nextExpectedOutput,
            expected_duration_minutes: editExpectedDuration.trim() ? parseInt(editExpectedDuration, 10) : undefined,
          },
        }).unwrap();

        if (
          nextExpectedOutput &&
          currentExpectedOutput > 0 &&
          nextExpectedOutput !== currentExpectedOutput
        ) {
          const multiplier = nextExpectedOutput / currentExpectedOutput;
          const scaleOps = byRole.input
            .filter((row) => row.expected_quantity != null)
            .map((row) => {
              const scaledExpected = Math.max(0, Math.round((row.expected_quantity ?? 0) * multiplier * 100) / 100);
              if (scaledExpected === row.expected_quantity) return null;
              return updateBatchItem({
                id: row.id,
                data: { expected_quantity: scaledExpected },
              }).unwrap();
            })
            .filter(Boolean) as Array<Promise<unknown>>;

          if (scaleOps.length > 0) {
            await Promise.all(scaleOps);
            appToast.success('Batch updated and input lines scaled');
          } else {
            appToast.success('Batch updated');
          }
          return;
        }
      } else {
        await updateProductionBatch({
          id: batch.id,
          data: {
            ...base,
            actual_output_quantity: editActualOutput.trim()
              ? parseProductionQuantity(editActualOutput) ?? undefined
              : undefined,
            actual_duration_minutes: editActualDuration.trim() ? parseInt(editActualDuration, 10) : undefined,
          },
        }).unwrap();
      }
      appToast.success('Batch updated');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || 'Failed to update');
    }
  };

  const selectedStageLog = useMemo(
    () => stageLogs.find((log) => log.id === selectedStageLogId) ?? null,
    [stageLogs, selectedStageLogId],
  );

  const selectedStageParameters = useMemo(
    () =>
      selectedStageLogId != null
        ? batchStageParameters.filter((row) => row.batch_stage_log_id === selectedStageLogId)
        : [],
    [batchStageParameters, selectedStageLogId],
  );

  useEffect(() => {
    setEmphasizeFinishFields(false);
  }, [selectedStageLogId]);

  const stepFinishReadiness = useMemo(
    () =>
      getStepFinishReadiness({
        stageLog: selectedStageLog,
        formulaStageItems,
        batchItems,
        stepItems: batchStageItems,
        formulaStageParameters,
        stageParameters: selectedStageParameters,
        getItemName,
      }),
    [
      selectedStageLog,
      formulaStageItems,
      batchItems,
      batchStageItems,
      formulaStageParameters,
      selectedStageParameters,
      getItemName,
    ],
  );

  useEffect(() => {
    if (stepFinishReadiness.ready) setEmphasizeFinishFields(false);
  }, [stepFinishReadiness.ready]);

  const activeFinishReadiness = finishReadinessSnapshot ?? stepFinishReadiness;

  const finishBlockedHint = useMemo(() => {
    if (activeFinishReadiness.ready) return undefined;
    const bullets = [
      ...activeFinishReadiness.missingMaterialLabels,
      ...activeFinishReadiness.missingConditionLabels.map((label) => `Condition: ${label}`),
    ];
    return {
      title: 'Enter actuals before finishing',
      reason: 'Fill in every Actual value for materials and conditions on this step.',
      bullets: bullets.length > 0 ? bullets.slice(0, 8) : undefined,
    };
  }, [activeFinishReadiness]);

  const handleSaveCondition = async (
    input: SaveBatchConditionInput,
  ): Promise<{ ok: true; parameter?: ProductionBatchStageParameter } | { ok: false }> => {
    const prepared = prepareBatchConditionSave(input);
    if (!prepared.ok) {
      if (prepared.noop) return { ok: true };
      if (prepared.errorMessage) appToast.error(prepared.errorMessage);
      return { ok: false };
    }

    try {
      if (input.batchParam) {
        const parameter = await updateBatchStageParameter({
          id: input.batchParam.id,
          batchId,
          data: prepared.patch,
        }).unwrap();
        return { ok: true, parameter };
      }
      if (selectedStageLog && input.sourceParameterId != null) {
        const parameter = await setBatchStageParameterBySource({
          batchId,
          logId: selectedStageLog.id,
          sourceParameterId: input.sourceParameterId,
          data: prepared.patch,
        }).unwrap();
        return { ok: true, parameter };
      }
      appToast.error('Cannot save condition for this step');
      return { ok: false };
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || 'Failed to save');
      return { ok: false };
    }
  };

  const handleSaveStepInput = async (
    row: { id: number },
    raw: string,
    options?: { silent?: boolean },
  ): Promise<boolean> => {
    const n = raw.trim() === '' ? null : parseProductionQuantity(raw);
    if (raw.trim() !== '' && (n == null || Number.isNaN(n) || n < 0)) {
      if (!options?.silent) appToast.error('Invalid quantity');
      return false;
    }
    try {
      await updateBatchStageItem({
        id: row.id,
        batchId,
        data: { actual_quantity: n },
      }).unwrap();
      if (!options?.silent) appToast.success('Saved');
      return true;
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      if (!options?.silent) appToast.error(err?.data?.detail || 'Failed to save');
      return false;
    }
  };

  const stageParametersForLog = useCallback(
    (log: ProductionBatchStageLog) =>
      batchStageParameters.filter((row) => row.batch_stage_log_id === log.id),
    [batchStageParameters],
  );

  const requestFinishStage = async (log: ProductionBatchStageLog) => {
    setFinishFlushBusy(true);
    try {
      const conditionFlush = await materialsHandleRef.current?.saveConditions();
      if (conditionFlush && !conditionFlush.ok) return;
      const flushResult = await materialsHandleRef.current?.flushDraftActuals();
      if (!flushResult?.ok) return;
      const merged = flushResult.mergedStepItems;
      const readiness = getStepFinishReadiness({
        stageLog: log,
        formulaStageItems,
        batchItems,
        stepItems: merged,
        formulaStageParameters,
        stageParameters: mergeSavedStageParameters(
          stageParametersForLog(log),
          conditionFlush?.parameters ?? [],
        ),
        getItemName,
      });
      if (!readiness.ready) {
        setFinishReadinessSnapshot(readiness);
        setEmphasizeFinishFields(true);
        materialsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      setFinishReadinessSnapshot(null);
      setEmphasizeFinishFields(false);
      await finishStepNow(log, merged);
    } finally {
      setFinishFlushBusy(false);
    }
  };

  const finishStepNow = async (
    log: ProductionBatchStageLog,
    stepItems: ProductionBatchStageItem[],
  ) => {
    const outputRow = stepItems.find(
      (row) => row.batch_stage_log_id === log.id && row.item_role === 'output',
    );
    const output = parseProductionQuantity(
      outputRow?.actual_quantity != null ? String(outputRow.actual_quantity) : '',
    );
    if (output == null || output < 0) {
      appToast.error('Enter output actual on this step before finishing');
      return;
    }
    const closesBatch = isLastOpenStep(log, stageLogs);
    try {
      await finishStageLog({
        id: log.id,
        batchId,
        output_quantity: output,
      }).unwrap();
      setFinishReadinessSnapshot(null);
      if (!closesBatch) {
        const next = stageLogs.find(
          (row) =>
            row.id !== log.id &&
            row.stage_order > log.stage_order &&
            row.status === 'pending',
        );
        if (next) {
          setPostFinishNext({
            afterLogId: log.id,
            nextLogId: next.id,
            nextStageName: next.stage_name,
          });
        }
      } else {
        setPostFinishNext(null);
      }
      appToast.success(
        closesBatch
          ? 'Step finished — batch completed and inventory posted'
          : 'Step finished',
      );
    } catch (error: unknown) {
      appToast.error(apiDetail(error, 'Failed to finish step'));
    }
  };

  const handleSaveActual = async (row: ProductionBatchItem, raw: string) => {
    const n = raw.trim() === '' ? undefined : parseProductionQuantity(raw) ?? undefined;
    if (raw.trim() !== '' && (n === undefined || Number.isNaN(n) || n < 0)) {
      appToast.error('Invalid quantity');
      return;
    }
    try {
      await updateBatchItem({
        id: row.id,
        data: {
          actual_quantity: n,
          ...(selectedStageLog?.id != null
            ? { context_batch_stage_log_id: selectedStageLog.id }
            : {}),
        },
      }).unwrap();
      appToast.success('Saved');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || 'Failed to save');
    }
  };

  const handleSaveExpected = async (row: ProductionBatchItem, raw: string) => {
    if (!canMutateItems) return;
    const n = raw.trim() === '' ? undefined : parseProductionQuantity(raw) ?? undefined;
    if (raw.trim() !== '' && (n === undefined || Number.isNaN(n) || n < 1)) {
      appToast.error('Expected quantity must be a positive integer');
      return;
    }
    try {
      await updateBatchItem({
        id: row.id,
        data: {
          expected_quantity: n,
          ...(selectedStageLog?.id != null
            ? { context_batch_stage_log_id: selectedStageLog.id }
            : {}),
        },
      }).unwrap();
      appToast.success('Expected quantity saved');
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || 'Failed to save');
    }
  };

  const handleRevertToDraft = async () => {
    if (!batch || batch.status !== 'recurring') return;
    try {
      await revertToDraft(batch.id).unwrap();
      appToast.success('Batch moved to draft for editing');
    } catch (e: unknown) {
      appToast.error(apiDetail(e, 'Failed to move batch to draft'));
    }
  };

  const handleDeleteDraft = async () => {
    if (!batch || !isPreStartBatch) return;
    const label = batch.status === 'recurring' ? 'recurring' : 'draft';
    if (!window.confirm(`Remove ${label} batch ${batch.batch_number}?`)) return;
    try {
      await deleteProductionBatch(batch.id).unwrap();
      appToast.success(batch.status === 'recurring' ? 'Recurring run removed' : 'Draft removed');
      onDeleted();
    } catch (e: unknown) {
      const err = e as { data?: { detail?: string } };
      appToast.error(err?.data?.detail || 'Failed to delete');
    }
  };

  if (loadingBatch) {
    return (
      <Card className="shrink-0 flex-col border-border">
        <CardContent className="flex min-h-[12rem] items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  if (batchError || !batch) {
    return (
      <Card className="border-border border-destructive/40">
        <CardContent className="py-8 text-center text-sm text-destructive">
          Could not load batch.
          <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  const efficiencyDisplay = formatOptionalPercent(batch.efficiency_percentage);
  const isRecipeFloorView = Boolean(batch.formula_id);

  const runStageAction = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      await action();
    } catch (error: unknown) {
      appToast.error(apiDetail(error, fallback));
    }
  };

  const openStartStepDialog = (log: ProductionBatchStageLog) => {
    setStartStepLog(log);
    setStartMachinePick(log.machine_id ?? null);
    setStepStartedEarlier(false);
    setStepStartedAtLocal(defaultLocalDatetimeNow());
  };

  const multiStepRun = stageLogs.length >= 2;
  const showRailMachine = !isRecipeFloorView || stageLogs.length <= 1;
  const railMachineLine = !isRecipeFloorView
    ? line
    : stageLogs.length === 1
      ? lines.find((l) => l.id === stageLogs[0].production_line_id) ?? line
      : undefined;
  const railMachineId =
    stageLogs.length === 1
      ? stageLogs[0].machine_id ?? batch.machine_id ?? null
      : batch.machine_id ?? null;

  const batchPlannedWindows: ProductionPlannedWindow[] = (() => {
    if (!editPlannedStart.trim()) return [];
    const startMs = new Date(editPlannedStart).getTime();
    if (!Number.isFinite(startMs)) return [];
    const steps = stageLogs.length
      ? stageLogs.map((log) => ({
          productionLineId: log.production_line_id,
          machineId: log.machine_id ?? null,
          expectedMinutes: log.expected_duration_minutes ?? 0,
        }))
      : [
          {
            productionLineId: batch.production_line_id,
            machineId: batch.machine_id ?? null,
            expectedMinutes: batch.expected_duration_minutes ?? 0,
          },
        ];
    return sequentialStepWindows({
      batchId: batch.id,
      batchNumber: batch.batch_number,
      plannedStartAt: new Date(editPlannedStart).toISOString(),
      steps,
    }).map((w) => ({ plannedStartAt: w.plannedStartAt, plannedEndAt: w.plannedEndAt }));
  })();

  const scheduleBatchesForMachinePick = (() => {
    const local =
      batchPlannedWindows.length > 0
        ? scheduleBatchFromOpenRun(batch, stageLogs, batchPlannedWindows)
        : null;
    return mergeScheduleBatchesForLiveWork(factoryScheduleBatches, local);
  })();

  const resolveStageLogMachineId = (log: ProductionBatchStageLog): number | null => {
    if (log.machine_id != null) return log.machine_id;
    const stepLine = lines.find((row) => row.id === log.production_line_id);
    return soleMachineIdOnLine(stepLine);
  };

  const requestStartStage = (log: ProductionBatchStageLog) => {
    const machineId = resolveStageLogMachineId(log);
    if (machineId == null) {
      startLiveAckMachineIdRef.current = null;
      openStartStepDialog(log);
      return;
    }
    const liveWork = findLiveWorkOnMachine(machineId, scheduleBatchesForMachinePick);
    if (!hasLiveStepConflictOnMachine(liveWork, log.id)) {
      startLiveAckMachineIdRef.current = null;
      openStartStepDialog(log);
      return;
    }
    if (productionMachinePickPolicy === 'block_overlap') {
      appToast.error('Another step is in progress on this machine');
      return;
    }
    pendingOpenStageLogRef.current = log;
    setStartStepLiveConflict(liveWork);
  };

  const railPlannedWindow = batchPlannedWindows[0] ?? null;
  const selectedStepPlannedWindow = (() => {
    if (!selectedStageLog || batchPlannedWindows.length === 0) return null;
    const idx = stageLogs.findIndex((log) => log.id === selectedStageLog.id);
    if (idx < 0 || idx >= batchPlannedWindows.length) return null;
    return batchPlannedWindows[idx];
  })();

  const startStepPlannedWindow = (() => {
    if (!startStepLog || batchPlannedWindows.length === 0) return null;
    const idx = stageLogs.findIndex((log) => log.id === startStepLog.id);
    if (idx < 0 || idx >= batchPlannedWindows.length) return null;
    return batchPlannedWindows[idx];
  })();

  const executeStartStep = () => {
    if (!startStepLog) return;
    const pending = pendingStartStepRef.current;
    if (!pending) return;
    void runStageAction(async () => {
      await startStageLog({
        id: startStepLog.id,
        batchId,
        machine_id: pending.machineId,
        started_at: pending.started_at,
      }).unwrap();
      setStartStepLog(null);
      setStartStepPickWarnings(null);
      setStartStepLiveConflict(null);
      pendingStartStepRef.current = null;
    }, 'Failed to start step');
  };

  const confirmStartStep = () => {
    if (!startStepLog) return;
    if (!startStepStoragePreview.canStartBatch) {
      appToast.error('Cannot start — fix storage or batch items first');
      return;
    }
    const earlierErr = validateStartedEarlier(stepStartedEarlier, stepStartedAtLocal);
    if (earlierErr) {
      appToast.error(earlierErr);
      return;
    }
    let machineId: number | undefined = startStepLog.machine_id ?? undefined;
    if (machineId == null && startStepLine) {
      machineId = soleMachineIdOnLine(startStepLine) ?? undefined;
    }
    if (machineId == null && startStepNeedsMachinePick) {
      if (startMachinePick == null) {
        appToast.error('Select a machine');
        return;
      }
      machineId = startMachinePick;
    }
    const started_at = startedAtForApi(stepStartedEarlier, stepStartedAtLocal);
    pendingStartStepRef.current = { machineId, started_at };

    if (machineId != null) {
      if (loadingStartStepMachine || !startStepMachine) {
        appToast.error('Loading machine status… try again');
        return;
      }
      const allowedIds = startStepLine ? machinesForLine(startStepLine).map((m) => m.id) : [machineId];
      const occupancyByMachineId = buildMachineOccupancyForWindow(
        allowedIds,
        startStepPlannedWindow,
        scheduleBatchesForMachinePick,
        { batchId: batch.id, stageLogId: startStepLog.id },
      );
      const liveWorkByMachineId = buildMachineLiveWorkMap(scheduleBatchesForMachinePick, allowedIds);
      const liveWorkOnMachine = liveWorkByMachineId[machineId] ?? null;
      const evaluation = evaluateMachinePick(
        startStepMachine,
        productionMachinePickPolicy,
        occupancyByMachineId?.[machineId],
        {
          hasPlannedWindow: occupancyByMachineId != null,
          plannedWindow: startStepPlannedWindow ?? null,
          windowIncludesNow: occupancyByMachineId
            ? plannedWindowIncludesNow(startStepPlannedWindow ?? null)
            : plannedWindowIncludesNow(undefined),
          liveWorkOnMachine,
          excludeStageLogId: startStepLog.id,
        },
      );
      const startConfirmWarnings = warningsForStartStepConfirm(evaluation.warnings);
      if (evaluation.blocked) {
        appToast.error(
          startConfirmWarnings.map((w) => machinePickWarningLabel(w)).join(' · ') ||
            'Cannot use this machine under workspace policy',
        );
        return;
      }
      if (
        hasLiveStepConflictOnMachine(liveWorkOnMachine, startStepLog.id) &&
        machineId !== startLiveAckMachineIdRef.current
      ) {
        pendingOpenStageLogRef.current = null;
        setStartStepLiveConflict(liveWorkOnMachine);
        return;
      }
      const otherWarnings = startConfirmWarnings.filter((w) => w !== 'occupied');
      if (otherWarnings.length > 0) {
        setStartStepPickWarnings(otherWarnings);
        return;
      }
    }

    executeStartStep();
  };

  const canEditStepMeta = Boolean(canEditBatch);

  const commitPlannedAndShift = async (override?: {
    plannedStart?: string;
    shiftId?: number | null;
  }) => {
    if (!canEditBatch || !batch) return;
    const plannedStart = override?.plannedStart ?? editPlannedStart;
    const shiftId =
      override && 'shiftId' in override
        ? override.shiftId ?? null
        : plannedStart
          ? findShiftForDate(
              workspaceShifts.filter((shift) => shift.is_active),
              new Date(plannedStart),
            )?.id ?? null
          : null;
    if (override?.plannedStart != null) setEditPlannedStart(override.plannedStart);
    setEditSelectedShiftId(shiftId);
    const plannedIso = plannedStart.trim() ? new Date(plannedStart).toISOString() : null;
    const serverPlanned = batch.planned_start_at ?? null;
    const serverShift = batch.shift_id ?? null;
    const sameInstant =
      plannedIso == null
        ? serverPlanned == null
        : serverPlanned != null && new Date(plannedIso).getTime() === new Date(serverPlanned).getTime();
    if (sameInstant && shiftId === serverShift) return;
    await handleSaveBatchDetails({ plannedStart, shiftId });
  };

  const commitNotes = async () => {
    if (!canEditBatch) return;
    const trimmed = editNotes.trim();
    if ((batch.notes ?? '').trim() === trimmed) return;
    await persistBatchUpdate({ notes: trimmed || undefined });
  };

  const commitExpectedOutput = async () => {
    if (!canEditBatch || !isPreStartBatch) return;
    const trimmed = editExpectedOutput.trim();
    const next = trimmed === '' ? undefined : parseProductionQuantity(trimmed) ?? undefined;
    if (trimmed !== '' && (next == null || next < 0.01)) {
      appToast.error('Enter a positive quantity or leave blank');
      return;
    }
    if (next === batch.expected_output_quantity) return;
    await handleSaveBatchDetails();
  };

  const commitActualOutput = async () => {
    if (!canEditBatch || batch.status !== 'in_progress') return;
    const trimmed = editActualOutput.trim();
    const next = trimmed === '' ? undefined : parseProductionQuantity(trimmed) ?? undefined;
    if (trimmed !== '' && (next == null || Number.isNaN(next) || next < 0)) {
      appToast.error('Invalid quantity');
      return;
    }
    if (next === batch.actual_output_quantity) return;
    await persistBatchUpdate({
      actual_output_quantity: next,
      actual_duration_minutes: editActualDuration.trim()
        ? parseInt(editActualDuration, 10)
        : undefined,
    });
  };

  const handleRailMachineChange = (machineId: number | null) => {
    if (!canEditBatch) return;
    if (stageLogs.length === 1) {
      void runStageAction(
        () =>
          updateStageLog({
            id: stageLogs[0].id,
            batchId,
            data: { machine_id: machineId },
          }).unwrap(),
        'Failed to save machine',
      );
      return;
    }
    void persistBatchUpdate({ machine_id: machineId });
  };

  const patchStageLog = (
    log: ProductionBatchStageLog,
    data: Parameters<typeof updateStageLog>[0]['data'],
  ) => {
    void runStageAction(
      () => updateStageLog({ id: log.id, batchId, data }).unwrap(),
      'Failed to save step',
    );
  };

  const showFloorWorkspace = stageLogs.length > 0;
  const selectedCanStartStep =
    selectedStageLog != null && !earlierStepsBlockStart(selectedStageLog, stageLogs);

  const floorPanel = (
    <BatchRunSelectedStepPanel
      log={selectedStageLog}
      lines={lines}
      multiStepRun={multiStepRun}
      canEditStepMeta={canEditStepMeta && selectedStageLog?.status === 'pending'}
      canLogStages={Boolean(canLogStages)}
      factoryId={factoryForMachines ?? undefined}
      scheduleBatches={scheduleBatchesForMachinePick}
      plannedWindow={selectedStepPlannedWindow}
      onSaveLine={(log, lineId) => patchStageLog(log, { production_line_id: lineId })}
      onSaveMinutes={(log, minutes) =>
        patchStageLog(log, { expected_duration_minutes: minutes })
      }
      onSaveMachine={(log, machineId) => patchStageLog(log, { machine_id: machineId })}
      onStart={requestStartStage}
      onFinish={requestFinishStage}
      onSaveConditions={async () => {
        setSavingConditions(true);
        try {
          const result = await materialsHandleRef.current?.saveConditions();
          if (result?.ok && result.changed) appToast.success('Saved');
        } finally {
          setSavingConditions(false);
        }
      }}
      saveConditionsBusy={savingConditions}
      canStartStep={selectedCanStartStep}
      finishBlocked={
        selectedStageLog?.status === 'in_progress' &&
        finishReadinessSnapshot != null &&
        !finishReadinessSnapshot.ready
      }
      finishBlockedHint={finishBlockedHint}
      onFinishBlocked={() => {
        if (selectedStageLog) void requestFinishStage(selectedStageLog);
      }}
      finishBusy={finishFlushBusy || finishingStep}
      nextStepOffer={
        postFinishNext
          ? {
              afterLogId: postFinishNext.afterLogId,
              nextLogId: postFinishNext.nextLogId,
              stageName: postFinishNext.nextStageName,
            }
          : null
      }
      onGoToNextStep={() => {
        if (!postFinishNext) return;
        setSelectedStageLogId(postFinishNext.nextLogId);
        setPostFinishNext(null);
      }}
    >
      <BatchRunStepMaterials
        ref={materialsHandleRef}
        stageLog={selectedStageLog}
        stageLogs={stageLogs}
        formulaStageItems={formulaStageItems}
        formulaStages={formulaStages}
        batchItems={batchItems}
        stepItems={batchStageItems}
        getItemName={getItemName}
        canMutateItems={Boolean(canMutateItems)}
        canEditActuals={canEditStepMaterials}
        onSaveExpected={handleSaveExpected}
        onSaveActual={handleSaveActual}
        onSaveStepInput={handleSaveStepInput}
        stageParameters={selectedStageParameters}
        formulaStageParameters={formulaStageParameters}
        onSaveCondition={handleSaveCondition}
        materialsSectionRef={materialsSectionRef}
        highlightMissingActualRowKeys={
          emphasizeFinishFields ? activeFinishReadiness.missingMaterialRowKeys : []
        }
        highlightMissingConditionSourceIds={
          emphasizeFinishFields ? activeFinishReadiness.missingConditionSourceIds : []
        }
      />
    </BatchRunSelectedStepPanel>
  );

  const workflowActionsBlock = (
    <div className="flex flex-wrap gap-2">
      {isPreStartBatch && (
        <>
          {stageLogs.length === 0 ? (
            <Button
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={onRequestStart}
            >
              <Play className="mr-1 h-4 w-4" />
              Start
            </Button>
          ) : null}
          {batch.status === 'recurring' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleRevertToDraft()}
              disabled={isRevertingToDraft}
            >
              {isRevertingToDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Edit as draft
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteDraft}
            disabled={isDeletingBatch}
          >
            {isDeletingBatch ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-4 w-4" />
            )}
            {batch.status === 'recurring' ? 'Remove recurring run' : 'Delete draft'}
          </Button>
        </>
      )}
        {batch.status === 'in_progress' && (
          <>
            {stageLogs.length === 0 ? (
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                onClick={() => onComplete(batch)}
              >
                <Check className="mr-1 h-4 w-4" />
                Complete
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => onCancel(batch)}
            >
              <X className="mr-1 h-4 w-4" />
              Cancel run
            </Button>
          </>
        )}
    </div>
  );

  const runWorkspaceBody = (
    <div className="flex min-w-0 flex-col border-t border-border pt-4">
      {stageLogs.length > 1 ? (
        <BatchRunVerticalStepper
          orientation="horizontal"
          stageLogs={stageLogs}
          loading={loadingStageLogs}
          selectedLogId={selectedStageLogId}
          onSelect={setSelectedStageLogId}
        />
      ) : null}
      <div className="flex min-w-0">
        {stageLogs.length > 0 ? (
          <BatchRunVerticalStepper
            orientation="vertical"
            stageLogs={stageLogs}
            loading={loadingStageLogs}
            selectedLogId={selectedStageLogId}
            onSelect={setSelectedStageLogId}
            className="shrink-0 self-start"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {showFloorWorkspace ? (
            floorPanel
          ) : (
            <div className="flex min-h-[12rem] items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">
              {isRecipeFloorView
                ? 'No steps on this run yet.'
                : 'Simple run — set when, qty, and machine in the strip above.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="shrink-0 flex-col border-border shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-base font-semibold tracking-tight text-foreground">{batch.batch_number}</p>
              <span
                className={cn(
                  'inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize',
                  getStatusBadge(batch.status),
                )}
              >
                {batch.status.replace('_', ' ')}
              </span>
              {formula ? (
                <Badge variant="secondary" className="max-w-[14rem] truncate font-normal">
                  {formula.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal">
                  Simple run
                </Badge>
              )}
              {!isRecipeFloorView && line ? (
                <span className="truncate text-xs text-muted-foreground">{line.name}</span>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {workflowActionsBlock}
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={onClose} aria-label="Clear selection">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <BatchRunContextStrip
            batch={batch}
            canEditBatch={Boolean(canEditBatch)}
            workspaceShifts={workspaceShifts}
            plannedStart={editPlannedStart}
            selectedShiftId={editSelectedShiftId}
            onPlannedStartChange={(value) => {
              setEditPlannedStart(value);
              setOverlapConflicts([]);
            }}
            onSelectedShiftIdChange={setEditSelectedShiftId}
            onPlannedStartCommit={(plannedLocal) =>
              void commitPlannedAndShift({ plannedStart: plannedLocal })
            }
            onShiftCommit={(plannedLocal, shiftId) =>
              void commitPlannedAndShift(
                plannedLocal != null
                  ? { plannedStart: plannedLocal, shiftId: shiftId ?? null }
                  : undefined,
              )
            }
            showRailMachine={showRailMachine}
            railMachineLine={railMachineLine}
            railMachineId={railMachineId}
            onRailMachineChange={handleRailMachineChange}
            factoryId={factoryForMachines ?? undefined}
            scheduleBatches={scheduleBatchesForMachinePick}
            railPlannedWindow={railPlannedWindow}
            railExcludeStageLogId={stageLogs.length === 1 ? stageLogs[0].id : undefined}
            railExcludeBatchId={batch.id}
            expectedOutput={editExpectedOutput}
            onExpectedOutputChange={setEditExpectedOutput}
            onExpectedOutputCommit={() => void commitExpectedOutput()}
            actualOutput={editActualOutput}
            onActualOutputChange={setEditActualOutput}
            actualDuration={editActualDuration}
            onActualDurationChange={setEditActualDuration}
            onActualOutputCommit={() => void commitActualOutput()}
            notes={editNotes}
            onNotesChange={setEditNotes}
            onNotesCommit={() => void commitNotes()}
            efficiencyDisplay={efficiencyDisplay}
            linkedOrders={linkedOrders}
          />

          {runWorkspaceBody}
        </CardContent>
      </Card>
      <Dialog
        open={!!startStepLog}
        onOpenChange={(open) => {
          if (!open) {
            setStartStepLog(null);
            startLiveAckMachineIdRef.current = null;
          }
        }}
      >
        <DialogContent
          className={cn(
            'flex max-w-none flex-col overflow-hidden w-[min(56rem,94vw)]',
            'h-[66vh] max-h-[66vh]',
          )}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Start {startStepLog?.stage_name ?? 'step'}</DialogTitle>
            <DialogDescription>{startStepDialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {startStepLog ? (
              <BatchStartStepDialogBody
                stageLog={startStepLog}
                lineName={startStepLine?.name ?? null}
                machineLabel={startStepMachineLabel}
                storagePreview={{
                  rows: startStepStoragePreview.rows,
                  stockCheckLoading: startStepStoragePreview.stockCheckLoading,
                  loadingItems: startStepStoragePreview.loadingItems,
                  noItems: startStepStoragePreview.noItems,
                  noInputs: startStepStoragePreview.noInputs,
                  shortages: startStepStoragePreview.shortages,
                }}
                getItemName={getItemName}
                onReplenish={openShortStock}
                needsMachinePick={startStepNeedsMachinePick}
                machinePick={
                  <ProductionLineMachineSelect
                    line={startStepLine}
                    value={startMachinePick}
                    onChange={setStartMachinePick}
                    factoryId={factoryForMachines ?? startStepLine?.factory_id}
                    scheduleBatches={scheduleBatchesForMachinePick}
                    plannedWindow={startStepPlannedWindow}
                    id="start-step-machine"
                    excludeStageLogId={startStepLog.id}
                    excludeBatchId={batch.id}
                    summarySize="comfortable"
                    embedded
                    description="Choose which machine on this line will run the step."
                  />
                }
              />
            ) : null}
          </div>
          <DialogFooter className="shrink-0 gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setStartStepLog(null)}>
              Cancel
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <ProductionStartEarlierDialogButton
                idPrefix="start-step"
                enabled={stepStartedEarlier}
                onEnabledChange={setStepStartedEarlier}
                value={stepStartedAtLocal}
                onChange={setStepStartedAtLocal}
              />
              <Button
                type="button"
                onClick={confirmStartStep}
                disabled={
                  !startStepStoragePreview.canStartBatch || startStepStoragePreview.loadingItems
                }
              >
                {batch?.status === 'draft' ? 'Start batch & step' : 'Start step'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BatchShortStockDialogs
        stockSeed={shortStockSeed}
        purchaseSeed={shortPurchaseSeed}
        onStockOpenChange={(open) => {
          if (!open) setShortStockSeed(null);
        }}
        onPurchaseOpenChange={(open) => {
          if (!open) setShortPurchaseSeed(null);
        }}
      />
      <ProductionScheduleConflictDialog
        open={overlapConflicts.length > 0}
        conflicts={overlapConflicts}
        onCancel={() => setOverlapConflicts([])}
        onSaveAnyway={() => {
          const pending = overlapConflicts;
          setOverlapConflicts(pending);
          void handleSaveBatchDetails();
        }}
      />
      <ProductionStartLiveMachineDialog
        open={startStepLiveConflict != null}
        machineName={
          startStepMachine?.name ??
          startStepMachineLabel ??
          (pendingOpenStageLogRef.current
            ? getMachineName(resolveStageLogMachineId(pendingOpenStageLogRef.current) ?? 0)
            : null)
        }
        liveWork={startStepLiveConflict}
        onCancel={() => {
          setStartStepLiveConflict(null);
          pendingOpenStageLogRef.current = null;
          pendingStartStepRef.current = null;
        }}
        onConfirm={() => {
          const pendingLog = pendingOpenStageLogRef.current;
          setStartStepLiveConflict(null);
          if (pendingLog) {
            const ackMachineId = resolveStageLogMachineId(pendingLog);
            startLiveAckMachineIdRef.current = ackMachineId;
            pendingOpenStageLogRef.current = null;
            openStartStepDialog(pendingLog);
            return;
          }
          startLiveAckMachineIdRef.current = startStepResolvedMachineId;
          executeStartStep();
        }}
      />
      <ProductionMachinePickWarningDialog
        open={startStepPickWarnings != null && startStepPickWarnings.length > 0}
        machineName={startStepMachine?.name ?? startStepMachineLabel}
        warnings={startStepPickWarnings ?? []}
        onCancel={() => {
          setStartStepPickWarnings(null);
          pendingStartStepRef.current = null;
        }}
        onContinue={() => {
          setStartStepPickWarnings(null);
          executeStartStep();
        }}
      />
    </>
  );
};

export default BatchDetailPanel;

