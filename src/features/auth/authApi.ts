import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  WorkspaceListItem,
  ValidateInvitationResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      const workspace = (getState() as RootState).auth.workspace;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (workspace) {
        headers.set('X-Workspace-ID', workspace.id.toString());
      }

      return headers;
    },
  }),
  tagTypes: ['User', 'Workspace'],
  endpoints: (builder) => ({
    // Login
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // Register
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Get user's workspaces
    getWorkspaces: builder.query<WorkspaceListItem[], void>({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),

    // Validate invitation token (public endpoint)
    validateInvitation: builder.query<ValidateInvitationResponse, string>({
      query: (token) => `/auth/validate-invite?token=${token}`,
    }),

    // Forgot password
    forgotPassword: builder.mutation<{ message: string; email_sent: boolean }, ForgotPasswordRequest>({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // Logout (client-side only for now)
    logout: builder.mutation<void, void>({
      queryFn: () => {
        // Just clear local storage, no API call needed for JWT
        localStorage.removeItem('auth_token');
        localStorage.removeItem('workspace_id');
        return { data: undefined };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useGetWorkspacesQuery,
  useValidateInvitationQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
