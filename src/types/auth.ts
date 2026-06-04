// User types
export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
}

// Auth request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  workspace_name?: string;
  invitation_token?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
}

// Auth response types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: User;
  messages?: import('./common').ActionMessage[];
  // NOTE: Workspace NOT included - user must select workspace after login via GET /workspaces
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: User;
  workspace: import('./workspace').Workspace | null;
  messages?: import('./common').ActionMessage[];
}

// Refresh / logout flow
export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface LogoutRequest {
  refresh_token?: string | null;
  all_devices?: boolean;
}

export interface ValidateInvitationDetails {
  workspace_id: number;
  workspace_name: string | null;
  email: string;
  role: string;
  position: string | null;
  expires_at: string;
}

export interface ValidateInvitationResponse {
  valid: boolean;
  invitation: ValidateInvitationDetails;
  messages?: import('./common').ActionMessage[];
}
