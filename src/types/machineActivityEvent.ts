export type MachineActivityEventType =
  | 'created'
  | 'updated'
  | 'deactivated'
  | 'status_updated'
  | 'maintenance_logged'
  | 'maintenance_updated'
  | 'maintenance_removed'
  | 'item_added'
  | 'item_updated'
  | 'item_removed'
  | 'inventory_adjusted'
  | 'transfer_in'
  | 'transfer_out'
  | 'ledger_reconciled'
  | 'purchase_received'
  | 'work_order_completed';

export interface MachineActivityEventChange {
  field: string;
  label: string;
  from_value: string | null;
  to_value: string | null;
}

export interface MachineActivityEventMetadata {
  changes?: MachineActivityEventChange[] | null;
  item_id?: number | null;
  item_name?: string | null;
  machine_item_id?: number | null;
  maintenance_log_id?: number | null;
  transfer_order_id?: number | null;
  purchase_order_id?: number | null;
  work_order_id?: number | null;
  quantity?: number | null;
  status?: string | null;
}

export interface MachineActivityEvent {
  id: number;
  workspace_id: number;
  machine_id: number;
  event_type: MachineActivityEventType | string;
  description: string;
  metadata: MachineActivityEventMetadata | null;
  performed_by: number | null;
  performer_name: string | null;
  created_at: string;
}

export interface ListMachineActivityParams {
  machine_id: number;
  skip?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
  event_type?: string;
}
