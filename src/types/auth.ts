// User types
export interface User {
  id: number;
  email: string;
  name: string;
  permission: string;
  position: string;
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
  position?: string;
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
  token_type: string;
  user: User;
  messages?: import('./common').ActionMessage[];
  // NOTE: Workspace NOT included - user must select workspace after login via GET /workspaces
}

export interface RegisterResponse {
  access_token: string;
  token_type: string;
  user: User;
  workspace: import('./workspace').Workspace;
}

export interface ValidateInvitationResponse {
  valid: boolean;
  email?: string;
  workspace_name?: string;
  workspace_id?: number;
  role?: string;
  invited_by_name?: string;
  invited_at?: string;
  expires_at?: string;
  error?: string;
}
