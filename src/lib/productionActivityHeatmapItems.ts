import { toLocalDateKey } from '@/lib/heatmapDateKey';
import type { ProductionBatch } from '@/types/production';

export function buildActivityHeatmapItemsFromBatches(
  batches: ProductionBatch[],
  opts: {
    lineIds?: number[];
    formulaIds?: number[];
    statuses?: string[];
  },
): Array<{ date: string; count: number }> {
  const lineSet = opts.lineIds?.length ? new Set(opts.lineIds) : null;
  const formulaSet = opts.formulaIds?.length ? new Set(opts.formulaIds) : null;
  const statusSet = opts.statuses?.length ? new Set(opts.statuses) : null;
  const counts: Record<string, number> = {};

  for (const batch of batches) {
    if (statusSet && !statusSet.has(batch.status)) continue;
    if (lineSet && !lineSet.has(batch.production_line_id)) continue;
    if (formulaSet) {
      if (batch.formula_id == null || !formulaSet.has(batch.formula_id)) continue;
    }
    if (!batch.batch_date) continue;
    const key = toLocalDateKey(batch.batch_date);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
