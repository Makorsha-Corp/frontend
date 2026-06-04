import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { RootState } from '@/app/store';
import { logout as logoutAction } from '@/features/auth/authSlice';
// Import from explicit module files: the project has both `src/types.ts`
// (legacy) and `src/types/` (current). The `@/types` alias resolves to the
// legacy file, so module-explicit imports are required for new auth types.
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  ValidateInvitationResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TokenPair,
  RefreshTokenRequest,
  LogoutRequest,
} from '@/types/auth';
import type {
  Workspace,
  WorkspaceListItem,
  CreateWorkspaceRequest,
} from '@/types/workspace';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Workspace'],
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: 'auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Register
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (data) => ({
        url: 'auth/register/',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Refresh — exchange a refresh token for a new access + refresh pair.
     * Used directly by `baseQueryWithReauth`; rarely called from components.
     */
    refreshToken: builder.mutation<TokenPair, RefreshTokenRequest>({
      query: (body) => ({
        url: 'auth/refresh/',
        method: 'POST',
        body,
      }),
    }),

    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me/',
      providesTags: ['User'],
    }),

    // Get user's workspaces
    getWorkspaces: builder.query<WorkspaceListItem[], void>({
      query: () => 'workspaces/',
      providesTags: ['Workspace'],
    }),

    createWorkspace: builder.mutation<Workspace, CreateWorkspaceRequest>({
      query: (body) => ({
        url: 'workspaces/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Workspace'],
    }),

    // Validate invitation token (public POST endpoint)
    validateInvitation: builder.mutation<ValidateInvitationResponse, { invitation_token: string }>({
      query: (body) => ({
        url: 'auth/validate-invitation/',
        method: 'POST',
        body,
      }),
    }),

    // Forgot password
    forgotPassword: builder.mutation<{ message: string; email_sent: boolean }, ForgotPasswordRequest>({
      query: (data) => ({
        url: 'auth/forgot-password/',
        method: 'POST',
        body: data,
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: 'auth/reset-password/',
        method: 'POST',
        body: data,
      }),
    }),

    /**
     * Logout — revoke the refresh token on the server, then clear local
     * auth state. Best-effort: if the network call fails (e.g. user is
     * offline or token is already revoked), we still clear locally so the
     * UI doesn't get stuck in a stale logged-in state.
     */
    logout: builder.mutation<void, LogoutRequest | void>({
      async queryFn(arg, api, _extraOptions, baseQuery) {
        const state = api.getState() as RootState;
        const refreshToken = arg?.refresh_token ?? state.auth.refreshToken;
        const allDevices = !!arg?.all_devices;

        // Fire and (effectively) forget: ignore errors so logout always
        // succeeds locally.
        try {
          await baseQuery({
            url: 'auth/logout/',
            method: 'POST',
            body: {
              refresh_token: refreshToken ?? null,
              all_devices: allDevices,
            },
          });
        } catch {
          // swallow — local logout still happens below
        }

        api.dispatch(logoutAction());
        return { data: undefined };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useValidateInvitationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
