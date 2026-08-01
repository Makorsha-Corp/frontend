import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  Project,
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectMember,
  ProjectMembersList,
  ProjectEvent,
  ProjectVisibility,
} from '@/types/project';

export interface ListProjectsParams {
  skip?: number;
  limit?: number;
  factory_id?: number;
  project_status?: string;
}

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Project', 'ProjectMembers', 'ProjectEvents'],
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
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id },
        'Project',
        { type: 'ProjectEvents', id },
      ],
    }),
    deleteProject: builder.mutation<Project, number>({
      query: (id) => ({
        url: `projects/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
    getProjectMembers: builder.query<ProjectMembersList, number>({
      query: (projectId) => `projects/${projectId}/members/`,
      providesTags: (_r, _e, projectId) => [{ type: 'ProjectMembers', id: projectId }],
    }),
    addProjectMember: builder.mutation<ProjectMember, { projectId: number; user_id: number }>({
      query: ({ projectId, user_id }) => ({
        url: `projects/${projectId}/members/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { projectId }) => [
        { type: 'ProjectMembers', id: projectId },
        { type: 'ProjectEvents', id: projectId },
      ],
    }),
    removeProjectMember: builder.mutation<void, { projectId: number; userId: number }>({
      query: ({ projectId, userId }) => ({
        url: `projects/${projectId}/members/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { projectId }) => [
        { type: 'ProjectMembers', id: projectId },
        { type: 'ProjectEvents', id: projectId },
      ],
    }),
    setProjectVisibility: builder.mutation<Project, { projectId: number; visibility: ProjectVisibility }>({
      query: ({ projectId, visibility }) => ({
        url: `projects/${projectId}/visibility/`,
        method: 'PATCH',
        body: { visibility },
      }),
      invalidatesTags: (_r, _e, { projectId }) => [
        { type: 'Project', id: projectId },
        'Project',
        { type: 'ProjectEvents', id: projectId },
      ],
    }),
    getProjectEvents: builder.query<ProjectEvent[], number>({
      query: (projectId) => `projects/${projectId}/events/`,
      providesTags: (_r, _e, projectId) => [{ type: 'ProjectEvents', id: projectId }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
  useSetProjectVisibilityMutation,
  useGetProjectEventsQuery,
} = projectsApi;
