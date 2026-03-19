import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { ProjectComponentItem, CreateProjectComponentItemDTO, UpdateProjectComponentItemDTO } from '@/types/projectComponentItem';

export interface ListProjectComponentItemsParams {
  skip?: number;
  limit?: number;
  project_component_id?: number;
}

export const projectComponentItemsApi = createApi({
  reducerPath: 'projectComponentItemsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const workspaceId = state.auth.workspace?.id;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (workspaceId) {
        headers.set('X-Workspace-ID', workspaceId.toString());
      }
      return headers;
    },
  }),
  tagTypes: ['ProjectComponentItem'],
  endpoints: (builder) => ({
    getProjectComponentItems: builder.query<ProjectComponentItem[], ListProjectComponentItemsParams>({
      query: ({ skip = 0, limit = 100, project_component_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (project_component_id) {
          params.append('project_component_id', project_component_id.toString());
        }
        return `/project-component-items/?${params.toString()}`;
      },
      providesTags: ['ProjectComponentItem'],
    }),
    getProjectComponentItemById: builder.query<ProjectComponentItem, number>({
      query: (id) => `/project-component-items/${id}/`,
      providesTags: (result, error, id) => [{ type: 'ProjectComponentItem', id }],
    }),
    createProjectComponentItem: builder.mutation<ProjectComponentItem, CreateProjectComponentItemDTO>({
      query: (body) => ({
        url: '/project-component-items/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProjectComponentItem'],
    }),
    updateProjectComponentItem: builder.mutation<ProjectComponentItem, { id: number; data: UpdateProjectComponentItemDTO }>({
      query: ({ id, data }) => ({
        url: `/project-component-items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProjectComponentItem', id }, 'ProjectComponentItem'],
    }),
    deleteProjectComponentItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-component-items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectComponentItem'],
    }),
  }),
});

export const {
  useGetProjectComponentItemsQuery,
  useGetProjectComponentItemByIdQuery,
  useCreateProjectComponentItemMutation,
  useUpdateProjectComponentItemMutation,
  useDeleteProjectComponentItemMutation,
} = projectComponentItemsApi;
