/**
 * Project type definitions
 */

// Backend uses UPPERCASE enums to match Python enums
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Project {
  id: number;
  workspace_id: number;
  factory_id: number;
  name: string;
  description: string;
  budget: number | null;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  priority: ProjectPriority;
  status: ProjectStatus;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
  is_active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: number | null;
}

export interface CreateProjectDTO {
  factory_id: number;
  name: string;
  description: string;
  budget?: number | null;
  deadline?: string | null;
  priority?: ProjectPriority;
  status?: ProjectStatus;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  budget?: number | null;
  deadline?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  priority?: ProjectPriority;
  status?: ProjectStatus;
}
