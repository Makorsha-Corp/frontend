import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import { ItemTag } from '../../types/itemTag';

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

export const itemTagsApi = createApi({
  reducerPath: 'itemTagsApi',
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
  tagTypes: ['ItemTag'],
  endpoints: (builder) => ({
    getTags: builder.query<ItemTag[], void>({
      query: () => '/item-tags',
      providesTags: ['ItemTag'],
    }),
    getSystemTags: builder.query<ItemTag[], void>({
      query: () => '/item-tags/system',
      providesTags: ['ItemTag'],
    }),
    createTag: builder.mutation<ItemTag, CreateTagRequest>({
      query: (body) => ({
        url: '/item-tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ItemTag'],
    }),
    updateTag: builder.mutation<ItemTag, { id: number; data: UpdateTagRequest }>({
      query: ({ id, data }) => ({
        url: `/item-tags/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ItemTag'],
    }),
    deleteTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/item-tags/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ItemTag'],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useGetSystemTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} = itemTagsApi;
