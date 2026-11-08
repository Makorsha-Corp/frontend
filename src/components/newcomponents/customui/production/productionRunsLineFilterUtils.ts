import type { ProductionLine } from '@/types/production';

export function allProductionLineIds(lines: ProductionLine[]): number[] {
  return lines.map((l) => l.id);
}

export function isAllProductionLinesSelected(
  selectedLineIds: number[],
  lines: ProductionLine[],
): boolean {
  if (lines.length === 0) return true;
  const set = new Set(selectedLineIds);
  return lines.every((l) => set.has(l.id));
}

export function isProductionRunsLineFilterDefault(
  selectedLineIds: number[],
  lines: ProductionLine[],
): boolean {
  return isAllProductionLinesSelected(selectedLineIds, lines);
}

export type ProductionRunsLineFilterCopy = {
  allLines?: string;
  noLines?: string;
  oneLine?: string;
  lineCount?: (count: number) => string;
};

export function productionRunsLineFilterLabel(
  lines: ProductionLine[],
  selectedLineIds: number[],
  copy?: ProductionRunsLineFilterCopy,
): string {
  if (lines.length === 0) return copy?.allLines ?? 'All lines';
  if (isAllProductionLinesSelected(selectedLineIds, lines)) return copy?.allLines ?? 'All lines';
  if (selectedLineIds.length === 0) return copy?.noLines ?? 'No lines';
  if (selectedLineIds.length === 1) {
    return lines.find((l) => l.id === selectedLineIds[0])?.name ?? copy?.oneLine ?? '1 line';
  }
  return copy?.lineCount?.(selectedLineIds.length) ?? `${selectedLineIds.length} lines`;
}
