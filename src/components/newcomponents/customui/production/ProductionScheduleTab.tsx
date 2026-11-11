import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { endOfDay } from 'date-fns';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetProductionScheduleQuery } from '@/features/production/productionApi';
import { useGetWorkspaceShiftsQuery } from '@/features/workspaceShifts/workspaceShiftsApi';
import type { ProductionLine, ProductionScheduleBatch } from '@/types/production';
import { cn } from '@/lib/utils';
import { ProductionScheduleProgramsDialog } from '@/components/newcomponents/customui/production/ProductionScheduleProgramsDialog';
import ProductionScheduleWeekPicker from '@/components/newcomponents/customui/production/ProductionScheduleWeekPicker';
import { ProductionScheduleWeekStepCard } from '@/components/newcomponents/customui/production/ProductionScheduleWeekStepCard';
import type { ProductionWeekBatchGrid } from '@/pages/newpages/production/productionPageUrl';
import {
  SCHEDULE_WEEK_CELL_VISIBLE_CARDS,
  buildScheduleWeekDisplayHours,
  countStepStartsByDay,
  formatScheduleWeekHourLabel,
  clusterHourGridSpans,
  hourGridSpansForDay,
  scheduleStepsForCell,
  type ScheduleWeekBoardRow,
} from '@/components/newcomponents/customui/production/scheduleWeekBoard';
import {
  buildProductionScheduleWeekRange,
  productionScheduleTodayWeekAnchor,
} from '@/components/newcomponents/customui/production/productionScheduleWeek';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import { dateFnsLocale } from '@/utils/datetime';
import { sheetCalendarGridBounds } from '@/pages/newpages/orders/workOrderSheetData';
const scheduleToolbarClass =
  'flex shrink-0 flex-wrap items-center justify-end gap-2';

const GRID_COLS = '160px repeat(7, minmax(104px, 1fr))';

interface ProductionScheduleTabProps {
  factoryId: number | null;
  showFactoryScopeAll?: boolean;
  factoryNameById?: Map<number, string>;
  lines: ProductionLine[];
  scheduleBatches?: ProductionScheduleBatch[];
  onCreateOnDay?: (day: Date) => void;
  onOpenBatch?: (batchId: number, day: Date) => void;
  onPickDay?: (day: Date) => void;
  /** Filters the toolbar line control to this line (same as the line popover). */
  onSelectLine?: (lineId: number) => void;
  getFormulaLabel?: (batchId: number) => string | null;
  scheduleBatchPredicate?: (batch: ProductionScheduleBatch) => boolean;
  onHeaderControls?: (node: React.ReactNode) => void;
  weekAnchorIso?: string;
  onWeekAnchorChange?: (iso: string) => void;
  hideChrome?: boolean;
  /** Week board layout from URL; day/all views ignore this. */
  weekBatchGrid?: ProductionWeekBatchGrid;
}

const ProductionScheduleTab: React.FC<ProductionScheduleTabProps> = ({
  factoryId,
  showFactoryScopeAll = false,
  factoryNameById,
  lines,
  onCreateOnDay: _onCreateOnDay,
  onOpenBatch,
  onPickDay,
  onSelectLine,
  getFormulaLabel,
  scheduleBatchPredicate,
  onHeaderControls,
  weekAnchorIso: controlledWeekAnchorIso,
  onWeekAnchorChange,
  hideChrome = false,
  weekBatchGrid = 'lines',
}) => {
  const { t } = useTranslation('production');
  const scheduleQueryFactoryId = factoryId ?? undefined;
  const { data: workspaceShifts = [] } = useGetWorkspaceShiftsQuery({ activeOnly: true });
  const { use24Hour } = useUserTimeFormat();
  const [programsOpen, setProgramsOpen] = useState(false);
  const [hoveredBatchId, setHoveredBatchId] = useState<number | null>(null);
  const today = useMemo(() => new Date(), []);

  const handleOpenBatch = (batchId: number, day: Date) => {
    onOpenBatch?.(batchId, day);
  };

  const [internalWeekAnchorIso, setInternalWeekAnchorIso] = useState(productionScheduleTodayWeekAnchor);
  const weekAnchorIso = controlledWeekAnchorIso ?? internalWeekAnchorIso;
  const setWeekAnchorIso = useCallback(
    (iso: string) => {
      onWeekAnchorChange?.(iso);
      if (controlledWeekAnchorIso == null) setInternalWeekAnchorIso(iso);
    },
    [controlledWeekAnchorIso, onWeekAnchorChange],
  );
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(new Date()));

  const range = useMemo(
    () => buildProductionScheduleWeekRange(weekAnchorIso),
    [weekAnchorIso],
  );

  const pickerBounds = useMemo(() => sheetCalendarGridBounds(pickerMonth), [pickerMonth]);

  const { data: scheduleFromApi = [], isLoading } = useGetProductionScheduleQuery({
    factory_id: scheduleQueryFactoryId,
    start: range.start,
    end: range.end,
  });

  const { data: calendarSchedule = [] } = useGetProductionScheduleQuery({
    factory_id: scheduleQueryFactoryId,
    start: pickerBounds.from.toISOString(),
    end: endOfDay(pickerBounds.to).toISOString(),
  });

  const scheduleBatches = useMemo(() => {
    if (!scheduleBatchPredicate) return scheduleFromApi;
    return scheduleFromApi.filter(scheduleBatchPredicate);
  }, [scheduleFromApi, scheduleBatchPredicate]);

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

  const weekStepCountByDay = useMemo(
    () => countStepStartsByDay(scheduleBatches),
    [scheduleBatches],
  );

  const filteredLineIds = useMemo(() => lines.map((line) => line.id), [lines]);
  const lineNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const line of lines) map.set(line.id, line.name);
    return map;
  }, [lines]);

  const lineFactoryById = useMemo(() => {
    const map = new Map<number, number>();
    for (const line of lines) map.set(line.id, line.factory_id);
    return map;
  }, [lines]);

  const factoryHintForStep = useCallback(
    (lineId: number | null | undefined) => {
      if (!showFactoryScopeAll || lineId == null || !factoryNameById) return null;
      const factoryKey = lineFactoryById.get(lineId);
      if (factoryKey == null) return null;
      return factoryNameById.get(factoryKey) ?? null;
    },
    [showFactoryScopeAll, factoryNameById, lineFactoryById],
  );

  const displayHours = useMemo(() => {
    if (weekBatchGrid !== 'hours') return [];
    return buildScheduleWeekDisplayHours(
      workspaceShifts,
      scheduleBatches,
      filteredLineIds,
      range.days,
    );
  }, [weekBatchGrid, workspaceShifts, scheduleBatches, filteredLineIds, range.days]);

  const useHourGrid = weekBatchGrid === 'hours' && displayHours.length > 0;

  const hourGridSpansByDay = useMemo(() => {
    if (!useHourGrid) return [];
    return range.days.map((day) =>
      hourGridSpansForDay(scheduleBatches, filteredLineIds, day, displayHours),
    );
  }, [useHourGrid, range.days, scheduleBatches, filteredLineIds, displayHours]);

  const hasPlannedStepsThisWeek = useMemo(() => {
    if (useHourGrid) {
      return hourGridSpansByDay.some((spans) => spans.length > 0);
    }
    return lines.some((line) =>
      range.days.some((day) => scheduleStepsForCell(scheduleBatches, line.id, day).length > 0),
    );
  }, [useHourGrid, hourGridSpansByDay, lines, range.days, scheduleBatches]);

  const renderStepCards = (blocks: ScheduleWeekBoardRow[], day: Date) =>
    blocks.map(({ batch, step }) => (
      <ProductionScheduleWeekStepCard
        key={step.stage_log_id}
        batch={batch}
        step={step}
        shifts={workspaceShifts}
        use24Hour={use24Hour}
        formulaLabel={getFormulaLabel?.(batch.batch_id) ?? null}
        factoryNameHint={factoryHintForStep(step.production_line_id)}
        interactive={Boolean(onOpenBatch)}
        highlighted={hoveredBatchId === batch.batch_id}
        onHoverStart={() => setHoveredBatchId(batch.batch_id)}
        onHoverEnd={() => setHoveredBatchId(null)}
        onOpen={() => handleOpenBatch(batch.batch_id, day)}
      />
    ));

  useEffect(() => {
    if (hideChrome) {
      onHeaderControls?.(null);
      return;
    }
    onHeaderControls?.(
      <div className={scheduleToolbarClass}>
        <Button type="button" variant="outline" size="sm" onClick={() => setProgramsOpen(true)}>
          {t('recurringPrograms')}
        </Button>
        <ProductionScheduleWeekPicker
          weekAnchorIso={weekAnchorIso}
          onWeekAnchorChange={setWeekAnchorIso}
          planCountByDate={planCountByDate}
          calendarMonth={pickerMonth}
          onCalendarMonthChange={setPickerMonth}
        />
      </div>,
    );
    return () => onHeaderControls?.(null);
  }, [hideChrome, onHeaderControls, weekAnchorIso, planCountByDate, pickerMonth, setWeekAnchorIso, setPickerMonth, t]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {hideChrome ? null : (
        <div className={cn(scheduleToolbarClass, 'border-b border-border bg-card/50 px-4 py-2.5 lg:hidden')}>
          <Button type="button" variant="outline" size="sm" onClick={() => setProgramsOpen(true)}>
            {t('recurringPrograms')}
          </Button>
          <ProductionScheduleWeekPicker
            weekAnchorIso={weekAnchorIso}
            onWeekAnchorChange={setWeekAnchorIso}
            planCountByDate={planCountByDate}
            calendarMonth={pickerMonth}
            onCalendarMonthChange={setPickerMonth}
          />
        </div>
        )}
        <div className="relative min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/40">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : null}
        <div
          className="inline-grid min-w-full auto-rows-min gap-0"
          style={{ gridTemplateColumns: GRID_COLS }}
          onMouseLeave={() => setHoveredBatchId(null)}
        >
          <div
            className={cn(
              'sticky left-0 top-0 z-30 flex min-h-[3.25rem] items-center border-b border-r border-border bg-background px-2 py-1.5',
              'text-xs font-medium text-muted-foreground',
            )}
          >
            {useHourGrid ? t('time') : t('lines')}
          </div>
          {range.days.map((day) => {
            const dayIso = format(day, 'yyyy-MM-dd');
            const stepCount = weekStepCountByDay[dayIso] ?? 0;
            const isToday = isSameDay(day, today);
            return (
              <button
                key={dayIso}
                type="button"
                title={t('viewDay')}
                onClick={() => onPickDay?.(day)}
                className={cn(
                  'sticky top-0 z-20 flex min-h-[3.25rem] items-center gap-1.5 border-b border-l border-border bg-background px-2 py-1.5 text-left transition-colors',
                  'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isToday && 'ring-1 ring-inset ring-brand-primary/30 border-t-2 border-t-brand-primary/45',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-foreground">
                    {format(day, 'EEE', { locale: dateFnsLocale() })}
                    {isToday ? (
                      <span className="ml-1 text-[10px] font-normal text-brand-primary">{t('today')}</span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{format(day, 'd MMM', { locale: dateFnsLocale() })}</div>
                </div>
                {stepCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="h-5 shrink-0 px-1.5 text-[10px] font-normal tabular-nums"
                  >
                    {stepCount}
                  </Badge>
                ) : null}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            );
          })}

          {useHourGrid ? (
            <>
              {displayHours.map((hour, hourIndex) => (
                <div
                  key={`time-${hour}`}
                  className="sticky left-0 z-10 flex min-h-14 items-start border-b border-r border-border bg-background py-2 pl-2 pr-2 text-xs font-medium tabular-nums text-muted-foreground"
                  style={{ gridRow: hourIndex + 2, gridColumn: 1 }}
                >
                  {formatScheduleWeekHourLabel(hour, use24Hour)}
                </div>
              ))}
              {displayHours.map((hour, hourIndex) =>
                range.days.map((day, dayIndex) => {
                  const dayIso = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={`cell-${hour}-${dayIso}`}
                      className={cn(
                        'relative flex min-h-14 flex-col border-b border-l border-border',
                        isToday && 'bg-brand-primary/[0.04]',
                      )}
                      style={{ gridRow: hourIndex + 2, gridColumn: dayIndex + 2 }}
                    />
                  );
                }),
              )}
              {range.days.map((day, dayIndex) => {
                const dayIso = format(day, 'yyyy-MM-dd');
                const overlaySpans = hourGridSpansByDay[dayIndex] ?? [];
                return clusterHourGridSpans(overlaySpans).map((cluster) => {
                  const startIndex = Math.min(...cluster.map((s) => s.startIndex));
                  const endIndex = Math.max(...cluster.map((s) => s.endIndex));
                  const clusterKey = cluster.map((s) => s.stageLogId).join('-');
                  const singleCard = cluster.length === 1;
                  return (
                    <div
                      key={`cluster-${dayIso}-${clusterKey}`}
                      className="pointer-events-none relative z-[2] flex min-h-0 flex-col gap-1 p-0.5"
                      style={{
                        gridRow: `${startIndex + 2} / ${endIndex + 2}`,
                        gridColumn: dayIndex + 2,
                      }}
                    >
                      {cluster.map((span) => {
                        const lineId = span.step.production_line_id;
                        const lineName =
                          lineId != null ? (lineNameById.get(lineId) ?? null) : null;
                        return (
                          <div
                            key={span.stageLogId}
                            className={cn(
                              'pointer-events-auto min-h-0 shrink-0',
                              singleCard && 'flex h-full min-h-0 flex-1 flex-col',
                            )}
                          >
                            <ProductionScheduleWeekStepCard
                              batch={span.batch}
                              step={span.step}
                              shifts={workspaceShifts}
                              use24Hour={use24Hour}
                              formulaLabel={getFormulaLabel?.(span.batch.batch_id) ?? null}
                              lineName={lineName}
                              factoryNameHint={factoryHintForStep(span.step.production_line_id)}
                              fillHeight={singleCard}
                              interactive={Boolean(onOpenBatch)}
                              highlighted={hoveredBatchId === span.batch.batch_id}
                              onHoverStart={() => setHoveredBatchId(span.batch.batch_id)}
                              onHoverEnd={() => setHoveredBatchId(null)}
                              onOpen={() => handleOpenBatch(span.batch.batch_id, day)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                });
              })}
            </>
          ) : (
            lines.map((line) => (
                <React.Fragment key={line.id}>
                  {onSelectLine ? (
                    <button
                      type="button"
                      title={line.name}
                      className={cn(
                        'sticky left-0 z-10 flex min-h-14 w-full items-start border-b border-r border-border bg-background py-2 pl-2 pr-2 text-left text-sm font-medium transition-colors',
                        'hover:bg-muted/50 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      )}
                      onClick={() => onSelectLine(line.id)}
                    >
                      <span className="line-clamp-2 leading-snug">{line.name}</span>
                      {showFactoryScopeAll && factoryNameById ? (
                        <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground">
                          {factoryNameById.get(line.factory_id) ?? 'Factory'}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <div className="sticky left-0 z-10 flex min-h-14 flex-col items-start justify-start border-b border-r border-border bg-background py-2 pl-2 pr-2 text-sm font-medium">
                      <span className="line-clamp-2 leading-snug">{line.name}</span>
                      {showFactoryScopeAll && factoryNameById ? (
                        <span className="mt-0.5 line-clamp-1 text-[10px] font-normal text-muted-foreground">
                          {factoryNameById.get(line.factory_id) ?? 'Factory'}
                        </span>
                      ) : null}
                    </div>
                  )}
                  {range.days.map((day) => {
                    const dayIso = format(day, 'yyyy-MM-dd');
                    const isToday = isSameDay(day, today);
                    const blocks = scheduleStepsForCell(scheduleBatches, line.id, day);
                    const visible = blocks.slice(0, SCHEDULE_WEEK_CELL_VISIBLE_CARDS);
                    const overflow = blocks.length - visible.length;

                    return (
                      <div
                        key={`${line.id}-${dayIso}`}
                        className={cn(
                          'relative min-h-14 border-b border-l border-border p-1',
                          isToday && 'bg-brand-primary/[0.04]',
                        )}
                      >
                        {renderStepCards(visible, day)}
                        {overflow > 0 ? (
                          <button
                            type="button"
                            className="w-full rounded px-1 py-0.5 text-left text-[10px] font-medium text-brand-primary hover:underline"
                            onClick={() => onPickDay?.(day)}
                          >
                            +{overflow} more
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))
          )}
        </div>
        {!hasPlannedStepsThisWeek && lines.length > 0 && weekBatchGrid === 'lines' ? (
          <p className="px-4 pt-4 text-sm text-muted-foreground">{t('noPlannedWeek')}</p>
        ) : null}
        {weekBatchGrid === 'hours' && displayHours.length === 0 && lines.length > 0 ? (
          <p className="px-4 pt-4 text-sm text-muted-foreground">
            No shift or scheduled hours this week.
          </p>
        ) : null}
        </div>
      </div>

      <ProductionScheduleProgramsDialog
        open={programsOpen}
        onOpenChange={setProgramsOpen}
        factoryId={factoryId}
        factoryNameById={factoryNameById}
      />

    </>
  );
};

export default ProductionScheduleTab;
