import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
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
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ItemTag'],
  endpoints: (builder) => ({
    getTags: builder.query<ItemTag[], void>({
      query: () => 'item-tags/',
      providesTags: ['ItemTag'],
    }),
    getSystemTags: builder.query<ItemTag[], void>({
      query: () => 'item-tags/system/',
      providesTags: ['ItemTag'],
    }),
    createTag: builder.mutation<ItemTag, CreateTagRequest>({
      query: (body) => ({
        url: 'item-tags/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ItemTag'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newTag } = await queryFulfilled;
          dispatch(
            itemTagsApi.util.updateQueryData('getTags', undefined, (draft) => {
              if (!draft.some((tag) => tag.id === newTag.id)) {
                draft.push(newTag);
              }
            })
          );
        } catch {
          /* noop */
        }
      },
    }),
    updateTag: builder.mutation<ItemTag, { id: number; data: UpdateTagRequest }>({
      query: ({ id, data }) => ({
        url: `item-tags/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ItemTag'],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedTag } = await queryFulfilled;
          dispatch(
            itemTagsApi.util.updateQueryData('getTags', undefined, (draft) => {
              const index = draft.findIndex((tag) => tag.id === id);
              if (index !== -1) {
                draft[index] = updatedTag;
              }
            })
          );
        } catch {
          /* noop */
        }
      },
    }),
    deleteTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `item-tags/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ItemTag'],
      async onQueryStarted(tagId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            itemTagsApi.util.updateQueryData('getTags', undefined, (draft) => {
              const index = draft.findIndex((tag) => tag.id === tagId);
              if (index !== -1) {
                draft.splice(index, 1);
              }
            })
          );
        } catch {
          /* noop */
        }
      },
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
