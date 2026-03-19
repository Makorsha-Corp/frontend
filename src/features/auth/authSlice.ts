import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/auth';
import type { Workspace } from '@/types/workspace';
import type { Factory } from '@/types/factory';

interface AuthState {
  user: User | null;
  token: string | null;
  workspace: Workspace | null;
  factory: Factory | null;
  isAuthenticated: boolean;
}

const loadWorkspaceFromStorage = (): Workspace | null => {
  const workspaceId = localStorage.getItem('workspace_id');

  if (workspaceId) {
    // Create minimal workspace object - only ID is needed for API headers
    return {
      id: parseInt(workspaceId),
      name: '',
      slug: '',
      owner_user_id: 0,
      created_by_user_id: 0,
      subscription_plan_id: 0,
      subscription_status: 'active',
      created_at: '',
      updated_at: '',
    };
  }
  return null;
};

const loadFactoryFromStorage = (): Factory | null => {
  const factoryJson = localStorage.getItem('selected_factory');
  if (factoryJson) {
    try {
      return JSON.parse(factoryJson) as Factory;
    } catch {
      return null;
    }
  }
  return null;
};

const loadUserFromStorage = (): User | null => {
  const userJson = localStorage.getItem('user_data');
  if (userJson) {
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }
  return null;
};

const initialState: AuthState = {
  user: loadUserFromStorage(),
  token: localStorage.getItem('auth_token'),
  workspace: loadWorkspaceFromStorage(),
  factory: loadFactoryFromStorage(),
  isAuthenticated: !!localStorage.getItem('auth_token'),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; workspace?: Workspace }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.workspace = action.payload.workspace || null;
      state.isAuthenticated = true;
      localStorage.setItem('auth_token', action.payload.token);
      localStorage.setItem('user_data', JSON.stringify(action.payload.user));
      if (action.payload.workspace) {
        localStorage.setItem('workspace_id', action.payload.workspace.id.toString());
      }
    },
    setWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspace = action.payload;
      localStorage.setItem('workspace_id', action.payload.id.toString());
      // Clear factory when workspace changes - factories are workspace-scoped
      state.factory = null;
      localStorage.removeItem('selected_factory');
    },
    setFactory: (state, action: PayloadAction<Factory>) => {
      state.factory = action.payload;
      localStorage.setItem('selected_factory', JSON.stringify(action.payload));
    },
    clearFactory: (state) => {
      state.factory = null;
      localStorage.removeItem('selected_factory');
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.workspace = null;
      state.factory = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('workspace_id');
      localStorage.removeItem('user_data');
      localStorage.removeItem('selected_factory');
    },
  },
});

export const { setCredentials, setWorkspace, setFactory, clearFactory, logout } = authSlice.actions;
export default authSlice.reducer;
