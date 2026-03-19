import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { FactorySection, CreateFactorySectionRequest, UpdateFactorySectionRequest, ListFactorySectionsParams } from '../../types/factorySection';

export const factorySectionsApi = createApi({
  reducerPath: 'factorySectionsApi',
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
  tagTypes: ['FactorySection'],
  endpoints: (builder) => ({
    getFactorySections: builder.query<FactorySection[], ListFactorySectionsParams>({
      query: ({ skip = 0, limit = 100, factory_id, search } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (factory_id) {
          params.append('factory_id', factory_id.toString());
        }
        if (search) {
          params.append('search', search);
        }
        return `/factory-sections?${params.toString()}`;
      },
      providesTags: ['FactorySection'],
    }),
    getFactorySectionById: builder.query<FactorySection, number>({
      query: (id) => `/factory-sections/${id}`,
      providesTags: (result, error, id) => [{ type: 'FactorySection', id }],
    }),
    createFactorySection: builder.mutation<FactorySection, CreateFactorySectionRequest>({
      query: (body) => ({
        url: '/factory-sections',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FactorySection'],
    }),
    updateFactorySection: builder.mutation<FactorySection, { id: number; data: UpdateFactorySectionRequest }>({
      query: ({ id, data }) => ({
        url: `/factory-sections/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'FactorySection', id }],
    }),
    deleteFactorySection: builder.mutation<void, number>({
      query: (id) => ({
        url: `/factory-sections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FactorySection'],
    }),
  }),
});

export const {
  useGetFactorySectionsQuery,
  useGetFactorySectionByIdQuery,
  useCreateFactorySectionMutation,
  useUpdateFactorySectionMutation,
  useDeleteFactorySectionMutation,
} = factorySectionsApi;
