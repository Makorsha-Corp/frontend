import { useMemo } from 'react';
import { useGetProductionScheduleQuery } from '@/features/production/productionApi';
import { productionScheduleQueryRange } from '@/lib/productionScheduleQueryRange';
import type { ProductionLine, ProductionScheduleBatch } from '@/types/production';

export function resolveScheduleFactoryId(args: {
  batchProductionLineId?: number | null;
  stageProductionLineIds?: number[];
  lines: ProductionLine[];
  pageFactoryId?: number | null;
}): number | null {
  if (args.batchProductionLineId != null) {
    const fromBatchLine = args.lines.find((row) => row.id === args.batchProductionLineId)?.factory_id;
    if (fromBatchLine != null) return fromBatchLine;
  }
  for (const lineId of args.stageProductionLineIds ?? []) {
    const factoryId = args.lines.find((row) => row.id === lineId)?.factory_id;
    if (factoryId != null) return factoryId;
  }
  return args.pageFactoryId ?? null;
}

/** One RTK schedule subscription per factory + planned-start window (batches tab). */
export function useFactoryProductionSchedule(args: {
  factoryId: number | null;
  plannedStartLocal: string;
}): ProductionScheduleBatch[] {
  const scheduleQueryRange = useMemo(() => {
    if (!args.plannedStartLocal.trim()) return null;
    const planned = new Date(args.plannedStartLocal);
    if (Number.isNaN(planned.getTime())) return null;
    return productionScheduleQueryRange(planned);
  }, [args.plannedStartLocal]);

  const scheduleQueryArgs = useMemo(() => {
    if (!scheduleQueryRange) return null;
    return {
      factory_id: args.factoryId ?? undefined,
      start: scheduleQueryRange.start,
      end: scheduleQueryRange.end,
    };
  }, [args.factoryId, scheduleQueryRange?.start, scheduleQueryRange?.end]);

  const { data = [] } = useGetProductionScheduleQuery(
    scheduleQueryArgs ?? { start: '', end: '' },
    { skip: !scheduleQueryArgs, refetchOnMountOrArgChange: true },
  );

  return data;
}
