import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { invalidateProjectEventsOnFulfilled } from '@/features/projects/invalidateProjectEvents';
import type {
  ProjectComponentNote,
  CreateProjectComponentNoteDTO,
  UpdateProjectComponentNoteDTO,
} from '@/types/projectComponentNote';

export interface ListProjectComponentNotesParams {
  skip?: number;
  limit?: number;
  project_component_id?: number;
}

export const projectComponentNotesApi = createApi({
  reducerPath: 'projectComponentNotesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ProjectComponentNote'],
  endpoints: (builder) => ({
    getProjectComponentNotes: builder.query<ProjectComponentNote[], ListProjectComponentNotesParams>({
      query: ({ skip = 0, limit = 100, project_component_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (project_component_id != null) {
          params.append('project_component_id', project_component_id.toString());
        }
        return `project-component-notes/?${params.toString()}`;
      },
      providesTags: (result, _error, arg) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ProjectComponentNote' as const, id })),
              { type: 'ProjectComponentNote', id: `LIST-${arg.project_component_id ?? 'all'}` },
            ]
          : [{ type: 'ProjectComponentNote', id: `LIST-${arg.project_component_id ?? 'all'}` }],
    }),
    createProjectComponentNote: builder.mutation<ProjectComponentNote, CreateProjectComponentNoteDTO>({
      query: (body) => ({
        url: 'project-component-notes/',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'ProjectComponentNote', id: `LIST-${arg.project_component_id}` },
        'ProjectComponentNote',
      ],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
    updateProjectComponentNote: builder.mutation<
      ProjectComponentNote,
      { id: number; data: UpdateProjectComponentNoteDTO; project_component_id: number }
    >({
      query: ({ id, data }) => ({
        url: `project-component-notes/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id, project_component_id }) => [
        { type: 'ProjectComponentNote', id },
        { type: 'ProjectComponentNote', id: `LIST-${project_component_id}` },
      ],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
    deleteProjectComponentNote: builder.mutation<void, { id: number; project_component_id: number }>({
      query: ({ id }) => ({
        url: `project-component-notes/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id, project_component_id }) => [
        { type: 'ProjectComponentNote', id },
        { type: 'ProjectComponentNote', id: `LIST-${project_component_id}` },
      ],
      async onQueryStarted(arg, api) {
        await invalidateProjectEventsOnFulfilled(arg, api);
      },
    }),
  }),
});

export const {
  useGetProjectComponentNotesQuery,
  useCreateProjectComponentNoteMutation,
  useUpdateProjectComponentNoteMutation,
  useDeleteProjectComponentNoteMutation,
} = projectComponentNotesApi;
