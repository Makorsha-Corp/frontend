/**
 * Project Component Task type definitions
 */

// Backend uses UPPERCASE enums to match Python enums
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ProjectComponentTask {
  id: number;
  project_component_id: number;
  name: string;
  description: string;
  is_note: boolean;
  is_completed: boolean;
  task_priority: TaskPriority | null;
  created_at: string;
}

export interface CreateProjectComponentTaskDTO {
  project_component_id: number;
  name: string;
  description: string;
  is_note?: boolean;
  task_priority?: TaskPriority | null;
}

export interface UpdateProjectComponentTaskDTO {
  name?: string;
  description?: string;
  is_completed?: boolean;
  is_note?: boolean;
  task_priority?: TaskPriority | null;
}
