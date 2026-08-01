// Common API response types
export interface ApiError {
  detail: string;
  status?: number;
  type?: string;
  instance?: string;
  request_id?: string;
  errors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

export interface ActionMessage {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details?: any;
}

export interface ActionResponse<T> {
  data: T;
  messages: ActionMessage[];
  request_id?: string;
}

// Pagination types
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}
