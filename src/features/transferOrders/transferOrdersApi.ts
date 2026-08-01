import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  TransferOrder,
  TransferOrderItem,
  CreateTransferOrder,
  UpdateTransferOrder,
  CreateTransferOrderItem,
  UpdateTransferOrderItem,
  ListTransferOrdersHubParams,
  TransferOrderListResponse,
  TransferOrderHubStatsResponse,
  TransferOrderApproversList,
  TransferOrderApprover,
  TransferOrderEvent,
} from '../../types/transferOrder';
import { invalidateIncomingSummaryCache, invalidateInventoryStockCache } from '@/features/cache/invalidateInventoryStockCache';
import {
  transferOrderListCacheTags,
  transferOrderCacheTagsForMutation,
  TRANSFER_ORDER_LIST_TAG,
  TRANSFER_ORDER_HUB_LIST_TAG,
  TRANSFER_ORDER_HUB_STATS_TAG,
} from '@/features/cache/orderHubCacheTags';
import { purchaseOrdersApi } from '../purchaseOrders/purchaseOrdersApi';

function appendTransferOrderHubFilters(
  qs: URLSearchParams,
  filters: Omit<ListTransferOrdersHubParams, 'skip' | 'limit'>,
) {
  if (filters.date_from) qs.append('date_from', filters.date_from);
  if (filters.date_to) qs.append('date_to', filters.date_to);
  filters.status_ids?.forEach((id) => qs.append('status_ids', String(id)));
  if (filters.factory_id != null) qs.append('factory_id', String(filters.factory_id));
  if (filters.source_location_type) qs.append('source_location_type', filters.source_location_type);
  if (filters.destination_location_type) {
    qs.append('destination_location_type', filters.destination_location_type);
  }
  if (filters.search) qs.append('search', filters.search);
  if (filters.exclude_complete) qs.append('exclude_complete', 'true');
}

function buildTransferOrderHubQueryString(params: ListTransferOrdersHubParams): string {
  const { skip = 0, limit = 50, ...filters } = params;
  const qs = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  appendTransferOrderHubFilters(qs, filters);
  return qs.toString();
}

function buildTransferOrderHubStatsQueryString(
  filters: Omit<ListTransferOrdersHubParams, 'skip' | 'limit'>,
): string {
  const qs = new URLSearchParams();
  appendTransferOrderHubFilters(qs, filters);
  return qs.toString();
}

export const transferOrdersApi = createApi({
  reducerPath: 'transferOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TransferOrder', 'TransferOrderItem', 'TransferOrderApprovers', 'TransferOrderEvents'],
  endpoints: (builder) => ({
    getTransferOrders: builder.query<TransferOrder[], ListTransferOrdersHubParams>({
      query: (args = {}) => `transfer-orders/?${buildTransferOrderHubQueryString(args)}`,
      transformResponse: (response: TransferOrderListResponse) => response.items,
      providesTags: [TRANSFER_ORDER_LIST_TAG],
    }),
    getTransferOrdersPage: builder.query<TransferOrderListResponse, ListTransferOrdersHubParams>({
      query: (args) => `transfer-orders/?${buildTransferOrderHubQueryString(args)}`,
      providesTags: [TRANSFER_ORDER_HUB_LIST_TAG],
    }),
    getTransferOrderHubStats: builder.query<
      TransferOrderHubStatsResponse,
      Omit<ListTransferOrdersHubParams, 'skip' | 'limit'>
    >({
      query: (args) => `transfer-orders/stats/?${buildTransferOrderHubStatsQueryString(args)}`,
      providesTags: [TRANSFER_ORDER_HUB_STATS_TAG],
    }),
    getTransferOrderById: builder.query<TransferOrder, number>({
      query: (id) => `transfer-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'TransferOrder', id }],
    }),
    createTransferOrder: builder.mutation<TransferOrder, CreateTransferOrder>({
      query: (body) => ({ url: 'transfer-orders/', method: 'POST', body }),
      invalidatesTags: transferOrderListCacheTags,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    updateTransferOrder: builder.mutation<TransferOrder, { id: number; data: UpdateTransferOrder }>({
      query: ({ id, data }) => ({ url: `transfer-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        ...transferOrderCacheTagsForMutation(id),
        { type: 'TransferOrderEvents', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    markTransferOrderComplete: builder.mutation<TransferOrder, number>({
      query: (id) => ({ url: `transfer-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        ...transferOrderCacheTagsForMutation(id),
        { type: 'TransferOrderEvents', id },
        { type: 'TransferOrderItem', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
          invalidateInventoryStockCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    deleteTransferOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `transfer-orders/${id}/`, method: 'DELETE' }),
      invalidatesTags: transferOrderListCacheTags,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    getTransferOrderApprovers: builder.query<TransferOrderApproversList, number>({
      query: (toId) => `transfer-orders/${toId}/approvers/`,
      providesTags: (_r, _e, toId) => [{ type: 'TransferOrderApprovers', id: toId }],
    }),
    addTransferOrderApprover: builder.mutation<TransferOrderApprover, { toId: number; user_id: number }>({
      query: ({ toId, user_id }) => ({
        url: `transfer-orders/${toId}/approvers/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { toId }) => [
        { type: 'TransferOrderApprovers', id: toId },
        { type: 'TransferOrderEvents', id: toId },
      ],
    }),
    removeTransferOrderApprover: builder.mutation<void, { toId: number; userId: number }>({
      query: ({ toId, userId }) => ({
        url: `transfer-orders/${toId}/approvers/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { toId }) => [
        { type: 'TransferOrderApprovers', id: toId },
        { type: 'TransferOrderEvents', id: toId },
      ],
    }),
    approveTransferOrder: builder.mutation<TransferOrderApprover, number>({
      query: (toId) => ({ url: `transfer-orders/${toId}/approvers/me/approve/`, method: 'POST' }),
      invalidatesTags: (_r, _e, toId) => [
        { type: 'TransferOrderApprovers', id: toId },
        { type: 'TransferOrderEvents', id: toId },
        ...transferOrderCacheTagsForMutation(toId),
      ],
    }),
    unapproveTransferOrder: builder.mutation<TransferOrderApprover, number>({
      query: (toId) => ({ url: `transfer-orders/${toId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, toId) => [
        { type: 'TransferOrderApprovers', id: toId },
        { type: 'TransferOrderEvents', id: toId },
        ...transferOrderCacheTagsForMutation(toId),
      ],
    }),
    getTransferOrderEvents: builder.query<TransferOrderEvent[], number>({
      query: (toId) => `transfer-orders/${toId}/events/`,
      providesTags: (_r, _e, toId) => [{ type: 'TransferOrderEvents', id: toId }],
    }),
    getTransferOrderItems: builder.query<TransferOrderItem[], number>({
      query: (toId) => `transfer-orders/${toId}/items/`,
      providesTags: (_r, _e, toId) => [{ type: 'TransferOrderItem', id: toId }],
    }),
    addTransferOrderItem: builder.mutation<TransferOrderItem, { toId: number; data: CreateTransferOrderItem }>({
      query: ({ toId, data }) => ({ url: `transfer-orders/${toId}/items/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { toId }) => [
        { type: 'TransferOrderItem', id: toId },
        { type: 'TransferOrderEvents', id: toId },
        ...transferOrderListCacheTags,
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    updateTransferOrderItem: builder.mutation<TransferOrderItem, { itemId: number; data: UpdateTransferOrderItem; toId?: number }>({
      query: ({ itemId, data }) => ({ url: `transfer-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { toId }) => [
        'TransferOrderItem',
        ...(toId != null ? transferOrderCacheTagsForMutation(toId) : transferOrderListCacheTags),
        ...(toId != null ? [{ type: 'TransferOrderEvents' as const, id: toId }] : []),
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
    removeTransferOrderItem: builder.mutation<void, { itemId: number; toId: number }>({
      query: ({ itemId }) => ({ url: `transfer-orders/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { toId }) => [
        { type: 'TransferOrderItem', id: toId },
        { type: 'TransferOrderEvents', id: toId },
        ...transferOrderListCacheTags,
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
          invalidateIncomingSummaryCache(dispatch);
        } catch {
          /* mutation failed */
        }
      },
    }),
  }),
});

export const {
  useGetTransferOrdersQuery,
  useGetTransferOrdersPageQuery,
  useGetTransferOrderHubStatsQuery,
  useGetTransferOrderByIdQuery,
  useCreateTransferOrderMutation,
  useUpdateTransferOrderMutation,
  useMarkTransferOrderCompleteMutation,
  useDeleteTransferOrderMutation,
  useGetTransferOrderApproversQuery,
  useAddTransferOrderApproverMutation,
  useRemoveTransferOrderApproverMutation,
  useApproveTransferOrderMutation,
  useUnapproveTransferOrderMutation,
  useGetTransferOrderEventsQuery,
  useGetTransferOrderItemsQuery,
  useAddTransferOrderItemMutation,
  useUpdateTransferOrderItemMutation,
  useRemoveTransferOrderItemMutation,
} = transferOrdersApi;
