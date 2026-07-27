import type { WorkOrderItemSourceType } from '@/types/workOrder';

export interface WorkOrderStockShortfallLineInput {
  itemId: string;
  quantity: string;
  sourceType: WorkOrderItemSourceType;
  sourceMachineId?: number;
}

export interface WorkOrderStockShortfall {
  itemId: number;
  itemName: string;
  sourceLabel: string;
  requiredQty: number;
  onHandQty: number;
  shortBy: number;
}

export interface WorkOrderStockSnapshot {
  storageByItemId: ReadonlyMap<number, number>;
  machineByKey: ReadonlyMap<string, number>;
  storageSourceLabel: string;
  machineLabelById: ReadonlyMap<number, string>;
  itemNameById: ReadonlyMap<number, string>;
}

function machineStockKey(machineId: number, itemId: number): string {
  return `${machineId}:${itemId}`;
}

function resolveSourceLocationId(
  line: WorkOrderStockShortfallLineInput,
  workOrderMachineId: number,
  factoryId: number | null,
): { sourceType: WorkOrderItemSourceType; sourceLocationId: number | null } {
  if (line.sourceType === 'machine') {
    return {
      sourceType: 'machine',
      sourceLocationId: line.sourceMachineId ?? workOrderMachineId,
    };
  }
  return {
    sourceType: 'storage',
    sourceLocationId: factoryId,
  };
}

export interface ComputeWorkOrderStockShortfallsArgs {
  lines: WorkOrderStockShortfallLineInput[];
  occurrenceCount: number;
  workOrderMachineId: number;
  factoryId: number | null;
  snapshot: WorkOrderStockSnapshot;
}

export function computeWorkOrderStockShortfalls(
  args: ComputeWorkOrderStockShortfallsArgs,
): WorkOrderStockShortfall[] {
  const { lines, occurrenceCount, workOrderMachineId, factoryId, snapshot } = args;
  if (lines.length === 0 || occurrenceCount <= 0) return [];

  const aggregated = new Map<
    string,
    {
      itemId: number;
      sourceType: WorkOrderItemSourceType;
      sourceLocationId: number;
      requiredQty: number;
    }
  >();

  for (const line of lines) {
    const qty = Number(line.quantity);
    const itemId = Number(line.itemId);
    if (!itemId || !(qty > 0)) continue;

    const { sourceType, sourceLocationId } = resolveSourceLocationId(
      line,
      workOrderMachineId,
      factoryId,
    );
    if (sourceLocationId == null) continue;

    const key = `${sourceType}:${sourceLocationId}:${itemId}`;
    const existing = aggregated.get(key);
    const addQty = qty * occurrenceCount;
    if (existing) {
      existing.requiredQty += addQty;
    } else {
      aggregated.set(key, {
        itemId,
        sourceType,
        sourceLocationId,
        requiredQty: addQty,
      });
    }
  }

  const shortfalls: WorkOrderStockShortfall[] = [];

  for (const row of aggregated.values()) {
    let onHandQty = 0;
    let sourceLabel = '';

    if (row.sourceType === 'storage') {
      onHandQty = snapshot.storageByItemId.get(row.itemId) ?? 0;
      sourceLabel = snapshot.storageSourceLabel;
    } else {
      onHandQty =
        snapshot.machineByKey.get(machineStockKey(row.sourceLocationId, row.itemId)) ?? 0;
      sourceLabel =
        `Machine · ${snapshot.machineLabelById.get(row.sourceLocationId) ?? `#${row.sourceLocationId}`}`;
    }

    const shortBy = row.requiredQty - onHandQty;
    if (shortBy <= 0) continue;

    shortfalls.push({
      itemId: row.itemId,
      itemName: snapshot.itemNameById.get(row.itemId) ?? `Item #${row.itemId}`,
      sourceLabel,
      requiredQty: row.requiredQty,
      onHandQty,
      shortBy,
    });
  }

  return shortfalls.sort((a, b) => a.itemName.localeCompare(b.itemName));
}

export function buildStorageQtyMap(
  rows: ReadonlyArray<{ item_id: number; qty: number }>,
): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.item_id, Number(row.qty));
  }
  return map;
}

export function buildMachineQtyMap(
  rows: ReadonlyArray<{ machine_id: number; item_id: number; qty: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(machineStockKey(row.machine_id, row.item_id), Number(row.qty));
  }
  return map;
}
