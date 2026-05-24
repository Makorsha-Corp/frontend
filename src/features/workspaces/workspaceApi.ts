import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
// Use explicit module-file paths: `@/types` resolves to the legacy
// `src/types.ts`, not the `src/types/` folder we actually want.
import type {
  WorkspaceListItem,
  WorkspaceDetails,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMember,
  WorkspaceInvitation,
  SendInvitationRequest,
} from '@/types/workspace';

export const workspaceApi = createApi({
  reducerPath: 'workspaceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Workspace', 'WorkspaceMember', 'WorkspaceInvitation'],
  endpoints: (builder) => ({
    // List workspaces
    getWorkspaces: builder.query<WorkspaceListItem[], void>({
      query: () => 'workspaces/',
      providesTags: ['Workspace'],
    }),

    // Create workspace
    createWorkspace: builder.mutation<WorkspaceDetails, CreateWorkspaceRequest>({
      query: (data) => ({
        url: 'workspaces/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workspace'],
    }),

    // Get workspace details
    getWorkspace: builder.query<WorkspaceDetails, number>({
      query: (id) => `workspaces/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Workspace', id }],
    }),

    // Update workspace
    updateWorkspace: builder.mutation<WorkspaceDetails, { id: number; data: UpdateWorkspaceRequest }>({
      query: ({ id, data }) => ({
        url: `workspaces/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Workspace', id }],
    }),

    // Get workspace members
    getWorkspaceMembers: builder.query<WorkspaceMember[], number>({
      query: (workspaceId) => `workspaces/${workspaceId}/members/`,
      providesTags: ['WorkspaceMember'],
    }),

    // Get workspace invitations
    getWorkspaceInvitations: builder.query<WorkspaceInvitation[], number>({
      query: (workspaceId) => `workspaces/${workspaceId}/invitations/`,
      providesTags: ['WorkspaceInvitation'],
    }),

    // Send invitation
    sendInvitation: builder.mutation<WorkspaceInvitation, { workspaceId: number; data: SendInvitationRequest }>({
      query: ({ workspaceId, data }) => ({
        url: `workspaces/${workspaceId}/invitations/`,
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
