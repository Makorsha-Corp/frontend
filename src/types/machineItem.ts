/**
 * Machine item types
 */

export interface MachineItem {
  id: number;
  workspace_id: number;
  machine_id: number;
  item_id: number;
  qty: number;
  req_qty: number | null;
  defective_qty: number | null;
  /** Item name from joined item (when API includes it) */
  item_name?: string | null;
  /** Item unit from joined item (when API includes it) */
  item_unit?: string | null;
}

export interface CreateMachineItemRequest {
  machine_id: number;
  item_id: number;
  qty: number;
  req_qty?: number;
  defective_qty?: number;
}

export interface UpdateMachineItemRequest {
  qty?: number;
  req_qty?: number;
  defective_qty?: number;
}

export interface ListMachineItemsParams {
  skip?: number;
  limit?: number;
  machine_id?: number;
}
