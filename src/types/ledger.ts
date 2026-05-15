/**
 * Ledger types for the unified ledger API.
 *
 * The inventory ledger types live in `./inventory` (single source of truth)
 * and are re-exported here so all ledger consumers have one import location.
 */

import type { InventoryLedgerEntry, InventoryType } from './inventory';

export type { InventoryLedgerEntry, InventoryType };

// ─── Shared shapes ──────────────────────────────────────────────────────────

export interface LedgerEntryBase {
  id: number;
  workspace_id: number;
  item_id: number;
  transaction_type: string;
  quantity: number;
  unit_cost: string | number | null;
  total_cost: string | number | null;
  qty_before: number;
  qty_after: number;
  value_before?: string | number | null;
  value_after?: string | number | null;
  avg_price_before?: string | number | null;
  avg_price_after?: string | number | null;
  source_type: string | null;
  source_id: number | null;
  order_id?: number | null;
  invoice_id?: number | null;
  transfer_source_type: string | null;
  transfer_source_id: number | null;
  transfer_destination_type: string | null;
  transfer_destination_id: number | null;
  notes: string | null;
  performed_by: number | null;
  performed_at: string;
}

export interface MachineLedgerEntry extends LedgerEntryBase {
  machine_id: number;
}

export interface ProjectComponentLedgerEntry extends LedgerEntryBase {
  project_component_id: number;
}

export interface LedgerBalanceResponse {
  quantity: number;
  total_value?: string | number | null;
  average_price?: string | number | null;
  factory_id?: number;
  item_id?: number;
  inventory_type?: string;
  machine_id?: number;
  [key: string]: unknown;
}

export interface LedgerReconcileResponse {
  message?: string;
  adjustment_made?: boolean;
  status?: 'balanced' | 'adjusted' | 'error';
  ledger_qty?: number;
  snapshot_qty?: number;
  discrepancy?: number;
  adjustment_created?: boolean;
  [key: string]: unknown;
}

export interface ProjectComponentTotalCostResponse {
  project_component_id: number;
  total_cost: number | string;
  total_quantity?: number;
  entry_count?: number;
}

export interface ItemMovementReportEntry {
  [key: string]: unknown;
}

export interface UserTransactionReportEntry {
  [key: string]: unknown;
}

export interface OrderTransactionReportEntry {
  [key: string]: unknown;
}

// ─── Query parameter shapes ─────────────────────────────────────────────────

export interface InventoryLedgerQueryParams {
  inventory_type?: InventoryType;
  factory_id?: number;
  item_id?: number;
  start_date?: string;
  end_date?: string;
  transaction_type?: string;
  skip?: number;
  limit?: number;
}

export interface InventoryBalanceParams {
  factory_id: number;
  item_id: number;
  inventory_type: InventoryType;
}

export interface InventoryReconcileParams {
  factory_id: number;
  item_id: number;
  inventory_type: InventoryType;
}

export interface MachineQueryParams {
  machine_id: number;
  item_id: number;
  start_date?: string;
  end_date?: string;
  transaction_type?: string;
  skip?: number;
  limit?: number;
}

export interface MachineBalanceParams {
  machine_id: number;
  item_id: number;
}

export interface ProjectComponentQueryParams {
  project_component_id: number;
  item_id?: number;
  skip?: number;
  limit?: number;
}

export interface ItemMovementReportParams {
  item_id: number;
  start_date?: string;
  end_date?: string;
}

export interface UserTransactionsReportParams {
  user_id: number;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}
