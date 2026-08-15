export interface OrderApproverView {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  user_position?: string | null;
  approved: boolean;
}

export interface OrderApprovalBlockedStatus {
  title: string;
  reason: string;
  pendingLabels?: string[];
}
