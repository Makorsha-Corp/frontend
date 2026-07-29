export interface DeliveryMethod {
  id: number;
  workspace_id: number;
  name: string;
}

export interface CreateDeliveryMethodRequest {
  name: string;
}

export interface UpdateDeliveryMethodRequest {
  name?: string;
}

export interface ListDeliveryMethodsParams {
  skip?: number;
  limit?: number;
  search?: string;
}
