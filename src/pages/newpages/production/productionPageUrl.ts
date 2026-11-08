import type { ProductionPageTab } from '@/components/newcomponents/customui/production/ProductionPageHeaderTabs';
import {
  isDefaultBatchStatusFilter,
  normalizeLegacyBatchStatusToken,
  PRODUCTION_BATCH_STATUSES,
  stripCompletedFromStatusFilter,
  type ProductionBatchStatus,
} from '@/components/newcomponents/customui/production/ProductionContextFilters';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';

export const PRODUCTION_URL_PARAMS = {
  tab: 'tab',
  factoryId: 'factoryId',
  batchId: 'batchId',
  lineId: 'lineId',
  q: 'q',
  statuses: 'statuses',
  formulaId: 'formulaId',
  setupQ: 'setupQ',
  showCompleted: 'showCompleted',
  batchFrom: 'batchFrom',
  batchTo: 'batchTo',
  /**
   * Batches toolbar date anchor (week start or calendar day).
   * Same idea as Work Orders `woDate`. Not `batchFrom` / `batchTo` (overview range).
   */
  batchDate: 'batchDate',
  /**
   * Qualifies `batchDate`. `day` = day list; `all` = all dates (no anchor).
   * Omit with `batchDate` = week board. Same pair order as `woDate` + `woDateScope`.
   */
  batchDateScope: 'batchDateScope',
  /** Comma-separated line ids. Omit = all lines. `none` = none. Distinct from overview `lineId`. */
  batchLines: 'batchLines',
  /** Machine inside Filters. Omit = all. */
  batchMachine: 'batchMachine',
  /** Week board layout. Omit = lines by days. `hours` = hours by days. */
  batchGrid: 'batchGrid',
} as const;

/** Week schedule grid when `batchGrid=hours`; otherwise lines × days. */
export type ProductionWeekBatchGrid = 'lines' | 'hours';

export function parseProductionWeekBatchGrid(raw: string | null): ProductionWeekBatchGrid {
  if (raw === 'hours') return 'hours';
  return 'lines';
}

/** Keys each tab may keep, in URL order. `factoryId` is on every tab. */
export const PRODUCTION_TAB_PARAM_ORDER: Record<
  ProductionPageTab,
  readonly (typeof PRODUCTION_URL_PARAMS)[keyof typeof PRODUCTION_URL_PARAMS][]
> = {
  overview: [
    PRODUCTION_URL_PARAMS.factoryId,
    PRODUCTION_URL_PARAMS.lineId,
    PRODUCTION_URL_PARAMS.q,
    PRODUCTION_URL_PARAMS.showCompleted,
    PRODUCTION_URL_PARAMS.statuses,
    PRODUCTION_URL_PARAMS.batchFrom,
    PRODUCTION_URL_PARAMS.batchTo,
  ],
  batches: [
    PRODUCTION_URL_PARAMS.tab,
    PRODUCTION_URL_PARAMS.factoryId,
    PRODUCTION_URL_PARAMS.batchId,
    PRODUCTION_URL_PARAMS.batchDate,
    PRODUCTION_URL_PARAMS.batchDateScope,
    PRODUCTION_URL_PARAMS.batchLines,
    PRODUCTION_URL_PARAMS.batchGrid,
    PRODUCTION_URL_PARAMS.q,
    PRODUCTION_URL_PARAMS.showCompleted,
    PRODUCTION_URL_PARAMS.batchMachine,
    PRODUCTION_URL_PARAMS.statuses,
  ],
  setup: [
    PRODUCTION_URL_PARAMS.tab,
    PRODUCTION_URL_PARAMS.factoryId,
    PRODUCTION_URL_PARAMS.formulaId,
    PRODUCTION_URL_PARAMS.setupQ,
  ],
};

export const PRODUCTION_RUNS_LINES_NONE = 'none';

/** `null` = param omitted (week when `batchDate` is set). */
export type ProductionBatchDateScope = 'day' | 'all' | null;

export function parseProductionBatchDateScope(raw: string | null): ProductionBatchDateScope {
  if (raw === 'day' || raw === 'all') return raw;
  return null;
}

export function deriveProductionBatchDateViewMode(
  batchDate: string | null,
  batchDateScope: ProductionBatchDateScope,
): WorkOrdersDateViewMode {
  if (batchDateScope === 'all' || !batchDate) return 'all';
  if (batchDateScope === 'day') return 'day';
  return 'week';
}

function parseRunsLineIdsParam(raw: string | null): number[] | null {
  if (raw == null) return null;
  if (raw === PRODUCTION_RUNS_LINES_NONE) return [];
  if (raw.trim() === '') return null;
  const ids = raw
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return ids;
}

function parseRunsMachineParam(raw: string | null): string {
  if (raw == null || raw === '' || raw === 'all') return 'all';
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? String(n) : 'all';
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseBatchDateParam(raw: string | null): string | null {
  if (raw == null || raw === '') return null;
  const trimmed = raw.trim();
  return ISO_DATE_RE.test(trimmed) ? trimmed : null;
}

const VALID_TABS: ProductionPageTab[] = ['overview', 'setup', 'batches'];

export function parseProductionPageTab(raw: string | null): ProductionPageTab | null {
  if (raw == null || raw === '') return null;
  if (raw === 'schedule' || raw === 'runs') return 'batches';
  return VALID_TABS.includes(raw as ProductionPageTab) ? (raw as ProductionPageTab) : null;
}

function parsePositiveInt(raw: string | null): number | null {
  if (raw == null || raw === '') return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseStatuses(raw: string | null): ProductionBatchStatus[] | null {
  if (raw == null) return null;
  if (raw === '') return null;
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map(normalizeLegacyBatchStatusToken);
  const valid = parts.filter((p): p is ProductionBatchStatus =>
    PRODUCTION_BATCH_STATUSES.includes(p as ProductionBatchStatus),
  );
  return valid;
}

export function isDefaultBatchStatuses(
  statuses: ProductionBatchStatus[],
  dateViewMode?: WorkOrdersDateViewMode,
): boolean {
  return isDefaultBatchStatusFilter(statuses, dateViewMode);
}

/** URL `statuses` when present; otherwise persisted selection (never includes completed). */
export function resolveBatchStatusFilterFromSearchParams(
  searchParams: URLSearchParams,
  readStoredStatuses: () => ProductionBatchStatus[],
): ProductionBatchStatus[] {
  const parsed = parseProductionPageParams(searchParams);
  const raw = parsed.statuses !== null ? parsed.statuses : readStoredStatuses();
  return stripCompletedFromStatusFilter(raw);
}

export interface ParsedProductionPageParams {
  tab: ProductionPageTab;
  invalidTab: boolean;
  batchId: number | null;
  invalidBatchId: boolean;
  lineId: number | null;
  invalidLineId: boolean;
  q: string;
  /** `null` = param absent (use localStorage fallback). */
  statuses: ProductionBatchStatus[] | null;
  formulaId: number | null;
  invalidFormulaId: boolean;
  setupQ: string;
  showCompletedBatches: boolean;
  batchDateFrom: string | null;
  batchDateTo: string | null;
  /** Schedule anchor. `null` when absent or when scope is all dates. */
  batchDate: string | null;
  invalidBatchDate: boolean;
  /** `null` = omitted (week when `batchDate` is set; unset when it is not). */
  batchDateScope: ProductionBatchDateScope;
  invalidBatchDateScope: boolean;
  /** `null` = param absent (all lines). */
  batchLineIds: number[] | null;
  invalidBatchLines: boolean;
  batchMachine: string;
  invalidBatchMachine: boolean;
  batchGrid: ProductionWeekBatchGrid;
  invalidBatchGrid: boolean;
}

export function parseProductionPageParams(searchParams: URLSearchParams): ParsedProductionPageParams {
  const tabRaw = searchParams.get(PRODUCTION_URL_PARAMS.tab);
  const parsedTab = parseProductionPageTab(tabRaw);
  const invalidTab = tabRaw != null && tabRaw !== '' && parsedTab == null;

  const batchRaw = searchParams.get(PRODUCTION_URL_PARAMS.batchId);
  const batchParsed = parsePositiveInt(batchRaw);
  const invalidBatchId = batchRaw != null && batchRaw !== '' && batchParsed == null;

  const lineRaw = searchParams.get(PRODUCTION_URL_PARAMS.lineId);
  const lineParsed = parsePositiveInt(lineRaw);
  const invalidLineId = lineRaw != null && lineRaw !== '' && lineParsed == null;

  const formulaRaw = searchParams.get(PRODUCTION_URL_PARAMS.formulaId);
  const formulaParsed = parsePositiveInt(formulaRaw);
  const invalidFormulaId = formulaRaw != null && formulaRaw !== '' && formulaParsed == null;

  let tab: ProductionPageTab = parsedTab ?? 'overview';
  const batchId = batchParsed;
  const formulaId = formulaParsed;

  if (batchId != null && tab !== 'batches') {
    tab = 'batches';
  }

  const batchDateRaw = searchParams.get(PRODUCTION_URL_PARAMS.batchDate);
  const batchDateParsed = parseBatchDateParam(batchDateRaw);
  const invalidBatchDate = batchDateRaw != null && batchDateRaw !== '' && batchDateParsed == null;

  const scopeRaw = searchParams.get(PRODUCTION_URL_PARAMS.batchDateScope);
  const batchDateScope = parseProductionBatchDateScope(scopeRaw);
  const invalidBatchDateScope =
    (scopeRaw != null && scopeRaw !== '' && batchDateScope == null) ||
    (batchDateScope === 'day' && batchDateParsed == null);

  const batchLinesRaw = searchParams.get(PRODUCTION_URL_PARAMS.batchLines);
  const batchLineIdsParsed = parseRunsLineIdsParam(batchLinesRaw);
  const invalidBatchLines =
    batchLinesRaw != null &&
    batchLinesRaw !== '' &&
    batchLinesRaw !== PRODUCTION_RUNS_LINES_NONE &&
    batchLineIdsParsed != null &&
    batchLineIdsParsed.length === 0;

  const batchMachineRaw = searchParams.get(PRODUCTION_URL_PARAMS.batchMachine);
  const batchMachineParsed = parseRunsMachineParam(batchMachineRaw);
  const invalidBatchMachine =
    batchMachineRaw != null &&
    batchMachineRaw !== '' &&
    batchMachineRaw !== 'all' &&
    batchMachineParsed === 'all';

  const batchDate = batchDateScope === 'all' ? null : batchDateParsed;

  const batchGridRaw = searchParams.get(PRODUCTION_URL_PARAMS.batchGrid);
  const batchGrid = parseProductionWeekBatchGrid(batchGridRaw);
  const invalidBatchGrid =
    batchGridRaw != null && batchGridRaw !== '' && batchGridRaw !== 'hours';

  return {
    tab,
    invalidTab,
    batchId,
    invalidBatchId,
    lineId: lineParsed,
    invalidLineId,
    q: searchParams.get(PRODUCTION_URL_PARAMS.q)?.trim() ?? '',
    statuses: parseStatuses(searchParams.get(PRODUCTION_URL_PARAMS.statuses)),
    formulaId,
    invalidFormulaId,
    setupQ: searchParams.get(PRODUCTION_URL_PARAMS.setupQ)?.trim() ?? '',
    showCompletedBatches: searchParams.get(PRODUCTION_URL_PARAMS.showCompleted) === '1',
    batchDateFrom: parseBatchDateParam(searchParams.get(PRODUCTION_URL_PARAMS.batchFrom)),
    batchDateTo: parseBatchDateParam(searchParams.get(PRODUCTION_URL_PARAMS.batchTo)),
    batchDate,
    invalidBatchDate,
    batchDateScope,
    invalidBatchDateScope,
    batchLineIds: batchLineIdsParsed,
    invalidBatchLines,
    batchMachine: batchMachineParsed,
    invalidBatchMachine,
    batchGrid,
    invalidBatchGrid,
  };
}

export type ProductionPageUrlPatch = {
  tab?: ProductionPageTab;
  /** `null` omits the param. Stays on every tab. */
  factoryId?: number | null;
  /**
   * When the resulting tab is Batches and both date keys are absent, write this week anchor
   * in the same URL update.
   */
  batchWeekAnchor?: string;
  batchId?: number | null;
  lineId?: number | null;
  q?: string;
  statuses?: ProductionBatchStatus[];
  /** When set with `statuses`, omit URL param when filter matches default for this view. */
  statusesDateViewMode?: WorkOrdersDateViewMode;
  formulaId?: number | null;
  setupQ?: string;
  showCompletedBatches?: boolean;
  batchDateFrom?: string | null;
  batchDateTo?: string | null;
  batchDate?: string | null;
  /** `null` omits the param (week). `'all'` clears the anchor. */
  batchDateScope?: ProductionBatchDateScope;
  batchLineIds?: number[] | null;
  /** When set with `batchLineIds`, omit URL param if selection equals all factory lines. */
  batchLinesAllLineIds?: number[];
  batchMachine?: string;
  /** `null` or `'lines'` omits param. `'hours'` writes `batchGrid=hours`. */
  batchGrid?: ProductionWeekBatchGrid | null;
};

export function writeProductionPageParams(
  prev: URLSearchParams,
  patch: ProductionPageUrlPatch,
): URLSearchParams {
  const next = new URLSearchParams(prev);

  if (patch.tab !== undefined) {
    if (patch.tab === 'overview') next.delete(PRODUCTION_URL_PARAMS.tab);
    else next.set(PRODUCTION_URL_PARAMS.tab, patch.tab);
  }

  if (patch.factoryId !== undefined) {
    if (patch.factoryId == null) next.delete(PRODUCTION_URL_PARAMS.factoryId);
    else next.set(PRODUCTION_URL_PARAMS.factoryId, String(patch.factoryId));
  }

  if (patch.batchId !== undefined) {
    if (patch.batchId == null) next.delete(PRODUCTION_URL_PARAMS.batchId);
    else next.set(PRODUCTION_URL_PARAMS.batchId, String(patch.batchId));
  }

  if (patch.lineId !== undefined) {
    if (patch.lineId == null) next.delete(PRODUCTION_URL_PARAMS.lineId);
    else next.set(PRODUCTION_URL_PARAMS.lineId, String(patch.lineId));
  }

  if (patch.q !== undefined) {
    const trimmed = patch.q.trim();
    if (!trimmed) next.delete(PRODUCTION_URL_PARAMS.q);
    else next.set(PRODUCTION_URL_PARAMS.q, trimmed);
  }

  if (patch.statuses !== undefined) {
    const statusViewMode = patch.statusesDateViewMode;
    if (isDefaultBatchStatuses(patch.statuses, statusViewMode)) {
      next.delete(PRODUCTION_URL_PARAMS.statuses);
    } else {
      next.set(PRODUCTION_URL_PARAMS.statuses, patch.statuses.join(','));
    }
  }

  if (patch.formulaId !== undefined) {
    if (patch.formulaId == null) next.delete(PRODUCTION_URL_PARAMS.formulaId);
    else next.set(PRODUCTION_URL_PARAMS.formulaId, String(patch.formulaId));
  }

  if (patch.setupQ !== undefined) {
    const trimmed = patch.setupQ.trim();
    if (!trimmed) next.delete(PRODUCTION_URL_PARAMS.setupQ);
    else next.set(PRODUCTION_URL_PARAMS.setupQ, trimmed);
  }

  if (patch.showCompletedBatches !== undefined) {
    if (patch.showCompletedBatches) next.set(PRODUCTION_URL_PARAMS.showCompleted, '1');
    else next.delete(PRODUCTION_URL_PARAMS.showCompleted);
  }

  if (patch.batchDateFrom !== undefined) {
    const trimmed = patch.batchDateFrom?.trim() ?? '';
    if (!trimmed || !ISO_DATE_RE.test(trimmed)) next.delete(PRODUCTION_URL_PARAMS.batchFrom);
    else next.set(PRODUCTION_URL_PARAMS.batchFrom, trimmed);
  }

  if (patch.batchDateTo !== undefined) {
    const trimmed = patch.batchDateTo?.trim() ?? '';
    if (!trimmed || !ISO_DATE_RE.test(trimmed)) next.delete(PRODUCTION_URL_PARAMS.batchTo);
    else next.set(PRODUCTION_URL_PARAMS.batchTo, trimmed);
  }

  if (patch.batchDate !== undefined) {
    const trimmed = patch.batchDate?.trim() ?? '';
    if (!trimmed || !ISO_DATE_RE.test(trimmed)) next.delete(PRODUCTION_URL_PARAMS.batchDate);
    else next.set(PRODUCTION_URL_PARAMS.batchDate, trimmed);
  }

  if (patch.batchDateScope !== undefined) {
    if (patch.batchDateScope == null) {
      next.delete(PRODUCTION_URL_PARAMS.batchDateScope);
    } else if (patch.batchDateScope === 'all') {
      next.delete(PRODUCTION_URL_PARAMS.batchDate);
      next.set(PRODUCTION_URL_PARAMS.batchDateScope, 'all');
    } else {
      next.set(PRODUCTION_URL_PARAMS.batchDateScope, patch.batchDateScope);
    }
  }

  if (patch.batchLineIds !== undefined) {
    if (patch.batchLineIds == null) {
      next.delete(PRODUCTION_URL_PARAMS.batchLines);
    } else if (patch.batchLineIds.length === 0) {
      next.set(PRODUCTION_URL_PARAMS.batchLines, PRODUCTION_RUNS_LINES_NONE);
    } else if (
      patch.batchLinesAllLineIds != null &&
      patch.batchLinesAllLineIds.length > 0 &&
      patch.batchLineIds.length === patch.batchLinesAllLineIds.length &&
      patch.batchLinesAllLineIds.every((id) => patch.batchLineIds!.includes(id))
    ) {
      next.delete(PRODUCTION_URL_PARAMS.batchLines);
    } else {
      const sorted = [...patch.batchLineIds].sort((a, b) => a - b);
      next.set(PRODUCTION_URL_PARAMS.batchLines, sorted.join(','));
    }
  }

  if (patch.batchMachine !== undefined) {
    if (patch.batchMachine === 'all') next.delete(PRODUCTION_URL_PARAMS.batchMachine);
    else next.set(PRODUCTION_URL_PARAMS.batchMachine, patch.batchMachine);
  }

  if (patch.batchGrid !== undefined) {
    if (patch.batchGrid == null || patch.batchGrid === 'lines') {
      next.delete(PRODUCTION_URL_PARAMS.batchGrid);
    } else {
      next.set(PRODUCTION_URL_PARAMS.batchGrid, 'hours');
    }
  }

  return retainProductionTabParams(next, patch.batchWeekAnchor, patch.tab);
}

function resolvedProductionTab(
  params: URLSearchParams,
  explicitTab?: ProductionPageTab,
): ProductionPageTab {
  if (explicitTab) return explicitTab;
  const parsed = parseProductionPageTab(params.get(PRODUCTION_URL_PARAMS.tab));
  if (parsed) return parsed;
  if (parsePositiveInt(params.get(PRODUCTION_URL_PARAMS.batchId)) != null) return 'batches';
  return 'overview';
}

/** Drop keys the open tab does not own, optionally seed the Batches week, then sort. */
export function retainProductionTabParams(
  params: URLSearchParams,
  batchWeekAnchor?: string,
  explicitTab?: ProductionPageTab,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const tab = resolvedProductionTab(next, explicitTab);
  if (tab === 'batches') next.set(PRODUCTION_URL_PARAMS.tab, 'batches');
  else if (tab === 'overview') next.delete(PRODUCTION_URL_PARAMS.tab);

  if (next.get(PRODUCTION_URL_PARAMS.batchDateScope) === 'day' && !next.get(PRODUCTION_URL_PARAMS.batchDate)) {
    next.delete(PRODUCTION_URL_PARAMS.batchDateScope);
  }

  const allowed = new Set<string>(PRODUCTION_TAB_PARAM_ORDER[tab]);
  for (const key of [...next.keys()]) {
    if (!allowed.has(key)) next.delete(key);
  }

  const anchor = batchWeekAnchor?.trim() ?? '';
  if (
    tab === 'batches' &&
    !next.get(PRODUCTION_URL_PARAMS.batchDate) &&
    !next.get(PRODUCTION_URL_PARAMS.batchDateScope) &&
    ISO_DATE_RE.test(anchor)
  ) {
    next.set(PRODUCTION_URL_PARAMS.batchDate, anchor);
  }

  const ordered = new URLSearchParams();
  for (const key of PRODUCTION_TAB_PARAM_ORDER[tab]) {
    const value = next.get(key);
    if (value != null) ordered.set(key, value);
  }
  return ordered;
}

export function stripInvalidProductionUrlParams(prev: URLSearchParams): URLSearchParams | null {
  const next = new URLSearchParams(prev);
  const factoryRaw = next.get(PRODUCTION_URL_PARAMS.factoryId);
  if (factoryRaw != null && parsePositiveInt(factoryRaw) == null) {
    next.delete(PRODUCTION_URL_PARAMS.factoryId);
  }
  const parsed = parseProductionPageParams(next);
  if (parsed.invalidTab) next.delete(PRODUCTION_URL_PARAMS.tab);
  if (parsed.invalidBatchId) next.delete(PRODUCTION_URL_PARAMS.batchId);
  if (parsed.invalidLineId) next.delete(PRODUCTION_URL_PARAMS.lineId);
  if (parsed.invalidFormulaId) next.delete(PRODUCTION_URL_PARAMS.formulaId);
  if (parsed.invalidBatchDate) next.delete(PRODUCTION_URL_PARAMS.batchDate);
  if (parsed.invalidBatchDateScope) next.delete(PRODUCTION_URL_PARAMS.batchDateScope);
  if (parsed.invalidBatchLines) next.delete(PRODUCTION_URL_PARAMS.batchLines);
  if (parsed.invalidBatchMachine) next.delete(PRODUCTION_URL_PARAMS.batchMachine);
  if (parsed.invalidBatchGrid) next.delete(PRODUCTION_URL_PARAMS.batchGrid);
  if (next.has('batchHourRows')) next.delete('batchHourRows');
  const statusRaw = next.get(PRODUCTION_URL_PARAMS.statuses);
  if (statusRaw != null) {
    const cleaned = (parsed.statuses ?? []).join(',');
    if (!cleaned) next.delete(PRODUCTION_URL_PARAMS.statuses);
    else if (cleaned !== statusRaw) next.set(PRODUCTION_URL_PARAMS.statuses, cleaned);
  }

  const retained = retainProductionTabParams(next);
  if (retained.toString() === prev.toString()) return null;
  return retained;
}

/** After lines or machines have loaded, drop ids that are not in those lists. `null` means not loaded yet. */
export function pruneProductionCatalogParams(
  prev: URLSearchParams,
  catalog: { lineIds: number[] | null; machineIds: number[] | null },
): URLSearchParams | null {
  if (resolvedProductionTab(prev) !== 'batches') return null;
  const next = new URLSearchParams(prev);
  let changed = false;

  if (catalog.lineIds != null && next.has(PRODUCTION_URL_PARAMS.batchLines)) {
    const raw = next.get(PRODUCTION_URL_PARAMS.batchLines);
    if (raw != null && raw !== PRODUCTION_RUNS_LINES_NONE) {
      const known = new Set(catalog.lineIds);
      const kept = raw
        .split(',')
        .map((part) => parseInt(part.trim(), 10))
        .filter((id) => known.has(id))
        .sort((a, b) => a - b);
      const serialized = kept.length === 0 ? null : kept.join(',');
      if (serialized == null) {
        next.delete(PRODUCTION_URL_PARAMS.batchLines);
        changed = true;
      } else if (serialized !== raw) {
        next.set(PRODUCTION_URL_PARAMS.batchLines, serialized);
        changed = true;
      }
    }
  }

  if (catalog.machineIds != null && next.has(PRODUCTION_URL_PARAMS.batchMachine)) {
    const id = parsePositiveInt(next.get(PRODUCTION_URL_PARAMS.batchMachine));
    if (id == null || !catalog.machineIds.includes(id)) {
      next.delete(PRODUCTION_URL_PARAMS.batchMachine);
      changed = true;
    }
  }

  if (!changed) return null;
  return retainProductionTabParams(next);
}
