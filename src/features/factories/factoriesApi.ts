import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { Factory, CreateFactoryRequest, UpdateFactoryRequest, ListFactoriesParams } from '../../types/factory';

export const factoriesApi = createApi({
  reducerPath: 'factoriesApi',
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
  tagTypes: ['Factory'],
  endpoints: (builder) => ({
    getFactories: builder.query<Factory[], ListFactoriesParams>({
      query: ({ skip = 0, limit = 100, search } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (search) {
          params.append('search', search);
        }
        return `/factories?${params.toString()}`;
      },
      providesTags: ['Factory'],
    }),
    getFactoryById: builder.query<Factory, number>({
      query: (id) => `/factories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Factory', id }],
    }),
    createFactory: builder.mutation<Factory, CreateFactoryRequest>({
      query: (body) => ({
        url: '/factories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Factory'],
    }),
    updateFactory: builder.mutation<Factory, { id: number; data: UpdateFactoryRequest }>({
      query: ({ id, data }) => ({
        url: `/factories/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Factory', id }],
    }),
    deleteFactory: builder.mutation<void, number>({
      query: (id) => ({
        url: `/factories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Factory'],
    }),
  }),
});

export const {
  useGetFactoriesQuery,
  useGetFactoryByIdQuery,
  useCreateFactoryMutation,
  useUpdateFactoryMutation,
  useDeleteFactoryMutation,
} = factoriesApi;
