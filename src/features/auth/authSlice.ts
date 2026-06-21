import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/auth';
import type { Workspace } from '@/types/workspace';
import type { Factory } from '@/types/factory';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  workspace: Workspace | null;
  factory: Factory | null;
  isAuthenticated: boolean;
}

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const WORKSPACE_ID_KEY = 'workspace_id';
const WORKSPACE_DATA_KEY = 'workspace_data';
const USER_DATA_KEY = 'user_data';
const SELECTED_FACTORY_KEY = 'selected_factory';

const loadWorkspaceFromStorage = (): Workspace | null => {
  // Prefer the full workspace object (written by setWorkspace).
  const workspaceJson = localStorage.getItem(WORKSPACE_DATA_KEY);
  if (workspaceJson) {
    try {
      return JSON.parse(workspaceJson) as Workspace;
    } catch {
      // fall through to legacy id-only path
    }
  }
  // Legacy fallback: only the id was stored — role/name will be empty.
  const workspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
  if (workspaceId) {
    return { id: parseInt(workspaceId), name: '', role: '', status: 'active' };
  }
  return null;
};

const loadFactoryFromStorage = (): Factory | null => {
  const factoryJson = localStorage.getItem(SELECTED_FACTORY_KEY);
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
  const userJson = localStorage.getItem(USER_DATA_KEY);
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
  token: localStorage.getItem(AUTH_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  workspace: loadWorkspaceFromStorage(),
  factory: loadFactoryFromStorage(),
  isAuthenticated: !!localStorage.getItem(AUTH_TOKEN_KEY),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        // Refresh token is optional only to keep callers that pre-date the
        // rotation flow compiling; new callers MUST pass it.
        refreshToken?: string;
        workspace?: Workspace;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      if (action.payload.refreshToken !== undefined) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken);
      }
      state.workspace = action.payload.workspace || null;
      state.isAuthenticated = true;
      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(action.payload.user));
      if (action.payload.workspace) {
        localStorage.setItem(WORKSPACE_ID_KEY, action.payload.workspace.id.toString());
        localStorage.setItem(WORKSPACE_DATA_KEY, JSON.stringify(action.payload.workspace));
      }
    },
    /**
     * Update access + refresh tokens after a successful POST /auth/refresh/.
     * Used by `baseQueryWithReauth` after the mutex-protected refresh storm.
     * Intentionally narrow: does NOT touch user/workspace/factory.
     */
    setTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string }>
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken);
    },
    setWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspace = action.payload;
      localStorage.setItem(WORKSPACE_ID_KEY, action.payload.id.toString());
      localStorage.setItem(WORKSPACE_DATA_KEY, JSON.stringify(action.payload));
      state.factory = null;
      localStorage.removeItem(SELECTED_FACTORY_KEY);
    },
    setFactory: (state, action: PayloadAction<Factory>) => {
      state.factory = action.payload;
      localStorage.setItem(SELECTED_FACTORY_KEY, JSON.stringify(action.payload));
    },
    clearFactory: (state) => {
      state.factory = null;
      localStorage.removeItem(SELECTED_FACTORY_KEY);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.workspace = null;
      state.factory = null;
      state.isAuthenticated = false;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(WORKSPACE_ID_KEY);
      localStorage.removeItem(WORKSPACE_DATA_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem(SELECTED_FACTORY_KEY);
    },
  },
});

export const {
  setCredentials,
  setTokens,
  setWorkspace,
  setFactory,
  clearFactory,
  logout,
} = authSlice.actions;
export default authSlice.reducer;

/**
 * Multi-tab sync helper.
 *
 * Call once from app bootstrap (e.g. in main.tsx after store creation).
 *
 * When tab A refreshes the token (writing new value to localStorage), tab B's
 * Redux state still holds the OLD token until something causes a re-read.
 * Listening to the cross-tab `storage` event lets us pick up the new value
 * proactively so tab B doesn't fire a request with a stale token.
 *
 * NOTE: the `storage` event only fires in OTHER tabs (never the writer), so
 * this is safe and avoids feedback loops.
 */
export const installStorageSync = (
  dispatch: (action: ReturnType<typeof setTokens> | ReturnType<typeof logout>) => void
): void => {
  if (typeof window === 'undefined') return;
  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_TOKEN_KEY) return;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token || !refreshToken) {
      dispatch(logout());
    } else {
      dispatch(setTokens({ token, refreshToken }));
    }
  });
};
