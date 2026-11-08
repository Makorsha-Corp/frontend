export interface WorkspaceShift {
  id: number;
  workspace_id: number;
  name: string;
  /** HH:mm:ss from API */
  start_time: string;
  end_time: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceShiftCreate {
  name: string;
  start_time: string;
  end_time: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface WorkspaceShiftUpdate {
  name?: string;
  start_time?: string;
  end_time?: string;
  sort_order?: number;
  is_active?: boolean;
}
