// Workspace types
export interface Workspace {
  id: number;
  name: string;
  role: string;
  status: string;
}

export interface WorkspaceDetails extends Workspace {
  owner_user_id: number;
  owner_name: string;
  subscription_plan: SubscriptionPlan;
  member_count: number;
  trial_ends_at: string | null;
  created_at: string;
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
  max_members: number;
  max_storage_mb: number;
  price_monthly: number;
}

// Workspace member types
export interface WorkspaceMember {
  user_id: number;
  name: string;
  email: string;
  role: 'owner' | 'finance' | 'ground-team-manager' | 'ground-team';
  status: 'active' | 'inactive';
  joined_at: string;
}

// Workspace invitation types
export interface WorkspaceInvitation {
  id: number;
  email: string;
  workspace_id: number;
  workspace_name?: string;
  role: string;
  invitation_token?: string;
  invited_by: number;
  invited_by_name?: string;
  status: 'pending' | 'accepted' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface SendInvitationRequest {
  email: string;
  role: 'finance' | 'ground-team-manager' | 'ground-team';
}

export interface AcceptInvitationRequest {
  invitation_token: string;
}

// Workspace request types
export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  subscription_plan_id?: number | null;
  billing_email?: string | null;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  billing_email?: string | null;
  settings?: any;
}
