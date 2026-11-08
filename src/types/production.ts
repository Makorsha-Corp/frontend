// ─── Production Line ────────────────────────────────────────────────

export interface ProductionLineMachineBrief {
  id: number;
  name: string;
  is_running: boolean;
  latest_status_type?: string | null;
}

export interface ProductionLineMachineStatusSummary {
  total: number;
  running: number;
  idle: number;
}

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
  machine_ids?: number[];
  machines?: ProductionLineMachineBrief[];
  machine_status_summary?: ProductionLineMachineStatusSummary;
}

export interface CreateProductionLineDTO {
  factory_id: number;
  machine_id?: number;
  machine_ids?: number[];
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateProductionLineDTO {
  machine_id?: number | null;
  machine_ids?: number[];
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
  is_active: boolean;
  is_default: boolean;
  route_id?: number | null;
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
  is_active?: boolean;
  is_default?: boolean;
  factory_id?: number;
  copy_from_formula_id?: number;
}

export interface CopyProductionFormulaDTO {
  formula_code: string;
  name: string;
  factory_id: number;
  description?: string;
}

export interface UpdateProductionFormulaDTO {
  name?: string;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface ProductionBatchStageSeedDTO {
  formula_stage_id: number;
  include?: boolean;
  production_line_id?: number;
  machine_id?: number;
  expected_duration_minutes?: number;
  expected_output_quantity?: number;
}

export interface ProductionBatchItemSeedDTO {
  item_id: number;
  item_role: 'input' | 'output' | 'waste' | 'byproduct';
  expected_quantity: number;
  formula_stage_id?: number;
}

export interface ProductionBatchStageParameterSeedDTO {
  source_parameter_id: number;
  planned_value: string;
}

export interface ProductionRoute {
  id: number;
  workspace_id: number;
  factory_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductionRouteStep {
  id: number;
  workspace_id: number;
  route_id: number;
  step_order: number;
  production_line_id: number;
  name: string;
  notes: string | null;
}

export interface ProductionScheduleStep {
  stage_log_id: number;
  stage_name: string;
  stage_order: number;
  production_line_id: number | null;
  machine_id: number | null;
  status?: string;
  planned_start_at: string;
  planned_end_at: string;
  rework_of_log_id: number | null;
}

export interface ProductionScheduleBatch {
  batch_id: number;
  batch_number: string;
  status: string;
  machine_id?: number | null;
  planned_start_at: string;
  planned_end_at: string;
  steps: ProductionScheduleStep[];
}

export interface StageLogScheduleMoveResponse {
  batch_id: number;
  planned_start_at: string;
  steps: ProductionScheduleStep[];
}

export interface ProductionBatchProgramOccurrence {
  batch_id: number;
  batch_number: string;
  status: string;
  planned_start_at: string | null;
}

export interface ProductionBatchProgram {
  id: number;
  workspace_id: number;
  factory_id: number;
  formula_id: number;
  first_start_at: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval_days?: number | null;
  end_date: string;
  status: 'active' | 'stopped';
  created_by: number | null;
  created_at: string;
  batch_count: number;
  occurrences?: ProductionBatchProgramOccurrence[];
}

export interface CreateProductionBatchProgramDTO {
  factory_id: number;
  formula_id: number;
  first_start_at: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval_days?: number;
  end_date: string;
}

export interface LinkedProductionOrder {
  order_kind: 'expense' | 'purchase';
  id: number;
  number: string;
  account_id: number | null;
  account_name: string | null;
  order_date: string | null;
  total_amount: number | string;
  voided: boolean;
}

// ─── Item Role Type ─────────────────────────────────────────────────
// - input: Raw materials consumed
// - output: Finished goods produced
// - waste: Waste/scrap generated during production
// - byproduct: Secondary products that can be sold/reused

export type ItemRole = 'input' | 'output' | 'waste' | 'byproduct';

// ─── Production Formula Stage ───────────────────────────────────────

export interface ProductionFormulaStage {
  id: number;
  workspace_id: number;
  formula_id: number;
  stage_order: number;
  name: string;
  production_line_id: number | null;
  machine_id: number | null;
  expected_duration_minutes: number | null;
  expected_output_quantity: number | null;
  expected_output_item_id: number | null;
  notes: string | null;
  route_step_id?: number | null;
  is_used?: boolean;
}

export interface CreateProductionFormulaStageDTO {
  formula_id: number;
  stage_order: number;
  name: string;
  production_line_id?: number;
  machine_id?: number;
  expected_duration_minutes?: number;
  expected_output_quantity?: number;
  expected_output_item_id?: number;
  notes?: string;
}

export interface UpdateProductionFormulaStageDTO {
  name?: string;
  stage_order?: number;
  production_line_id?: number | null;
  machine_id?: number | null;
  expected_duration_minutes?: number | null;
  expected_output_quantity?: number | null;
  expected_output_item_id?: number | null;
  notes?: string | null;
  is_used?: boolean;
}

// ─── Production Formula Stage Item ──────────────────────────────────

export interface ProductionFormulaStageItem {
  id: number;
  workspace_id: number;
  formula_stage_id: number;
  item_id: number;
  item_role: ItemRole;
  quantity: number;
  unit: string | null;
  is_optional: boolean;
  tolerance_percentage: number | null;
}

export interface CreateProductionFormulaStageItemDTO {
  item_id: number;
  item_role: ItemRole;
  quantity: number;
  unit?: string;
  is_optional?: boolean;
  tolerance_percentage?: number;
}

export interface UpdateProductionFormulaStageItemDTO {
  item_role?: ItemRole;
  quantity?: number;
  unit?: string;
  is_optional?: boolean;
  tolerance_percentage?: number;
}

// ─── Production Formula Stage Parameter (conditions) ─────────────────

export interface ProductionFormulaStageParameter {
  id: number;
  workspace_id: number;
  formula_stage_id: number;
  label: string;
  planned_value: string;
  planned_value_numeric: number | null;
  unit: string | null;
  sort_order: number;
}

export interface CreateProductionFormulaStageParameterDTO {
  label: string;
  planned_value: string;
  unit?: string;
  sort_order?: number;
}

export interface UpdateProductionFormulaStageParameterDTO {
  label?: string;
  planned_value?: string;
  unit?: string | null;
  sort_order?: number;
}

export interface ProductionBatchStageParameter {
  id: number;
  workspace_id: number;
  batch_id: number;
  batch_stage_log_id: number;
  label: string;
  planned_value: string;
  planned_value_numeric: number | null;
  actual_value: string | null;
  actual_value_numeric: number | null;
  unit: string | null;
  source_parameter_id: number | null;
}

export interface UpdateProductionBatchStageParameterDTO {
  actual_value?: string | null;
  planned_value?: string;
}

export interface ProductionBatchStageItem {
  id: number;
  workspace_id: number;
  batch_id: number;
  batch_stage_log_id: number;
  item_id: number;
  item_role: ItemRole;
  expected_quantity: number | null;
  actual_quantity: number | null;
}

export interface UpdateProductionBatchStageItemDTO {
  actual_quantity: number | null;
}

/** @deprecated Use UpdateProductionBatchStageParameterDTO */
export type UpdateProductionBatchStageParameterActualDTO = UpdateProductionBatchStageParameterDTO;

// ─── Production Batch Stage Log ─────────────────────────────────────

export type BatchStageLogStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface ProductionBatchStageLog {
  id: number;
  workspace_id: number;
  batch_id: number;
  formula_stage_id: number | null;
  stage_name: string;
  stage_order: number;
  production_line_id: number | null;
  status: BatchStageLogStatus;
  planned_start_at?: string | null;
  started_at: string | null;
  completed_at: string | null;
  input_quantity: number | null;
  output_quantity: number | null;
  waste_quantity: number | null;
  notes: string | null;
  machine_id?: number | null;
  route_step_id?: number | null;
  expected_duration_minutes?: number | null;
  expected_output_quantity?: number | null;
  rework_quantity?: number | null;
  rework_of_log_id?: number | null;
  actual_duration_minutes?: number | null;
  yield_pct?: number | null;
  time_efficiency_pct?: number | null;
  throughput_per_hour?: number | null;
  waste_pct?: number | null;
  logged_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductionBatchStageLogDTO {
  batch_id: number;
  formula_stage_id?: number;
  stage_name: string;
  stage_order?: number;
  production_line_id?: number;
  status?: BatchStageLogStatus;
  started_at?: string;
  completed_at?: string;
  input_quantity?: number;
  output_quantity?: number;
  waste_quantity?: number;
  notes?: string;
}

export interface UpdateProductionBatchStageLogDTO {
  stage_name?: string;
  stage_order?: number;
  production_line_id?: number | null;
  machine_id?: number | null;
  expected_duration_minutes?: number | null;
  status?: BatchStageLogStatus;
  started_at?: string | null;
  completed_at?: string | null;
  input_quantity?: number | null;
  output_quantity?: number | null;
  waste_quantity?: number | null;
  notes?: string | null;
}

// ─── Production Batch ───────────────────────────────────────────────

export interface ProductionBatch {
  id: number;
  workspace_id: number;
  batch_number: string;
  production_line_id: number;
  machine_id?: number | null;
  formula_id: number | null;
  route_id?: number | null;
  planned_start_at?: string | null;
  planned_end_at?: string | null;
  sales_order_item_id?: number | null;
  sales_order_number?: string | null;
  sales_account_name?: string | null;
  linked_spend_total?: number | string | null;
  batch_date: string;
  shift_id?: number | null;
  shift: string | null;
  status: 'draft' | 'recurring' | 'in_progress' | 'completed' | 'cancelled';
  expected_output_quantity: number | null;
  expected_duration_minutes: number | null;
  actual_output_quantity: number | null;
  actual_duration_minutes: number | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  output_variance_quantity: number | null;
  /** API may serialize Numeric as string */
  output_variance_percentage: number | string | null;
  /** API may serialize Numeric as string */
  efficiency_percentage: number | string | null;
  notes: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  started_by: number | null;
  started_at: string | null;
  completed_by: number | null;
  completed_at: string | null;
  /** True after outputs were posted to factory finished goods (products). Accurate on batch detail GET. */
  finished_goods_posted?: boolean;
}

export interface CreateProductionBatchDTO {
  production_line_id: number;
  formula_id?: number;
  machine_id?: number;
  planned_start_at?: string;
  sales_order_item_id?: number;
  batch_date: string;
  shift_id?: number;
  shift?: string;
  expected_output_quantity?: number;
  expected_duration_minutes?: number;
  notes?: string;
  stage_seeds?: ProductionBatchStageSeedDTO[];
  item_seeds?: ProductionBatchItemSeedDTO[];
  parameter_seeds?: ProductionBatchStageParameterSeedDTO[];
}

export interface UpdateProductionBatchDTO {
  formula_id?: number;
  machine_id?: number | null;
  planned_start_at?: string | null;
  sales_order_item_id?: number | null;
  batch_date?: string;
  shift_id?: number | null;
  shift?: string;
  expected_output_quantity?: number;
  expected_duration_minutes?: number;
  actual_output_quantity?: number;
  actual_duration_minutes?: number;
  notes?: string;
}

export interface StartBatchDTO {
  target_output_quantity?: number;
  started_at?: string;
}

export interface CompleteBatchDTO {
  actual_output_quantity?: number;
  actual_duration_minutes?: number;
  notes?: string;
}

export interface CancelBatchDTO {
  notes?: string;
}

export interface ProductionConditionDriftSummary {
  label: string;
  unit: string | null;
  avg_drift: number;
  steps_with_actual: number;
}

export interface ProductionRecipeStatsRow {
  formula_id: number | null;
  recipe_name: string;
  batch_count: number;
  output_quantity: number | null;
  waste_quantity: number | null;
  yield_pct: number | null;
  time_vs_plan_pct: number | null;
  avg_start_lag_minutes: number | null;
  late_start_count: number;
  avg_step_gap_minutes: number | null;
  condition_drifts: ProductionConditionDriftSummary[];
}

export interface ProductionLineStatsRow {
  production_line_id: number;
  line_name: string;
  batch_count: number;
  output_quantity: number | null;
  waste_quantity: number | null;
  yield_pct: number | null;
  time_vs_plan_pct: number | null;
  avg_start_lag_minutes: number | null;
  late_start_count: number;
  avg_step_gap_minutes: number | null;
  recipes: ProductionRecipeStatsRow[];
}

export interface ProductionBatchOutlierRow {
  batch_id: number;
  batch_number: string;
  production_line_id: number;
  line_name: string;
  formula_id: number | null;
  recipe_name: string;
  metric: string;
  delta_from_group: number;
}

export interface ProductionOverviewStats {
  date_from: string;
  date_to: string;
  lines: ProductionLineStatsRow[];
  outliers: ProductionBatchOutlierRow[];
}

export interface ProductionBatchActivityDay {
  date: string;
  count: number;
}

export interface ProductionBatchActivityStats {
  date_from: string;
  date_to: string;
  days: ProductionBatchActivityDay[];
}

export interface ProductionBatchActivityParams {
  factory_id?: number;
  production_line_ids?: number[];
  formula_ids?: number[];
  statuses?: string;
}

// ─── Production Batch Activity ──────────────────────────────────────

export interface ProductionBatchEvent {
  id: number;
  workspace_id: number;
  batch_id: number;
  batch_stage_log_id: number | null;
  event_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  performed_by: number | null;
  user_name: string | null;
  created_at: string;
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
  /** Audit-only: ties quantity events to the step being edited */
  context_batch_stage_log_id?: number;
  source_location_type?: string;
  source_location_id?: number;
  destination_location_type?: string;
  destination_location_id?: number;
  notes?: string;
}
