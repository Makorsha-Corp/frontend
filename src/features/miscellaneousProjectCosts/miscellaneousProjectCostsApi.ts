import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { MiscellaneousProjectCost, CreateMiscellaneousProjectCostDTO, UpdateMiscellaneousProjectCostDTO } from '@/types/miscellaneousProjectCost';

export interface ListMiscellaneousProjectCostsParams {
  skip?: number;
  limit?: number;
  project_id?: number;
  project_component_id?: number;
}

export const miscellaneousProjectCostsApi = createApi({
  reducerPath: 'miscellaneousProjectCostsApi',
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
  tagTypes: ['MiscellaneousProjectCost'],
  endpoints: (builder) => ({
    getMiscellaneousProjectCosts: builder.query<MiscellaneousProjectCost[], ListMiscellaneousProjectCostsParams>({
      query: ({ skip = 0, limit = 100, project_id, project_component_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (project_id) {
          params.append('project_id', project_id.toString());
        }
        if (project_component_id) {
          params.append('project_component_id', project_component_id.toString());
        }
        return `/miscellaneous-project-costs/?${params.toString()}`;
      },
      providesTags: ['MiscellaneousProjectCost'],
    }),
    getMiscellaneousProjectCostById: builder.query<MiscellaneousProjectCost, number>({
      query: (id) => `/miscellaneous-project-costs/${id}/`,
      providesTags: (result, error, id) => [{ type: 'MiscellaneousProjectCost', id }],
    }),
    createMiscellaneousProjectCost: builder.mutation<MiscellaneousProjectCost, CreateMiscellaneousProjectCostDTO>({
      query: (body) => ({
        url: '/miscellaneous-project-costs/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MiscellaneousProjectCost'],
    }),
    updateMiscellaneousProjectCost: builder.mutation<MiscellaneousProjectCost, { id: number; data: UpdateMiscellaneousProjectCostDTO }>({
      query: ({ id, data }) => ({
        url: `/miscellaneous-project-costs/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'MiscellaneousProjectCost', id }, 'MiscellaneousProjectCost'],
    }),
    deleteMiscellaneousProjectCost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/miscellaneous-project-costs/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MiscellaneousProjectCost'],
    }),
  }),
});

export const {
  useGetMiscellaneousProjectCostsQuery,
  useGetMiscellaneousProjectCostByIdQuery,
  useCreateMiscellaneousProjectCostMutation,
  useUpdateMiscellaneousProjectCostMutation,
  useDeleteMiscellaneousProjectCostMutation,
} = miscellaneousProjectCostsApi;
