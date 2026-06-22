import type { ItemSummary, ItemSummaryOrderStats, ItemSummaryPeriodPricing, ItemSummarySupplierPeriod } from '@/types/itemSummary';
import { num } from './itemDetailsFormatters';

export type PurchasingPeriod = 'days_30' | 'days_90' | 'all_time';

export const PURCHASING_PERIODS: { value: PurchasingPeriod; label: string }[] = [
  { value: 'days_30', label: '1 month' },
  { value: 'days_90', label: '3 months' },
  { value: 'all_time', label: 'All time' },
];

export function purchasingPeriodToDateRange(period: PurchasingPeriod): {
  from_date?: string;
  to_date?: string;
} {
  if (period === 'all_time') return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (period === 'days_30' ? 30 : 90));
  return {
    from_date: from.toISOString().slice(0, 10),
    to_date: to.toISOString().slice(0, 10),
  };
}

export function orderStatsHasActivity(row: ItemSummaryOrderStats): boolean {
  return (
    row.line_count > 0 ||
    num(row.purchase_qty) > 0 ||
    num(row.transfer_qty) > 0 ||
    num(row.sales_qty) > 0
  );
}

function periodPricingHasData(period: ItemSummaryPeriodPricing): boolean {
  return (
    period.avg_unit_price_weighted != null ||
    period.min_unit_price != null ||
    period.max_unit_price != null
  );
}

function hasOrderActivity(summary: ItemSummary): boolean {
  for (const key of ['days_30', 'days_90', 'all_time'] as const) {
    if (orderStatsHasActivity(summary.order_stats[key])) return true;
  }
  return false;
}

export function supplierPeriodHasData(period: ItemSummarySupplierPeriod): boolean {
  return (
    period.highlights.cheapest != null ||
    period.highlights.most_frequent != null ||
    period.suppliers.length > 0
  );
}

function hasSupplierStats(summary: ItemSummary): boolean {
  for (const key of ['days_30', 'days_90', 'all_time'] as const) {
    if (supplierPeriodHasData(summary.supplier_stats.period[key])) return true;
  }
  return false;
}

export function hasPurchasingStatsCard(summary: ItemSummary): boolean {
  const { pricing } = summary;
  return (
    pricing.last_unit_price != null ||
    pricing.open_po_line_count > 0 ||
    periodPricingHasData(pricing.period.days_30) ||
    periodPricingHasData(pricing.period.days_90) ||
    periodPricingHasData(pricing.period.all_time) ||
    hasOrderActivity(summary) ||
    hasSupplierStats(summary)
  );
}
