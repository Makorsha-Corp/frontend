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
} from '../../types/transferOrder';
import { purchaseOrdersApi } from '../purchaseOrders/purchaseOrdersApi';

export const transferOrdersApi = createApi({
  reducerPath: 'transferOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TransferOrder', 'TransferOrderItem'],
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
        } finally {
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        }
      },
    }),
    updateTransferOrder: builder.mutation<TransferOrder, { id: number; data: UpdateTransferOrder }>({
      query: ({ id, data }) => ({ url: `transfer-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'TransferOrder', id }, 'TransferOrder'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        }
      },
    }),
    deleteTransferOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `transfer-orders/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['TransferOrder'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        }
      },
    }),
    // Items
    getTransferOrderItems: builder.query<TransferOrderItem[], number>({
      query: (toId) => `transfer-orders/${toId}/items/`,
      providesTags: (_r, _e, toId) => [{ type: 'TransferOrderItem', id: toId }],
    }),
    addTransferOrderItem: builder.mutation<TransferOrderItem, { toId: number; data: CreateTransferOrderItem }>({
      query: ({ toId, data }) => ({ url: `transfer-orders/${toId}/items/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { toId }) => [{ type: 'TransferOrderItem', id: toId }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        }
      },
    }),
    updateTransferOrderItem: builder.mutation<TransferOrderItem, { itemId: number; data: UpdateTransferOrderItem }>({
      query: ({ itemId, data }) => ({ url: `transfer-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: ['TransferOrderItem'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
        }
      },
    }),
    removeTransferOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `transfer-orders/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: ['TransferOrderItem'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(purchaseOrdersApi.util.invalidateTags(['ActiveOrders']));
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
  useDeleteTransferOrderMutation,
  useGetTransferOrderItemsQuery,
  useAddTransferOrderItemMutation,
  useUpdateTransferOrderItemMutation,
  useRemoveTransferOrderItemMutation,
} = transferOrdersApi;
