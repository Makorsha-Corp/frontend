/**
 * Project Component type definitions
 */

import { ProjectStatus } from './project';

export interface ProjectComponent {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface CreateProjectComponentDTO {
  project_id: number;
  name: string;
  description?: string | null;
  budget?: number | null;
  deadline?: string | null;
  status?: ProjectStatus;
}

export interface UpdateProjectComponentDTO {
  name?: string;
  description?: string | null;
  budget?: number | null;
  deadline?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: ProjectStatus;
}
