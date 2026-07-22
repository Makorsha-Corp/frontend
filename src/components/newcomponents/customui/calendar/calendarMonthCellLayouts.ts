export type MonthCellLayoutPreset = 'compact' | 'comfortable' | 'spacious';

export interface MonthCellLayoutConfig {
  maxVisibleEvents: number;
  cellMinHeight: string;
  stackGap: string;
  chipGapX: string;
  chipGapY: string;
  categoryGap: string;
  chipText: string;
  chipPadding: string;
  overflowText: string;
}

export const MONTH_CELL_LAYOUT_PRESETS: Record<MonthCellLayoutPreset, MonthCellLayoutConfig> = {
  compact: {
    maxVisibleEvents: 6,
    cellMinHeight: 'min-h-[7rem]',
    stackGap: 'gap-1',
    chipGapX: 'gap-x-1',
    chipGapY: 'gap-y-1',
    categoryGap: 'mt-1.5',
    chipText: 'text-[10px]',
    chipPadding: 'px-1 py-0.5',
    overflowText: 'text-[10px]',
  },
  comfortable: {
    maxVisibleEvents: 6,
    cellMinHeight: 'min-h-[7.5rem]',
    stackGap: 'gap-1',
    chipGapX: 'gap-x-1',
    chipGapY: 'gap-y-1',
    categoryGap: 'mt-1.5',
    chipText: 'text-[11px]',
    chipPadding: 'px-1.5 py-1',
    overflowText: 'text-[11px]',
  },
  spacious: {
    maxVisibleEvents: 5,
    cellMinHeight: 'min-h-[8rem]',
    stackGap: 'gap-1.5',
    chipGapX: 'gap-x-1.5',
    chipGapY: 'gap-y-1.5',
    categoryGap: 'mt-1.5',
    chipText: 'text-xs',
    chipPadding: 'px-1.5 py-1',
    overflowText: 'text-xs',
  },
};

export const DEFAULT_MONTH_CELL_LAYOUT: MonthCellLayoutPreset = 'comfortable';

export function getMonthCellLayoutConfig(
  preset: MonthCellLayoutPreset = DEFAULT_MONTH_CELL_LAYOUT,
): MonthCellLayoutConfig {
  return MONTH_CELL_LAYOUT_PRESETS[preset];
}
