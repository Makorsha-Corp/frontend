import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { RootState } from '@/app/store';
import { logout as logoutAction, updateUser } from '@/features/auth/authSlice';
import {
  mergeHelpGuideSeenLocal,
  removeHelpGuidesSeenLocal,
  resetHelpGuidesSeenLocal,
} from '@/features/helpGuides/helpGuidesSeen';
// Import from explicit module files: the project has both `src/types.ts`
// (legacy) and `src/types/` (current). The `@/types` alias resolves to the
// legacy file, so module-explicit imports are required for new auth types.
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  MeResponse,
  ProfileMeUpdate,
  ValidateInvitationResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TokenPair,
  RefreshTokenRequest,
  LogoutRequest,
} from '@/types/auth';
import type { StampImageSignResponse } from '@/types/savedStamp';
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

    // Get current user + workspace context
    getMe: builder.query<MeResponse, void>({
      query: () => 'auth/me/',
      providesTags: ['User'],
    }),

    updateMe: builder.mutation<User, ProfileMeUpdate>({
      query: (body) => ({
        url: 'auth/me/',
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: {
        id: number;
        name: string;
        email: string;
        timezone?: string | null;
        saved_stamp?: User['saved_stamp'];
      }) => ({
        id: response.id,
        name: response.name,
        email: response.email,
        timezone: response.timezone ?? null,
        saved_stamp: response.saved_stamp ?? null,
      }),
      invalidatesTags: ['User'],
    }),

    signStampImageUpload: builder.mutation<StampImageSignResponse, void>({
      query: () => ({
        url: 'auth/me/stamp-image/sign',
        method: 'POST',
        body: {},
      }),
    }),

    markHelpGuideSeen: builder.mutation<User, { tour_id: string }>({
      query: (body) => ({
        url: 'auth/me/help-guides/mark-seen',
        method: 'POST',
        body,
      }),
      transformResponse: (response: User) => response,
      async onQueryStarted({ tour_id }, { dispatch, getState, queryFulfilled }) {
        const state = getState() as RootState;
        const workspaceId = state.auth.workspace?.id;
        const user = state.auth.user;
        if (workspaceId != null && user) {
          dispatch(
            updateUser({
              help_guides_seen: mergeHelpGuideSeenLocal(user.help_guides_seen, workspaceId, tour_id),
            }),
          );
        }
        try {
          const { data } = await queryFulfilled;
          dispatch(
            updateUser({
              help_guides_seen: data.help_guides_seen ?? undefined,
            }),
          );
        } catch {
          // Server remains source of truth on next getMe; avoid duplicate auto-run via optimistic mark.
        }
      },
    }),

    unmarkHelpGuidesSeen: builder.mutation<User, { tour_ids: string[] }>({
      query: (body) => ({
        url: 'auth/me/help-guides/unmark-seen',
        method: 'POST',
        body,
      }),
      transformResponse: (response: User) => response,
      async onQueryStarted({ tour_ids }, { dispatch, getState, queryFulfilled }) {
        const state = getState() as RootState;
        const workspaceId = state.auth.workspace?.id;
        const user = state.auth.user;
        if (workspaceId != null && user) {
          dispatch(
            updateUser({
              help_guides_seen: removeHelpGuidesSeenLocal(
                user.help_guides_seen,
                workspaceId,
                tour_ids,
              ),
            }),
          );
        }
        try {
          const { data } = await queryFulfilled;
          dispatch(
            updateUser({
              help_guides_seen: data.help_guides_seen ?? undefined,
            }),
          );
        } catch {
          // noop
        }
      },
    }),

    resetHelpGuides: builder.mutation<User, { scope: 'workspace' | 'all' }>({
      query: (body) => ({
        url: 'auth/me/help-guides/reset',
        method: 'POST',
        body,
      }),
      transformResponse: (response: User) => response,
      async onQueryStarted({ scope }, { dispatch, getState, queryFulfilled }) {
        const state = getState() as RootState;
        const workspaceId = state.auth.workspace?.id;
        const user = state.auth.user;
        if (workspaceId != null && user) {
          dispatch(
            updateUser({
              help_guides_seen: resetHelpGuidesSeenLocal(user.help_guides_seen, scope, workspaceId),
            }),
          );
        }
        try {
          const { data } = await queryFulfilled;
          dispatch(
            updateUser({
              help_guides_seen: data.help_guides_seen ?? undefined,
            }),
          );
        } catch {
          // noop
        }
      },
    }),

    // Legacy alias
    getCurrentUser: builder.query<User, void>({
      query: () => 'auth/me/',
      transformResponse: (response: MeResponse) => response.user,
      providesTags: ['User'],
    }),

    // Get user's workspaces
    getWorkspaces: builder.query<WorkspaceListItem[], number>({
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
  useGetMeQuery,
  useUpdateMeMutation,
  useSignStampImageUploadMutation,
  useMarkHelpGuideSeenMutation,
  useUnmarkHelpGuidesSeenMutation,
  useResetHelpGuidesMutation,
  useGetCurrentUserQuery,
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useValidateInvitationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
