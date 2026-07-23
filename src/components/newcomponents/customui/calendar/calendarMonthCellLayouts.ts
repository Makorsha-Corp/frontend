export interface MonthCellLayoutConfig {
  cellMinHeight: string;
  stackGap: string;
  chipGapX: string;
  chipGapY: string;
  categoryGap: string;
  chipText: string;
  chipPadding: string;
  overflowText: string;
}

/** Fixed comfortable scale for calendar month cells. */
export const MONTH_CELL_LAYOUT: MonthCellLayoutConfig = {
  cellMinHeight: 'min-h-[7.5rem]',
  stackGap: 'gap-1',
  chipGapX: 'gap-x-1',
  chipGapY: 'gap-y-1',
  categoryGap: 'mt-1.5',
  chipText: 'text-[11px]',
  chipPadding: 'px-1.5 py-1',
  overflowText: 'text-[11px]',
};
