import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  WorkspaceShift,
  WorkspaceShiftCreate,
  WorkspaceShiftUpdate,
} from '@/types/workspaceShift';

export const workspaceShiftsApi = createApi({
  reducerPath: 'workspaceShiftsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkspaceShift'],
  endpoints: (builder) => ({
    getWorkspaceShifts: builder.query<WorkspaceShift[], { activeOnly?: boolean } | void>({
      query: (args) => {
        const activeOnly = args?.activeOnly ?? false;
        return `workspace-shifts/?active_only=${activeOnly ? 'true' : 'false'}`;
      },
      providesTags: ['WorkspaceShift'],
    }),
    createWorkspaceShift: builder.mutation<WorkspaceShift, WorkspaceShiftCreate>({
      query: (body) => ({
        url: 'workspace-shifts/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkspaceShift'],
    }),
    updateWorkspaceShift: builder.mutation<
      WorkspaceShift,
      { id: number; data: WorkspaceShiftUpdate }
    >({
      query: ({ id, data }) => ({
        url: `workspace-shifts/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['WorkspaceShift'],
    }),
    deleteWorkspaceShift: builder.mutation<void, number>({
      query: (id) => ({
        url: `workspace-shifts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkspaceShift'],
    }),
  }),
});

export const {
  useGetWorkspaceShiftsQuery,
  useCreateWorkspaceShiftMutation,
  useUpdateWorkspaceShiftMutation,
  useDeleteWorkspaceShiftMutation,
} = workspaceShiftsApi;
