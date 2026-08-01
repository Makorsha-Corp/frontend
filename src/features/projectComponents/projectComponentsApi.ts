import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { invalidateProjectEventsOnFulfilled } from '@/features/projects/invalidateProjectEvents';
import type { ProjectComponent, CreateProjectComponentDTO, UpdateProjectComponentDTO } from '@/types/projectComponent';

export interface ListProjectComponentsParams {
  skip?: number;
  limit?: number;
  project_id?: number;
}

export const projectComponentsApi = createApi({
  reducerPath: 'projectComponentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ProjectComponent'],
  endpoints: (builder) => ({
    getProjectComponents: builder.query<ProjectComponent[], ListProjectComponentsParams>({
      query: ({ skip = 0, limit = 100, project_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (project_id) {
          params.append('project_id', project_id.toString());
        }
        return `project-components/?${params.toString()}`;
      },
      providesTags: ['ProjectComponent'],
    }),
    getProjectComponentById: builder.query<ProjectComponent, number>({
      query: (id) => `project-components/${id}/`,
      providesTags: (result, error, id) => [{ type: 'ProjectComponent', id }],
    }),
    createProjectComponent: builder.mutation<ProjectComponent, CreateProjectComponentDTO>({
      query: (body) => ({
        url: 'project-components/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ProjectComponent'],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
    updateProjectComponent: builder.mutation<ProjectComponent, { id: number; data: UpdateProjectComponentDTO }>({
      query: ({ id, data }) => ({
        url: `project-components/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ProjectComponent', id }, 'ProjectComponent'],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
    deleteProjectComponent: builder.mutation<void, number>({
      query: (id) => ({
        url: `project-components/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectComponent'],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
  }),
});

export const {
  useGetProjectComponentsQuery,
  useGetProjectComponentByIdQuery,
  useCreateProjectComponentMutation,
  useUpdateProjectComponentMutation,
  useDeleteProjectComponentMutation,
} = projectComponentsApi;
