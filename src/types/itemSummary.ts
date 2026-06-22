/** Item summary hub — GET /items/{id}/summary/ */

export interface ItemSummaryTag {
  id: number;
  name: string;
  tag_code: string;
  color: string | null;
  icon: string | null;
  is_system_tag: boolean;
}

export interface ItemSummaryItem {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  unit: string;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  tags: ItemSummaryTag[];
}

export interface ItemSummaryKpis {
  storage_qty_total: number;
  machine_placement_count: number;
  product_qty_total: number;
  factory_count_with_stock: number;
}

export interface ItemSummaryInventoryRow {
  factory_id: number;
  factory_name: string;
  inventory_type: string;
  qty: number;
  avg_price: number | string | null;
  est_value: number | string | null;
}

export interface ItemSummaryProductRow {
  factory_id: number;
  factory_name: string;
  qty: number;
  avg_cost: number | string | null;
  selling_price: number | string | null;
  is_available_for_sale: boolean;
  margin_hint: number | string | null;
}

export interface ItemSummaryMachinePlacement {
  machine_id: number;
  machine_name: string;
  factory_id: number;
  factory_name: string;
  factory_section_id: number;
  factory_section_name: string;
  qty: number;
  req_qty: number | null;
  defective_qty: number | null;
  is_low_stock: boolean;
}

export interface ItemSummaryOrderStats {
  purchase_qty: number | string;
  transfer_qty: number | string;
  sales_qty: number | string;
  total_quantity: number | string;
  total_spend: number | string;
  line_count: number;
}

export interface ItemSummaryOrderStatsPeriod {
  days_30: ItemSummaryOrderStats;
  days_90: ItemSummaryOrderStats;
  all_time: ItemSummaryOrderStats;
}

export interface ItemSummaryPeriodPricing {
  avg_unit_price_weighted: number | string | null;
  min_unit_price: number | string | null;
  max_unit_price: number | string | null;
}

export interface ItemSummaryPricingPeriod {
  days_30: ItemSummaryPeriodPricing;
  days_90: ItemSummaryPeriodPricing;
  all_time: ItemSummaryPeriodPricing;
}

export interface ItemSummaryPricing {
  last_unit_price: number | string | null;
  open_po_line_count: number;
  open_qty_outstanding: number | string;
  period: ItemSummaryPricingPeriod;
}

export interface ItemSummarySupplierRow {
  account_id: number;
  account_name: string;
  order_count: number;
  total_qty: number | string;
  total_spend: number | string;
  avg_unit_price_weighted: number | string | null;
  last_unit_price: number | string | null;
  last_order_date: string | null;
}

export interface ItemSummarySupplierHighlights {
  cheapest: ItemSummarySupplierRow | null;
  most_frequent: ItemSummarySupplierRow | null;
}

export interface ItemSummarySupplierPeriod {
  highlights: ItemSummarySupplierHighlights;
  suppliers: ItemSummarySupplierRow[];
}

export interface ItemSummarySupplierStatsPeriod {
  days_30: ItemSummarySupplierPeriod;
  days_90: ItemSummarySupplierPeriod;
  all_time: ItemSummarySupplierPeriod;
}

export interface ItemSummarySupplierStats {
  period: ItemSummarySupplierStatsPeriod;
}

export interface ItemSummaryUsageCounts {
  formula_count: number;
  batch_line_count: number;
  project_component_count: number;
  work_order_line_count: number;
}

export interface ItemSummaryFormulaUsage {
  formula_id: number;
  formula_code: string;
  name: string;
  item_role: string;
}

export interface ItemSummaryBatchUsage {
  batch_id: number;
  batch_number: string;
  item_role: string;
  status: string | null;
}

export interface ItemSummaryProjectUsage {
  project_id: number;
  project_name: string;
  component_id: number;
  component_name: string;
}

export interface ItemSummaryWorkOrderUsage {
  work_order_id: number;
  work_order_number: string;
  title: string;
}

export interface ItemSummaryUsageDetails {
  formulas: ItemSummaryFormulaUsage[];
  batches: ItemSummaryBatchUsage[];
  projects: ItemSummaryProjectUsage[];
  work_orders: ItemSummaryWorkOrderUsage[];
}

export interface ItemSummaryRecentActivity {
  source: 'inventory' | 'product' | 'machine';
  performed_at: string;
  transaction_type: string;
  quantity: number;
  factory_id: number | null;
  factory_name: string | null;
  machine_id: number | null;
  machine_name: string | null;
  inventory_type: string | null;
  order_type: string | null;
  order_id: number | null;
  order_number: string | null;
}

export interface ItemSummary {
  item: ItemSummaryItem;
  kpis: ItemSummaryKpis;
  inventory_rows: ItemSummaryInventoryRow[];
  product_rows: ItemSummaryProductRow[];
  machine_placements: ItemSummaryMachinePlacement[];
  order_stats: ItemSummaryOrderStatsPeriod;
  pricing: ItemSummaryPricing;
  supplier_stats: ItemSummarySupplierStats;
  usage_counts: ItemSummaryUsageCounts;
  usage_details: ItemSummaryUsageDetails;
  recent_activity: ItemSummaryRecentActivity[];
}
