import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { AccountTag } from '../../types/accountTag';

export interface CreateTagRequest {
  name: string;
  tag_code?: string | null;  // Optional, auto-generated from name
  color?: string | null;
  icon?: string | null;
  description?: string | null;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export const accountTagsApi = createApi({
  reducerPath: 'accountTagsApi',
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
  tagTypes: ['AccountTag'],
  endpoints: (builder) => ({
    getTags: builder.query<AccountTag[], void>({
      query: () => '/account-tags',
      providesTags: ['AccountTag'],
    }),
    getSystemTags: builder.query<AccountTag[], void>({
      query: () => '/account-tags/system',
      providesTags: ['AccountTag'],
    }),
    createTag: builder.mutation<AccountTag, CreateTagRequest>({
      query: (body) => ({
        url: '/account-tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AccountTag'],
    }),
    updateTag: builder.mutation<AccountTag, { id: number; data: UpdateTagRequest }>({
      query: ({ id, data }) => ({
        url: `/account-tags/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AccountTag'],
    }),
    deleteTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/account-tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AccountTag'],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useGetSystemTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = accountTagsApi;
