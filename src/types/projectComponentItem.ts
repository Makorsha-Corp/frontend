/**
 * Project Component Item type definitions
 */

export interface ProjectComponentItem {
  id: number;
  project_component_id: number;
  item_id: number;
  qty: number;
}

export interface CreateProjectComponentItemDTO {
  project_component_id: number;
  item_id: number;
  qty: number;
}

export interface UpdateProjectComponentItemDTO {
  qty?: number;
}
