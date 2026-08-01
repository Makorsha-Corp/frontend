import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { invalidateProjectEventsOnFulfilled } from '@/features/projects/invalidateProjectEvents';
import type { ProjectComponentTask, CreateProjectComponentTaskDTO, UpdateProjectComponentTaskDTO } from '@/types/projectComponentTask';

export interface ListProjectComponentTasksParams {
  skip?: number;
  limit?: number;
  project_component_id?: number;
  is_note?: boolean;
}

export const projectComponentTasksApi = createApi({
  reducerPath: 'projectComponentTasksApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ProjectComponentTask'],
  endpoints: (builder) => ({
    getProjectComponentTasks: builder.query<ProjectComponentTask[], ListProjectComponentTasksParams>({
      query: ({ skip = 0, limit = 100, project_component_id, is_note } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (project_component_id != null) {
          params.append('project_component_id', project_component_id.toString());
        }
        if (is_note != null) {
          params.append('is_note', String(is_note));
        }
        return `project-component-tasks/?${params.toString()}`;
      },
      providesTags: (result, _error, arg) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ProjectComponentTask' as const, id })),
              {
                type: 'ProjectComponentTask',
                id: `LIST-${arg.project_component_id ?? 'all'}-${arg.is_note ?? 'all'}`,
              },
            ]
          : [
              {
                type: 'ProjectComponentTask',
                id: `LIST-${arg.project_component_id ?? 'all'}-${arg.is_note ?? 'all'}`,
              },
            ],
    }),
    getProjectComponentTaskById: builder.query<ProjectComponentTask, number>({
      query: (id) => `project-component-tasks/${id}/`,
      providesTags: (result, error, id) => [{ type: 'ProjectComponentTask', id }],
    }),
    createProjectComponentTask: builder.mutation<ProjectComponentTask, CreateProjectComponentTaskDTO>({
      query: (body) => ({
        url: 'project-component-tasks/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        {
          type: 'ProjectComponentTask',
          id: `LIST-${arg.project_component_id}-all`,
        },
        {
          type: 'ProjectComponentTask',
          id: `LIST-${arg.project_component_id}-false`,
        },
        'ProjectComponentTask',
      ],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
    updateProjectComponentTask: builder.mutation<ProjectComponentTask, { id: number; data: UpdateProjectComponentTaskDTO }>({
      query: ({ id, data }) => ({
        url: `project-component-tasks/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProjectComponentTask', id }, 'ProjectComponentTask'],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
    deleteProjectComponentTask: builder.mutation<void, number>({
      query: (id) => ({
        url: `project-component-tasks/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectComponentTask'],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
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
