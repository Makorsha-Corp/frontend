import type { ProductionLine } from '@/types/production';

export const PRODUCTION_LINE_NO_MACHINES_TOOLTIP =
  'No machines assigned. Add machines before using this line on a recipe or batch.';

export function productionLineHasMachines(line: ProductionLine): boolean {
  if (line.machines && line.machines.length > 0) return true;
  if (line.machine_ids && line.machine_ids.length > 0) return true;
  return line.machine_id != null;
}

export function countLinesWithoutMachines(lines: ProductionLine[]): number {
  return lines.filter((line) => !productionLineHasMachines(line)).length;
}
