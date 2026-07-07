export interface ItemPriceInsightRef {
  purchase_order_id: number;
  po_number: string;
  account_id: number | null;
  account_name: string | null;
  unit_price: number | string | null;
  order_date: string | null;
}

export interface ItemPriceInsightLowest {
  avg_supplier: ItemPriceInsightRef | null;
  all_time: ItemPriceInsightRef | null;
  days_30: ItemPriceInsightRef | null;
  days_90: ItemPriceInsightRef | null;
}

export interface ItemPriceInsightRow {
  item_id: number;
  last_ordered: ItemPriceInsightRef | null;
  lowest: ItemPriceInsightLowest;
}

export interface PoItemPriceInsightsResponse {
  items: ItemPriceInsightRow[];
}

export type PoItemLowestPriceMode = 'avg_supplier' | 'all_time' | 'days_30' | 'days_90';

export const PO_ITEM_LOWEST_PRICE_MODES: PoItemLowestPriceMode[] = [
  'avg_supplier',
  'all_time',
  'days_30',
  'days_90',
];

export function lowestPriceModeLabel(mode: PoItemLowestPriceMode): string {
  switch (mode) {
    case 'avg_supplier':
      return 'Avg';
    case 'all_time':
      return 'All time';
    case 'days_30':
      return '30d';
    case 'days_90':
      return '90d';
    default:
      return mode;
  }
}

export function nextLowestPriceMode(mode: PoItemLowestPriceMode): PoItemLowestPriceMode {
  const idx = PO_ITEM_LOWEST_PRICE_MODES.indexOf(mode);
  return PO_ITEM_LOWEST_PRICE_MODES[(idx + 1) % PO_ITEM_LOWEST_PRICE_MODES.length];
}
