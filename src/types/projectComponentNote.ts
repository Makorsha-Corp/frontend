export interface ProjectComponentNote {
  id: number;
  project_component_id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CreateProjectComponentNoteDTO {
  project_component_id: number;
  name: string;
  description: string;
}

export interface UpdateProjectComponentNoteDTO {
  name?: string;
  description?: string;
}
