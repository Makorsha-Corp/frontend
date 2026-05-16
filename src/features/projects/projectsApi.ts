import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project';

export interface ListProjectsParams {
  skip?: number;
  limit?: number;
  factory_id?: number;
  project_status?: string;
}

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], ListProjectsParams>({
      query: ({ skip = 0, limit = 100, factory_id, project_status } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (factory_id) {
          params.append('factory_id', factory_id.toString());
        }
        if (project_status) {
          params.append('project_status', project_status);
        }
        return `projects/?${params.toString()}`;
      },
      providesTags: ['Project'],
    }),
    getProjectById: builder.query<Project, number>({
      query: (id) => `projects/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation<Project, CreateProjectDTO>({
      query: (body) => ({
        url: 'projects/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation<Project, { id: number; data: UpdateProjectDTO }>({
      query: ({ id, data }) => ({
        url: `projects/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }, 'Project'],
    }),
    deleteProject: builder.mutation<Project, number>({
      query: (id) => ({
        url: `projects/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
