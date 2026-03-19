import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';

export interface ProjectComponentTotalCostResponse {
  project_component_id: number;
  total_cost: number;
  total_quantity?: number;
  entry_count?: number;
}

export const ledgersApi = createApi({
  reducerPath: 'ledgersApi',
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
  tagTypes: ['ProjectComponentCost'],
  endpoints: (builder) => ({
    getProjectComponentTotalCost: builder.query<ProjectComponentTotalCostResponse, number>({
      query: (projectComponentId) =>
        `/ledgers/project-component/${projectComponentId}/total-cost`,
      providesTags: (result, error, id) => [{ type: 'ProjectComponentCost', id }],
    }),
  }),
});

export const { useGetProjectComponentTotalCostQuery } = ledgersApi;
