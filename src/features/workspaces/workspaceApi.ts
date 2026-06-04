import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  WorkspaceListItem,
  WorkspaceDetails,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMember,
  WorkspaceInvitation,
  SendInvitationRequest,
  AcceptInvitationRequest,
  UpdateMemberRoleRequest,
} from '@/types/workspace';

export const workspaceApi = createApi({
  reducerPath: 'workspaceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Workspace', 'WorkspaceMember', 'WorkspaceInvitation', 'MyInvitation'],
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
      providesTags: (_result, _error, id) => [{ type: 'Workspace', id }],
    }),

    // Update workspace
    updateWorkspace: builder.mutation<WorkspaceDetails, { id: number; data: UpdateWorkspaceRequest }>({
      query: ({ id, data }) => ({
        url: `workspaces/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Workspace', id }],
    }),

    // Get workspace members
    getWorkspaceMembers: builder.query<WorkspaceMember[], number>({
      query: (workspaceId) => `workspaces/${workspaceId}/members/`,
      providesTags: ['WorkspaceMember'],
    }),

    // Update member role
    updateMemberRole: builder.mutation<
      WorkspaceMember,
      { workspaceId: number; userId: number; data: UpdateMemberRoleRequest }
    >({
      query: ({ workspaceId, userId, data }) => ({
        url: `workspaces/${workspaceId}/members/${userId}/role/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['WorkspaceMember'],
    }),

    // Remove member
    removeMember: builder.mutation<{ message: string }, { workspaceId: number; userId: number }>({
      query: ({ workspaceId, userId }) => ({
        url: `workspaces/${workspaceId}/members/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkspaceMember'],
    }),

    // Get workspace invitations
    getWorkspaceInvitations: builder.query<
      WorkspaceInvitation[],
      { workspaceId: number; includeExpired?: boolean }
    >({
      query: ({ workspaceId, includeExpired }) =>
        `workspaces/${workspaceId}/invitations/${includeExpired ? '?include_expired=true' : ''}`,
      providesTags: ['WorkspaceInvitation'],
    }),

    // Send invitation
    sendInvitation: builder.mutation<
      WorkspaceInvitation,
      { workspaceId: number; data: SendInvitationRequest }
    >({
      query: ({ workspaceId, data }) => ({
        url: `workspaces/${workspaceId}/invitations/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkspaceInvitation'],
    }),

    // Accept invitation (existing user)
    acceptInvitation: builder.mutation<
      WorkspaceMember,
      { workspaceId: number; data: AcceptInvitationRequest }
    >({
      query: ({ workspaceId, data }) => ({
        url: `workspaces/${workspaceId}/invitations/accept/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Workspace', 'WorkspaceMember', 'MyInvitation'],
    }),

    // Cancel invitation
    cancelInvitation: builder.mutation<
      { message: string },
      { workspaceId: number; invitationId: number }
    >({
      query: ({ workspaceId, invitationId }) => ({
        url: `workspaces/${workspaceId}/invitations/${invitationId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkspaceInvitation'],
    }),

    // Get current user's pending invitations
    getMyInvitations: builder.query<WorkspaceInvitation[], void>({
      query: () => 'workspaces/me/invitations/',
      providesTags: ['MyInvitation'],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useGetWorkspaceQuery,
  useUpdateWorkspaceMutation,
  useGetWorkspaceMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetWorkspaceInvitationsQuery,
  useSendInvitationMutation,
  useAcceptInvitationMutation,
  useCancelInvitationMutation,
  useGetMyInvitationsQuery,
} = workspaceApi;
