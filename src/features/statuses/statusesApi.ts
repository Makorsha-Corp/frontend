import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { Status } from '@/types/status';

export const statusesApi = createApi({
  reducerPath: 'statusesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const workspaceId = state.auth.workspace?.id;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (workspaceId) headers.set('X-Workspace-ID', workspaceId.toString());
      return headers;
    },
  }),
  tagTypes: ['Status'],
  endpoints: (builder) => ({
    getStatuses: builder.query<Status[], { skip?: number; limit?: number }>({
      query: ({ skip = 0, limit = 100 } = {}) =>
        `/statuses?skip=${skip}&limit=${limit}`,
      providesTags: ['Status'],
    }),
    getStatusById: builder.query<Status, number>({
      query: (id) => `/statuses/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Status', id }],
    }),
  }),
});

export const { useGetStatusesQuery, useGetStatusByIdQuery } = statusesApi;
