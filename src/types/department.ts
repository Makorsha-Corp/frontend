export interface Department {
  id: number;
  workspace_id: number;
  name: string;
}

export interface CreateDepartmentRequest {
  name: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
}

export interface ListDepartmentsParams {
  skip?: number;
  limit?: number;
  search?: string;
}
