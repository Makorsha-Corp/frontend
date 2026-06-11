/**
 * Project type definitions
 */

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectVisibility = 'workspace' | 'invited_only';

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
  visibility: ProjectVisibility;
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

export interface ProjectMember {
  id: number;
  workspace_id: number;
  project_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  assigned_by: number | null;
  assigned_at: string;
}

export interface ProjectMembersList {
  members: ProjectMember[];
}

export type ProjectEventType =
  | 'created'
  | 'updated'
  | 'status_updated'
  | 'visibility_updated'
  | 'member_added'
  | 'member_removed'
  | 'deleted'
  | 'component_created'
  | 'component_updated'
  | 'component_deleted'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_reopened'
  | 'task_deleted'
  | 'note_created'
  | 'note_updated'
  | 'note_deleted'
  | 'item_added'
  | 'item_updated'
  | 'item_removed'
  | 'cost_added'
  | 'cost_updated'
  | 'cost_deleted';

export interface ProjectEventChange {
  field: string;
  label: string;
  from_value?: string | null;
  to_value?: string | null;
}

export interface ProjectEventMetadata {
  changes?: ProjectEventChange[];
  user_id?: number;
  user_name?: string;
  component_id?: number;
  component_name?: string;
  task_id?: number;
  task_name?: string;
  note_id?: number;
  note_name?: string;
  item_id?: number;
  qty?: string;
  cost_id?: number;
  cost_name?: string;
}

export interface ProjectEvent {
  id: number;
  workspace_id: number;
  project_id: number;
  event_type: ProjectEventType | string;
  description: string;
  metadata?: ProjectEventMetadata | null;
  performed_by: number | null;
  user_name: string | null;
  created_at: string;
}
