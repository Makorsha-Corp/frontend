import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
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
  tag_code?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export const accountTagsApi = createApi({
  reducerPath: 'accountTagsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AccountTag'],
  endpoints: (builder) => ({
    getTags: builder.query<AccountTag[], void>({
      query: () => 'account-tags/',
      providesTags: ['AccountTag'],
    }),
    getSystemTags: builder.query<AccountTag[], void>({
      query: () => 'account-tags/system/',
      providesTags: ['AccountTag'],
    }),
    createTag: builder.mutation<AccountTag, CreateTagRequest>({
      query: (body) => ({
        url: 'account-tags/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AccountTag'],
    }),
    updateTag: builder.mutation<AccountTag, { id: number; data: UpdateTagRequest }>({
      query: ({ id, data }) => ({
        url: `account-tags/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AccountTag'],
    }),
    deleteTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `account-tags/${id}/`,
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
