/**
 * RTK Query API for Items
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { Item, CreateItemRequest, UpdateItemRequest, ListItemsParams } from '@/types/item';

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const workspaceId = state.auth.workspace?.id;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Items API may require workspace context
      if (workspaceId) {
        headers.set('X-Workspace-ID', workspaceId.toString());
      }

      return headers;
    },
  }),
  tagTypes: ['Item'],
  endpoints: (builder) => ({
    // Get all items with pagination and search
    getItems: builder.query<Item[], ListItemsParams>({
      query: ({ skip = 0, limit = 100, search }) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
        });

        if (search) {
          params.append('search', search);
        }

        return `/items/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' },
            ]
          : [{ type: 'Item', id: 'LIST' }],
    }),

    // Get single item by ID
    getItemById: builder.query<Item, number>({
      query: (id) => `/items/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Item', id }],
    }),

    // Create new item
    createItem: builder.mutation<Item, CreateItemRequest>({
      query: (body) => ({
        url: '/items/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }],
    }),

    // Update existing item
    updateItem: builder.mutation<Item, { id: number; data: UpdateItemRequest }>({
      query: ({ id, data }) => ({
        url: `/items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' },
      ],
    }),

    // Delete item (soft delete)
    deleteItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemByIdQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemsApi;
