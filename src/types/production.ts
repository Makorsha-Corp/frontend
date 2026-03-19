// ─── Production Line ────────────────────────────────────────────────

export interface ProductionLine {
  id: number;
  workspace_id: number;
  factory_id: number;
  machine_id: number | null;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
}

export interface CreateProductionLineDTO {
  factory_id: number;
  machine_id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateProductionLineDTO {
  machine_id?: number;
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ─── Production Formula ─────────────────────────────────────────────

export interface ProductionFormula {
  id: number;
  workspace_id: number;
  formula_code: string;
  name: string;
  description: string | null;
  version: number;
  estimated_duration_minutes: number | null;
  is_active: boolean;
  is_default: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductionFormulaDTO {
  formula_code: string;
  name: string;
  description?: string;
  version?: number;
  estimated_duration_minutes?: number;
  is_active?: boolean;
  is_default?: boolean;
}

export interface UpdateProductionFormulaDTO {
  name?: string;
  description?: string;
  estimated_duration_minutes?: number;
  is_active?: boolean;
  is_default?: boolean;
}

// ─── Item Role Type ─────────────────────────────────────────────────
// - input: Raw materials consumed
// - output: Finished goods produced
// - waste: Waste/scrap generated during production
// - byproduct: Secondary products that can be sold/reused

export type ItemRole = 'input' | 'output' | 'waste' | 'byproduct';

// ─── Production Formula Item ────────────────────────────────────────

export interface ProductionFormulaItem {
  id: number;
  workspace_id: number;
  formula_id: number;
  item_id: number;
  item_role: ItemRole;
  quantity: number;
  unit: string | null;
  is_optional: boolean;
  tolerance_percentage: number | null;
}

export interface CreateProductionFormulaItemDTO {
  formula_id: number;
  item_id: number;
  item_role: ItemRole;
  quantity: number;
  unit?: string;
  is_optional?: boolean;
  tolerance_percentage?: number;
}

export interface UpdateProductionFormulaItemDTO {
  item_role?: ItemRole;
  quantity?: number;
  unit?: string;
  is_optional?: boolean;
  tolerance_percentage?: number;
}

// ─── Production Batch ───────────────────────────────────────────────

export interface ProductionBatch {
  id: number;
  workspace_id: number;
  batch_number: string;
  production_line_id: number;
  formula_id: number | null;
  batch_date: string;
  shift: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  expected_output_quantity: number | null;
  expected_duration_minutes: number | null;
  actual_output_quantity: number | null;
  actual_duration_minutes: number | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  output_variance_quantity: number | null;
  output_variance_percentage: number | null;
  efficiency_percentage: number | null;
  notes: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  started_by: number | null;
  started_at: string | null;
  completed_by: number | null;
  completed_at: string | null;
}

export interface CreateProductionBatchDTO {
  production_line_id: number;
  formula_id?: number;
  batch_date: string;
  shift?: string;
  expected_output_quantity?: number;
  expected_duration_minutes?: number;
  notes?: string;
}

export interface UpdateProductionBatchDTO {
  formula_id?: number;
  batch_date?: string;
  shift?: string;
  expected_output_quantity?: number;
  expected_duration_minutes?: number;
  actual_output_quantity?: number;
  actual_duration_minutes?: number;
  notes?: string;
}

export interface StartBatchDTO {
  target_output_quantity?: number;
}

export interface CompleteBatchDTO {
  actual_output_quantity?: number;
  actual_duration_minutes?: number;
  notes?: string;
}

export interface CancelBatchDTO {
  notes?: string;
}

// ─── Production Batch Item ──────────────────────────────────────────

export interface ProductionBatchItem {
  id: number;
  workspace_id: number;
  batch_id: number;
  item_id: number;
  item_role: ItemRole;
  expected_quantity: number | null;
  actual_quantity: number | null;
  source_location_type: string | null;
  source_location_id: number | null;
  destination_location_type: string | null;
  destination_location_id: number | null;
  variance_quantity: number | null;
  variance_percentage: number | null;
  notes: string | null;
}

export interface CreateProductionBatchItemDTO {
  batch_id: number;
  item_id: number;
  item_role: ItemRole;
  expected_quantity?: number;
  actual_quantity?: number;
  source_location_type?: string;
  source_location_id?: number;
  destination_location_type?: string;
  destination_location_id?: number;
  notes?: string;
}

export interface UpdateProductionBatchItemDTO {
  item_role?: ItemRole;
  expected_quantity?: number;
  actual_quantity?: number;
  source_location_type?: string;
  source_location_id?: number;
  destination_location_type?: string;
  destination_location_id?: number;
  notes?: string;
}
