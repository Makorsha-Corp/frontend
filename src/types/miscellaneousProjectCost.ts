/**
 * Miscellaneous Project Cost type definitions
 */

export interface MiscellaneousProjectCost {
  id: number;
  project_id: number | null;
  project_component_id: number | null;
  name: string;
  description: string | null;
  amount: number;
  created_at: string;
}

export interface CreateMiscellaneousProjectCostDTO {
  project_id?: number | null;
  project_component_id?: number | null;
  name: string;
  description?: string | null;
  amount: number;
}

export interface UpdateMiscellaneousProjectCostDTO {
  name?: string;
  description?: string | null;
  amount?: number;
}
