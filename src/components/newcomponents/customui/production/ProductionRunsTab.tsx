import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { endOfDay, format, parseISO, startOfDay, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import ProductionRunsToolbar from '@/components/newcomponents/customui/production/ProductionRunsToolbar';
import { isAllProductionLinesSelected } from '@/components/newcomponents/customui/production/productionRunsLineFilterUtils';
import { ProductionScheduleProgramsDialog } from '@/components/newcomponents/customui/production/ProductionScheduleProgramsDialog';
import ProductionScheduleTab from '@/components/newcomponents/customui/production/ProductionScheduleTab';
import BatchRow from '@/components/newcomponents/customui/production/panels/BatchRow';
import { productionScheduleWeekPeriodLabel } from '@/components/newcomponents/customui/production/productionScheduleWeek';
import { useGetProductionScheduleQuery } from '@/features/production/productionApi';
import { useGetWorkspaceShiftsQuery } from '@/features/workspaceShifts/workspaceShiftsApi';
import { findShiftForDate } from '@/lib/workspaceShiftChipUtils';
import { sheetCalendarGridBounds } from '@/pages/newpages/orders/workOrderSheetData';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type {
  ProductionWeekBatchGrid,
} from '@/pages/newpages/production/productionPageUrl';
import { cn } from '@/lib/utils';
import type {
  ProductionBatch,
  ProductionFormula,
  ProductionLine,
  ProductionScheduleBatch,
} from '@/types/production';

interface ProductionRunsTabProps {
  factoryId: number | null;
  showFactoryScopeAll?: boolean;
  factoryNameById?: Map<number, string>;
  lines: ProductionLine[];
  batches: ProductionBatch[];
  /** Status / search / machine gate for schedule API rows (no batch-line filter). */
  scheduleFilterBatches?: ProductionBatch[];
  formulas: ProductionFormula[];
  getItemName: (itemId: number) => string;
  getStatusBadge: (status: string) => string;
  isLgScreen: boolean;
  onNewRun: (day: Date | null) => void;
  onNewRecurring?: () => void;
  onHeaderControls?: (node: React.ReactNode) => void;
  renderDetail: (batchId: number, close: () => void) => React.ReactNode;
  /** Full factory line list for schedule line gating. */
  allLines: ProductionLine[];
  selectedLineIds: number[];
  dateViewMode: WorkOrdersDateViewMode;
  weekAnchorIso: string;
  dayIso: string;
  onDateViewModeChange: (mode: WorkOrdersDateViewMode) => void;
  onPickWeek: (iso: string) => void;
  onPickDay: (iso: string) => void;
  /** Day + batch selection together. Split URL writes drop the selection. */
  onOpenDay: (iso: string, batchId: number | null) => void;
  selectedBatchId: number | null;
  onSelectedBatchChange: (batchId: number | null) => void;
  weekBatchGrid: ProductionWeekBatchGrid;
  onWeekBatchGridChange: (grid: ProductionWeekBatchGrid) => void;
  onSelectedLineIdsChange: (lineIds: number[]) => void;
}

function batchesOnDay(rows: ProductionScheduleBatch[], dayIso: string): ProductionScheduleBatch[] {
  const seen = new Set<number>();
  const matched: ProductionScheduleBatch[] = [];
  for (const batch of rows) {
    const onDay = batch.steps.some(
      (step) => format(new Date(step.planned_start_at), 'yyyy-MM-dd') === dayIso,
    );
    if (!onDay || seen.has(batch.batch_id)) continue;
    seen.add(batch.batch_id);
    matched.push(batch);
  }
  return matched;
}

function rowFromSchedule(batch: ProductionScheduleBatch, loaded: ProductionBatch | undefined): ProductionBatch {
  if (loaded) return loaded;
  const status =
    batch.status === 'recurring' ||
    batch.status === 'in_progress' ||
    batch.status === 'completed' ||
    batch.status === 'cancelled'
      ? batch.status
      : 'draft';
  return {
    id: batch.batch_id,
    workspace_id: 0,
    batch_number: batch.batch_number,
    production_line_id: batch.steps.find((step) => step.production_line_id != null)?.production_line_id ?? 0,
    machine_id: batch.machine_id ?? null,
    formula_id: null,
    planned_start_at: batch.planned_start_at,
    planned_end_at: batch.planned_end_at,
    batch_date: format(new Date(batch.planned_start_at), 'yyyy-MM-dd'),
    shift: null,
    status,
    expected_output_quantity: null,
    expected_duration_minutes: null,
    actual_output_quantity: null,
    actual_duration_minutes: null,
    actual_start_time: null,
    actual_end_time: null,
    output_variance_quantity: null,
    output_variance_percentage: null,
    efficiency_percentage: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: batch.planned_start_at,
    updated_at: batch.planned_start_at,
    started_by: null,
    started_at: null,
    completed_by: null,
    completed_at: null,
  };
}

const ProductionRunsTab: React.FC<ProductionRunsTabProps> = ({
  factoryId,
  showFactoryScopeAll = false,
  factoryNameById,
  lines,
  batches,
  scheduleFilterBatches,
  formulas,
  getItemName,
  getStatusBadge,
  isLgScreen,
  onNewRun,
  onNewRecurring,
  onHeaderControls,
  renderDetail,
  allLines,
  selectedLineIds,
  weekBatchGrid,
  onWeekBatchGridChange,
  dateViewMode: mode,
  weekAnchorIso,
  dayIso,
  onDateViewModeChange,
  onPickWeek,
  onPickDay,
  onOpenDay,
  selectedBatchId,
  onSelectedBatchChange,
  onSelectedLineIdsChange,
}) => {
  const { t } = useTranslation('production');
  const [programsOpen, setProgramsOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(parseISO(dayIso)));
  const { data: workspaceShifts = [] } = useGetWorkspaceShiftsQuery({ activeOnly: true });
  const activeShifts = useMemo(
    () => workspaceShifts.filter((shift) => shift.is_active),
    [workspaceShifts],
  );

  const lineFactoryById = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of allLines) map.set(line.id, line.factory_id);
    return map;
  }, [allLines]);

  const factoryHintForLineId = useCallback(
    (lineId: number | null | undefined) => {
      if (!showFactoryScopeAll || lineId == null || !factoryNameById) return null;
      const factoryKey = lineFactoryById.get(lineId);
      if (factoryKey == null) return null;
      return factoryNameById.get(factoryKey) ?? null;
    },
    [showFactoryScopeAll, factoryNameById, lineFactoryById],
  );

  const factoryHintForBatch = useCallback(
    (batch: ProductionBatch) => factoryHintForLineId(batch.production_line_id),
    [factoryHintForLineId],
  );

  const plannedShiftLabelForBatch = useCallback(
    (batch: ProductionBatch) => {
      if (!batch.planned_start_at || activeShifts.length === 0) return null;
      const when = new Date(batch.planned_start_at);
      if (Number.isNaN(when.getTime())) return null;
      return findShiftForDate(activeShifts, when)?.name ?? null;
    },
    [activeShifts],
  );

  const scheduleQueryFactoryId = factoryId ?? undefined;

  const pickerBounds = useMemo(() => sheetCalendarGridBounds(pickerMonth), [pickerMonth]);
  const { data: calendarSchedule = [] } = useGetProductionScheduleQuery(
    {
      factory_id: scheduleQueryFactoryId,
      start: pickerBounds.from.toISOString(),
      end: endOfDay(pickerBounds.to).toISOString(),
    },
  );

  const dayRange = useMemo(() => {
    const day = parseISO(dayIso);
    return { start: startOfDay(day).toISOString(), end: endOfDay(day).toISOString() };
  }, [dayIso]);

  const { data: daySchedule = [] } = useGetProductionScheduleQuery(
    { factory_id: scheduleQueryFactoryId, start: dayRange.start, end: dayRange.end },
    { skip: mode !== 'day' },
  );

  const planCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const batch of calendarSchedule) {
      for (const step of batch.steps) {
        const key = format(new Date(step.planned_start_at), 'yyyy-MM-dd');
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  }, [calendarSchedule]);

  const loadedById = useMemo(() => {
    const map = new Map<number, ProductionBatch>();
    for (const batch of batches) map.set(batch.id, batch);
    return map;
  }, [batches]);

  const allowedBatchIds = useMemo(() => new Set(batches.map((b) => b.id)), [batches]);

  const scheduleEligibleBatchIds = useMemo(
    () => new Set((scheduleFilterBatches ?? batches).map((b) => b.id)),
    [scheduleFilterBatches, batches],
  );

  const scheduleBatchPredicate = useCallback(
    (row: ProductionScheduleBatch) => {
      if (!scheduleEligibleBatchIds.has(row.batch_id)) return false;
      if (selectedLineIds.length === 0) return false;
      if (isAllProductionLinesSelected(selectedLineIds, allLines)) return true;
      return row.steps.some(
        (step) =>
          step.production_line_id != null && selectedLineIds.includes(step.production_line_id),
      );
    },
    [scheduleEligibleBatchIds, selectedLineIds, allLines],
  );

  const listBatches = useMemo(() => {
    if (mode === 'day') {
      return batchesOnDay(daySchedule, dayIso)
        .filter((row) => allowedBatchIds.has(row.batch_id))
        .map((batch) => rowFromSchedule(batch, loadedById.get(batch.batch_id)));
    }
    return batches;
  }, [mode, daySchedule, dayIso, loadedById, batches, allowedBatchIds]);

  const sheetDate = mode === 'week' ? weekAnchorIso : dayIso;
  const weekPeriodLabel = productionScheduleWeekPeriodLabel(weekAnchorIso);

  useEffect(() => {
    onHeaderControls?.(
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setProgramsOpen(true)}>
          {t('recurringPrograms')}
        </Button>
        <Button type="button" size="sm" onClick={() => onNewRun(mode === 'day' ? parseISO(dayIso) : null)}>
          {t('newBatch')}
        </Button>
      </div>,
    );
    return () => onHeaderControls?.(null);
  }, [onHeaderControls, onNewRun, mode, dayIso, t]);

  const openDayView = (day: Date, batchId?: number | null) => {
    setPickerMonth(startOfMonth(day));
    onOpenDay(format(day, 'yyyy-MM-dd'), batchId ?? null);
  };

  const openBatchOnDay = (batchId: number, day: Date) => {
    openDayView(day, batchId);
  };

  const getFormulaLabel = useCallback(
    (batchId: number) => {
      const batch = loadedById.get(batchId);
      if (!batch?.formula_id) return 'Simple';
      const formula = formulas.find((f) => f.id === batch.formula_id);
      return formula?.name ?? 'Simple';
    },
    [loadedById, formulas],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <ProductionRunsToolbar
        dateViewMode={mode}
        sheetDate={sheetDate}
        weekPeriodLabel={weekPeriodLabel}
        onDateViewModeChange={onDateViewModeChange}
        onPickDate={(iso) => {
          onPickDay(iso);
          setPickerMonth(startOfMonth(parseISO(iso)));
        }}
        onPickWeek={(iso) => {
          onPickWeek(iso);
          setPickerMonth(startOfMonth(parseISO(iso)));
        }}
        orderCountByDate={planCountByDate}
        calendarMonth={pickerMonth}
        onCalendarMonthChange={setPickerMonth}
        weekBatchGrid={weekBatchGrid}
        onWeekBatchGridChange={onWeekBatchGridChange}
      />

      {mode === 'week' ? (
        <ProductionScheduleTab
          factoryId={factoryId}
          showFactoryScopeAll={showFactoryScopeAll}
          factoryNameById={factoryNameById}
          lines={lines}
          hideChrome
          weekAnchorIso={weekAnchorIso}
          onWeekAnchorChange={onPickWeek}
          onOpenBatch={openBatchOnDay}
          onPickDay={(day) => openDayView(day)}
          onCreateOnDay={(day) => onNewRun(day)}
          getFormulaLabel={getFormulaLabel}
          scheduleBatchPredicate={scheduleBatchPredicate}
          onSelectLine={(lineId) => onSelectedLineIdsChange([lineId])}
          weekBatchGrid={weekBatchGrid}
        />
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              'flex h-full min-h-0 w-full shrink-0 flex-col border-r border-border bg-card lg:w-[360px]',
              selectedBatchId != null && 'max-lg:hidden',
              !isLgScreen && 'flex-1 border-r-0',
            )}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="min-w-0 truncate text-base font-semibold text-card-foreground">
                {t('batches')}
                <span className="ml-1.5 font-normal text-muted-foreground">({listBatches.length})</span>
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {listBatches.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted-foreground">
                  <p>{t('noBatchesMatch')}</p>
                  <Button size="sm" onClick={() => onNewRun(mode === 'day' ? parseISO(dayIso) : null)}>
                    {t('newBatch')}
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {listBatches.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      formulas={formulas}
                      getItemName={getItemName}
                      getStatusBadge={getStatusBadge}
                      factoryNameHint={factoryHintForBatch(batch)}
                      plannedShiftLabel={plannedShiftLabelForBatch(batch)}
                      isSelected={selectedBatchId === batch.id}
                      onClick={() =>
                        onSelectedBatchChange(selectedBatchId === batch.id ? null : batch.id)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
              selectedBatchId == null && 'max-lg:hidden',
            )}
          >
            {selectedBatchId != null ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-6 px-4 pb-6 pt-4 lg:px-6">
                  {renderDetail(selectedBatchId, () => onSelectedBatchChange(null))}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Select a batch to view details
              </div>
            )}
          </div>
        </div>
      )}

      <ProductionScheduleProgramsDialog
        open={programsOpen}
        onOpenChange={setProgramsOpen}
        factoryId={factoryId}
        factoryNameById={factoryNameById}
        onCreateRecurring={
          onNewRecurring
            ? () => {
                setProgramsOpen(false);
                onNewRecurring();
              }
            : undefined
        }
        onOpenBatch={(batchId, plannedStart) => {
          openBatchOnDay(batchId, plannedStart ?? new Date());
        }}
      />
    </div>
  );
};

export default ProductionRunsTab;
