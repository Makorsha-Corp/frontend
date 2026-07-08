export interface WorkOrderType {
  id: number;
  workspace_id: number;
  name: string;
}

export interface CreateWorkOrderTypeRequest {
  name: string;
}

export interface UpdateWorkOrderTypeRequest {
  name?: string;
}

export interface ListWorkOrderTypesParams {
  skip?: number;
  limit?: number;
  search?: string;
}
