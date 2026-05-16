import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { Status } from '@/types/status';

export const statusesApi = createApi({
  reducerPath: 'statusesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Status'],
  endpoints: (builder) => ({
    getStatuses: builder.query<Status[], { skip?: number; limit?: number }>({
      query: ({ skip = 0, limit = 100 } = {}) =>
        `statuses/?skip=${skip}&limit=${limit}`,
      providesTags: ['Status'],
    }),
    getStatusById: builder.query<Status, number>({
      query: (id) => `statuses/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Status', id }],
    }),
  }),
});

export const { useGetStatusesQuery, useGetStatusByIdQuery } = statusesApi;
