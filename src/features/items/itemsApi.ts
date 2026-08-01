/**
 * RTK Query API for Items
 */
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { Item, CreateItemRequest, UpdateItemRequest, ListItemsParams, ListItemsPageParams, ItemsListResponse, SimilarItemsResponse, GetSimilarItemsParams } from '@/types/item';
import type { ItemSummary } from '@/types/itemSummary';
import type { GetItemOrdersParams, ItemOrdersListResponse } from '@/types/itemOrders';
import { invalidateItemTags } from './invalidateItemTags';

function buildItemsQueryString({
  skip = 0,
  limit = 100,
  search,
  unit,
  tag_ids,
}: ListItemsPageParams): string {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  if (search) params.append('search', search);
  if (unit) params.append('unit', unit);
  tag_ids?.forEach((tagId) => params.append('tag_ids', String(tagId)));

  return params.toString();
}

export const itemsApi = createApi({
  reducerPath: 'itemsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Item', 'ItemSummary', 'ItemOrders'],
  endpoints: (builder) => ({
    // Get all items with pagination and search
    getItems: builder.query<Item[], ListItemsParams>({
      query: ({ skip = 0, limit = 100, search }) =>
        `items/?${buildItemsQueryString({ skip, limit, search })}`,
      transformResponse: (response: ItemsListResponse) => response.items,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' },
            ]
          : [{ type: 'Item', id: 'LIST' }],
    }),

    getItemsPage: builder.query<ItemsListResponse, ListItemsPageParams>({
      query: (args) => `items/?${buildItemsQueryString(args)}`,
      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(({ id }) => ({ type: 'Item' as const, id })),
              { type: 'Item', id: 'LIST' },
            ]
          : [{ type: 'Item', id: 'LIST' }],
    }),

    getItemUnits: builder.query<string[], void>({
      query: () => 'items/units/',
      providesTags: [{ type: 'Item', id: 'UNITS' }],
    }),

    // Get single item by ID
    getItemById: builder.query<Item, number>({
      query: (id) => `items/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Item', id }],
    }),

    getItemSummary: builder.query<ItemSummary, number>({
      query: (id) => `items/${id}/summary/`,
      providesTags: (_result, _error, id) => [{ type: 'ItemSummary', id }],
    }),

    getItemOrders: builder.query<ItemOrdersListResponse, GetItemOrdersParams>({
      query: ({
        itemId,
        skip = 0,
        limit = 50,
        order_type,
        from_date,
        to_date,
        excludePurchaseOrderId,
      }) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
        });
        if (order_type) params.append('order_type', order_type);
        if (from_date) params.append('from_date', from_date);
        if (to_date) params.append('to_date', to_date);
        if (excludePurchaseOrderId != null) {
          params.append('exclude_purchase_order_id', excludePurchaseOrderId.toString());
        }
        return `items/${itemId}/orders/?${params.toString()}`;
      },
      providesTags: (_result, _error, { itemId }) => [{ type: 'ItemOrders', id: itemId }],
    }),

    getSimilarItems: builder.query<SimilarItemsResponse, GetSimilarItemsParams>({
      query: ({ name, limit = 5 }) => {
        const params = new URLSearchParams({
          name,
          limit: limit.toString(),
        });
        return `items/similar/?${params.toString()}`;
      },
    }),

    // Create new item
    createItem: builder.mutation<Item, CreateItemRequest>({
      query: (body) => ({
        url: 'items/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Item', id: 'LIST' }, { type: 'Item', id: 'UNITS' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateItemTags(dispatch);
        } catch {
          /* noop */
        }
      },
    }),

    // Update existing item
    updateItem: builder.mutation<Item, { id: number; data: UpdateItemRequest }>({
      query: ({ id, data }) => ({
        url: `items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' },
        { type: 'Item', id: 'UNITS' },
        { type: 'ItemSummary', id },
        { type: 'ItemOrders', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateItemTags(dispatch);
        } catch {
          /* noop */
        }
      },
    }),

    // Delete item (soft delete)
    deleteItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' },
        { type: 'Item', id: 'UNITS' },
        { type: 'ItemSummary', id },
        { type: 'ItemOrders', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateItemTags(dispatch);
        } catch {
          /* noop */
        }
      },
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemsPageQuery,
  useGetItemUnitsQuery,
  useGetItemByIdQuery,
  useGetItemSummaryQuery,
  useGetItemOrdersQuery,
  useLazyGetSimilarItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemsApi;
