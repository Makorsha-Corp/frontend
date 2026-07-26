import type {
  WorkOrder,
  WorkOrderItem,
  WorkOrderApproversList,
  WorkOrderItemActionType,
  WorkOrderItemSourceType,
  WorkOrderPriority,
  WorkOrderStatus,
} from './workOrder';
import type { PaginatedResponse } from './common';

export interface WorkOrderSheetBundle {
  order: WorkOrder;
  items: WorkOrderItem[];
  approvers: WorkOrderApproversList;
}

export interface WorkOrderSheetEntryLine {
  item_id: number;
  quantity: number;
  action_type?: WorkOrderItemActionType;
  source_location_type?: WorkOrderItemSourceType;
  source_location_id?: number;
  replaced_item_id?: number;
}

export interface WorkOrderSheetApproverLine {
  user_id: number;
  approver_slot?: 'manager' | 'agm' | null;
}

export interface WorkOrderSheetEntryRequest {
  machine_id: number;
  work_order_type_id: number;
  planned_date: string;
  assigned_to?: string;
  description?: string;
  priority?: WorkOrderPriority;
  account_id?: number;
  cost?: number;
  template_id?: number;
  recurrence_end_date?: string;
  items?: WorkOrderSheetEntryLine[];
  approvers?: WorkOrderSheetApproverLine[];
}

export type WorkOrderSheetEntryResponse = WorkOrder;

export interface ListWorkOrderSheetParams {
  factory_id?: number;
  machine_id?: number;
  planned_date_from?: string;
  planned_date_to?: string;
  status?: WorkOrderStatus;
  status_scope?: 'planned';
  work_order_type_id?: number;
  priority?: WorkOrderPriority;
  exclude_completed?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

export type WorkOrderSheetListResponse = PaginatedResponse<WorkOrderSheetBundle>;

export interface ListWorkOrderSheetDailyCountsParams {
  factory_id?: number;
  machine_id?: number;
  planned_date_from?: string;
  planned_date_to?: string;
  status?: WorkOrderStatus;
  work_order_type_id?: number;
  priority?: WorkOrderPriority;
}

export interface WorkOrderSheetDailyCountsResponse {
  counts: Record<string, number>;
}

export interface GenerateWorkOrderDraftsRequest {
  target_date: string;
  factory_section_id?: number;
  factory_id?: number;
}
