import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  TransferOrder,
  TransferOrderItem,
  CreateTransferOrder,
  UpdateTransferOrder,
  CreateTransferOrderItem,
  UpdateTransferOrderItem,
  ListTransferOrdersParams,
  TransferOrderApproversList,
  TransferOrderApprover,
  TransferOrderEvent,
} from '../../types/transferOrder';
import { purchaseOrdersApi } from '../purchaseOrders/purchaseOrdersApi';

export const transferOrdersApi = createApi({
  reducerPath: 'transferOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TransferOrder', 'TransferOrderItem', 'TransferOrderApprovers', 'TransferOrderEvents'],
  endpoints: (builder) => ({
    getTransferOrders: builder.query<TransferOrder[], ListTransferOrdersParams>({
      query: ({ skip = 0, limit = 100 } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        return `transfer-orders/?${params.toString()}`;
      },
      providesTags: ['TransferOrder'],
    }),
    getTransferOrderById: builder.query<TransferOrder, number>({
      query: (id) => `transfer-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'TransferOrder', id }],
    }),
    createTransferOrder: builder.mutation<TransferOrder, CreateTransferOrder>({
      query: (body) => ({ url: 'transfer-orders/', method: 'POST', body }),
      invalidatesTags: ['TransferOrder'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    updateTransferOrder: builder.mutation<TransferOrder, { id: number; data: UpdateTransferOrder }>({
      query: ({ id, data }) => ({ url: `transfer-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'TransferOrder', id },
        'TransferOrder',
        { type: 'TransferOrderEvents', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    markTransferOrderComplete: builder.mutation<TransferOrder, number>({
      query: (id) => ({ url: `transfer-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'TransferOrder', id },
        'TransferOrder',
        { type: 'TransferOrderEvents', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    deleteTransferOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `transfer-orders/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['TransferOrder'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
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
      ],
    }),
    unapproveTransferOrder: builder.mutation<TransferOrderApprover, number>({
      query: (toId) => ({ url: `transfer-orders/${toId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, toId) => [
        { type: 'TransferOrderApprovers', id: toId },
        { type: 'TransferOrderEvents', id: toId },
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
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    updateTransferOrderItem: builder.mutation<TransferOrderItem, { itemId: number; data: UpdateTransferOrderItem; toId?: number }>({
      query: ({ itemId, data }) => ({ url: `transfer-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { toId }) => [
        'TransferOrderItem',
        ...(toId != null ? [{ type: 'TransferOrderEvents' as const, id: toId }] : []),
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
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
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        } catch {
          /* mutation failed */
        }
      },
    }),
  }),
});

export const {
  useGetTransferOrdersQuery,
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
