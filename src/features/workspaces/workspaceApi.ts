import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type {
  WorkspaceListItem,
  WorkspaceDetails,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMember,
  WorkspaceInvitation,
  SendInvitationRequest,
} from '@/types';

export const workspaceApi = createApi({
  reducerPath: 'workspaceApi',
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
  tagTypes: ['Workspace', 'WorkspaceMember', 'WorkspaceInvitation'],
  endpoints: (builder) => ({
    // List workspaces
    getWorkspaces: builder.query<WorkspaceListItem[], void>({
      query: () => '/workspaces',
      providesTags: ['Workspace'],
    }),

    // Create workspace
    createWorkspace: builder.mutation<WorkspaceDetails, CreateWorkspaceRequest>({
      query: (data) => ({
        url: '/workspaces',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workspace'],
    }),

    // Get workspace details
    getWorkspace: builder.query<WorkspaceDetails, number>({
      query: (id) => `/workspaces/${id}`,
      providesTags: (result, error, id) => [{ type: 'Workspace', id }],
    }),

    // Update workspace
    updateWorkspace: builder.mutation<WorkspaceDetails, { id: number; data: UpdateWorkspaceRequest }>({
      query: ({ id, data }) => ({
        url: `/workspaces/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Workspace', id }],
    }),

    // Get workspace members
    getWorkspaceMembers: builder.query<WorkspaceMember[], number>({
      query: (workspaceId) => `/workspaces/${workspaceId}/members`,
      providesTags: ['WorkspaceMember'],
    }),

    // Get workspace invitations
    getWorkspaceInvitations: builder.query<WorkspaceInvitation[], number>({
      query: (workspaceId) => `/workspaces/${workspaceId}/invitations`,
      providesTags: ['WorkspaceInvitation'],
    }),

    // Send invitation
    sendInvitation: builder.mutation<WorkspaceInvitation, { workspaceId: number; data: SendInvitationRequest }>({
      query: ({ workspaceId, data }) => ({
        url: `/workspaces/${workspaceId}/invitations`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkspaceInvitation'],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useGetWorkspaceInvitationsQuery,
  useSendInvitationMutation,
} = workspaceApi;
