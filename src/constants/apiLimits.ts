/**
 * API pagination limits - must match backend Query(..., le=X) constraints.
 * Using values > backend limit causes 422 validation errors and empty data.
 *
 * Backend reference: backend/app/api/v1/endpoints/*.py
 *
 * STRICT_100 (le=100): accounts, items, sales_orders, sales_deliveries,
 *   storage_items, project_components, project_component_items, project_component_tasks,
 *   production_lines, production_formulas, production_batches, ledgers, statuses, etc.
 *
 * FLEXIBLE_1000 (le=1000): purchase_orders, transfer_orders, expense_orders, work_orders,
 *   machines, factories, factory_sections, departments, projects, inventory, products,
 *   account_invoices, machine_items, machine_maintenance_logs, etc.
 */
export const API_LIMITS = {
  /** Use for: accounts, items, sales_orders, storage_items, ledgers, etc. */
  STRICT_100: 100,

  /** Use for: purchase_orders, machines, factories, inventory, products, etc. */
  FLEXIBLE_1000: 1000,
} as const;
