// Workspace types
export interface Workspace {
  id: number;
  name: string;
  role: string;
  status: string;
}

export interface WorkspaceDetails extends Workspace {
  slug: string;
  owner_user_id: number;
  subscription_plan_id: number;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceListItem {
  id: number;
  name: string;
  slug: string;
  subscription_status: string;
  role: string;
  is_owner: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  max_members: number | null;
  max_storage_mb: number | null;
  price_monthly: number;
}

// Workspace member types — matches WorkspaceMemberWithUser backend response
export interface WorkspaceMember {
  id: number;
  workspace_id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  user_position: string | null;
  role: string;
  status: 'active' | 'inactive';
  joined_at: string | null;
}

// Workspace invitation types — matches WorkspaceInvitationWithDetails backend response
export interface WorkspaceInvitation {
  id: number;
  workspace_id: number;
  email: string;
  role: string;
  position: string | null;
  invited_by_user_id: number | null;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_at: string;
  expires_at: string;
  accepted_at: string | null;
  workspace_name: string | null;
  invited_by_name: string | null;
}

export interface SendInvitationRequest {
  email: string;
  role: 'manager' | 'member' | 'viewer' | 'ground-team';
  position?: string | null;
}

export interface AcceptInvitationRequest {
  token: string;
  position?: string | null;
}

export interface UpdateMemberRoleRequest {
  new_role: string;
  position?: string | null;
}

// Workspace request types
export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  subscription_plan_id?: number | null;
  billing_email?: string | null;
  owner_position?: string | null;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  billing_email?: string | null;
  settings?: Record<string, unknown>;
}
