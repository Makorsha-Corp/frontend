export interface TopItemRow {
  item_id: number;
  item_name: string;
  item_unit: string | null;
  total_quantity: number;
  total_spend: number;
  line_count: number;
  purchase_qty: number;
  transfer_qty: number;
  sales_qty: number;
}

export interface TopAccountRow {
  account_id: number;
  account_name: string;
  total_spend: number;
  order_count: number;
}

export interface TopExpenseCategoryRow {
  category: string;
  total_spend: number;
  order_count: number;
}

export interface TopFactoryRow {
  factory_id: number;
  factory_name: string;
  order_count: number;
  total_value: number;
  purchase_count: number;
  transfer_count: number;
  sales_count: number;
  work_count: number;
}

export interface OrdersOverviewStats {
  top_items: TopItemRow[];
  top_vendors: TopAccountRow[];
  top_customers: TopAccountRow[];
  top_expense_categories: TopExpenseCategoryRow[];
  top_factories: TopFactoryRow[];
}

export interface OrdersOverviewStatsParams {
  from_date: string;
  to_date: string;
  factory_id?: number;
  limit?: number;
}
