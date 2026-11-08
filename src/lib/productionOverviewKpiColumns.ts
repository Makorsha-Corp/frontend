export type ProductionOverviewKpiColumnId =
  | 'batch_count'
  | 'output_quantity'
  | 'waste_quantity'
  | 'yield_pct'
  | 'time_vs_plan_pct'
  | 'avg_start_lag_minutes'
  | 'avg_step_gap_minutes';

export const PRODUCTION_OVERVIEW_KPI_COLUMNS: {
  id: ProductionOverviewKpiColumnId;
  label: string;
  defaultOn: boolean;
}[] = [
  { id: 'batch_count', label: 'Batches', defaultOn: true },
  { id: 'output_quantity', label: 'Output', defaultOn: true },
  { id: 'waste_quantity', label: 'Waste', defaultOn: false },
  { id: 'yield_pct', label: 'Yield', defaultOn: true },
  { id: 'time_vs_plan_pct', label: 'Time vs plan', defaultOn: true },
  { id: 'avg_start_lag_minutes', label: 'Start lag', defaultOn: true },
  { id: 'avg_step_gap_minutes', label: 'Step gap', defaultOn: true },
];

export const PRODUCTION_OVERVIEW_KPI_STORAGE_KEY = 'production.overview.kpiColumns';

const VALID_IDS = new Set(PRODUCTION_OVERVIEW_KPI_COLUMNS.map((c) => c.id));

export function defaultOverviewKpiColumnIds(): ProductionOverviewKpiColumnId[] {
  return PRODUCTION_OVERVIEW_KPI_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
}

export function readOverviewKpiColumnIds(): ProductionOverviewKpiColumnId[] {
  if (typeof window === 'undefined') return defaultOverviewKpiColumnIds();
  try {
    const raw = window.localStorage.getItem(PRODUCTION_OVERVIEW_KPI_STORAGE_KEY);
    if (!raw) return defaultOverviewKpiColumnIds();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultOverviewKpiColumnIds();
    return sanitizeOverviewKpiColumnIds(parsed);
  } catch {
    return defaultOverviewKpiColumnIds();
  }
}

export function writeOverviewKpiColumnIds(ids: ProductionOverviewKpiColumnId[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    PRODUCTION_OVERVIEW_KPI_STORAGE_KEY,
    JSON.stringify(sanitizeOverviewKpiColumnIds(ids)),
  );
}

/** Drop unknown ids; never return empty (falls back to defaults). */
export function sanitizeOverviewKpiColumnIds(
  ids: unknown[],
): ProductionOverviewKpiColumnId[] {
  const filtered = ids.filter(
    (id): id is ProductionOverviewKpiColumnId =>
      typeof id === 'string' && VALID_IDS.has(id as ProductionOverviewKpiColumnId),
  );
  const unique = [...new Set(filtered)];
  if (unique.length === 0) return defaultOverviewKpiColumnIds();
  return unique;
}

export function toggleOverviewKpiColumn(
  current: ProductionOverviewKpiColumnId[],
  id: ProductionOverviewKpiColumnId,
): ProductionOverviewKpiColumnId[] {
  if (current.includes(id)) {
    if (current.length === 1) return current;
    return current.filter((c) => c !== id);
  }
  return [...current, id];
}
