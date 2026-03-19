import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { ProjectComponentTask, CreateProjectComponentTaskDTO, UpdateProjectComponentTaskDTO } from '@/types/projectComponentTask';

export interface ListProjectComponentTasksParams {
  skip?: number;
  limit?: number;
  project_component_id?: number;
}

export const projectComponentTasksApi = createApi({
  reducerPath: 'projectComponentTasksApi',
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
  tagTypes: ['ProjectComponentTask'],
  endpoints: (builder) => ({
    getProjectComponentTasks: builder.query<ProjectComponentTask[], ListProjectComponentTasksParams>({
      query: ({ skip = 0, limit = 100, project_component_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (project_component_id) {
          params.append('project_component_id', project_component_id.toString());
        }
        return `/project-component-tasks/?${params.toString()}`;
      },
      providesTags: ['ProjectComponentTask'],
    }),
    getProjectComponentTaskById: builder.query<ProjectComponentTask, number>({
      query: (id) => `/project-component-tasks/${id}/`,
      providesTags: (result, error, id) => [{ type: 'ProjectComponentTask', id }],
    }),
    createProjectComponentTask: builder.mutation<ProjectComponentTask, CreateProjectComponentTaskDTO>({
      query: (body) => ({
        url: '/project-component-tasks/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProjectComponentTask'],
    }),
    updateProjectComponentTask: builder.mutation<ProjectComponentTask, { id: number; data: UpdateProjectComponentTaskDTO }>({
      query: ({ id, data }) => ({
        url: `/project-component-tasks/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProjectComponentTask', id }, 'ProjectComponentTask'],
    }),
    deleteProjectComponentTask: builder.mutation<void, number>({
      query: (id) => ({
        url: `/project-component-tasks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectComponentTask'],
    }),
  }),
});

export const {
  useGetProjectComponentTasksQuery,
  useGetProjectComponentTaskByIdQuery,
  useCreateProjectComponentTaskMutation,
  useUpdateProjectComponentTaskMutation,
  useDeleteProjectComponentTaskMutation,
} = projectComponentTasksApi;
