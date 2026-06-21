// src/legacy-reference/legacy-types.ts

export type AccessRole = "owner" | "finance" | "ground-team" | "ground-team-manager";
export type AccessType = "page" | "manage_order" | "feature";

export interface AccessControl {
  id: number;
  role: AccessRole;
  target: string;
  type: AccessType;
}

export interface Status {
  id: number;
  name: string;
}

export interface Part {
  id: number;
  name: string;
}

export interface OrderedPart {
  id: number;
  is_sample_received_by_office: boolean;
  is_sample_sent_to_office: boolean;
  part_sent_by_office_date: string | null;
  part_received_by_factory_date: string | null;
  part_purchased_date: string | null;
  qty: number;
  vendor: string | null;
  brand: string | null;
  unit_cost: number | null;
  note: string | null;
  office_note: string | null;
  in_storage: boolean;
  approved_storage_withdrawal: boolean;
  order_id: number;
  part_id: number;
  mrr_number: string;
  approved_pending_order: boolean;
  approved_office_order: boolean;
  approved_budget: boolean;
  unstable_type: 'INACTIVE' | 'DEFECTIVE' | 'LESS' | null;
  qty_taken_from_storage: number;
}

export interface OrdersTypeCount {
  code: string;
  label: string;
  total: number;
}

// Mock Supabase Client
export const supabase_client = {
  from: (table: string) => {
    console.log(`Mock Supabase call to table: ${table}`);
    const chain = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      upsert: () => chain,
      delete: () => chain,
      in: () => chain,
    };
    return chain;
  }
};

// Mock Services
export const fetchPartsForDropDown = async () => [];
export const getOrdersByPartIDAndDateRange = async (partId: number, start?: Date, end?: Date) => [];
export const fetchPartByID = async (partId: number) => ({ id: partId, name: `Mock Part ${partId}` });
export const convertUtcToBDTime = (utcDateStr: string) => utcDateStr;

export const getOrdersByDateRange = async (start: Date, end: Date) => [];
export const getOrdersTotalInRange = async (start: Date, end: Date) => 0;
export const getOrdersTypeCountsClient = async (start: Date, end: Date): Promise<OrdersTypeCount[]> => [];
export const getOpenClosedCountsSmart = async (start: Date, end: Date) => ({ open: 0, completed: 0 });
export const fetchOrderedPartsForBusinessLensByOrderIds = async (orderIds: number[]) => [];

// Mock Auth Context
export const useAuth = () => {
  return {
    session: null,
    profile: null,
    loading: false,
    accessLoading: false,
    canViewPage: (pageKey: string) => true,
    hasFeature: (featureKey: string) => true,
  };
};
