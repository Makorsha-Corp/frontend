import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrder,
  UpdatePurchaseOrder,
  CreatePurchaseOrderItem,
  UpdatePurchaseOrderItem,
  ListPurchaseOrdersParams,
} from '../../types/purchaseOrder';

export const purchaseOrdersApi = createApi({
  reducerPath: 'purchaseOrdersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const workspaceId = state.auth.workspace?.id;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (workspaceId) headers.set('X-Workspace-ID', workspaceId.toString());
      return headers;
    },
  }),
  tagTypes: ['PurchaseOrder', 'PurchaseOrderItem'],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PurchaseOrder[], ListPurchaseOrdersParams>({
      query: ({ skip = 0, limit = 100, account_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (account_id) params.append('account_id', account_id.toString());
        return `/purchase-orders?${params.toString()}`;
      },
      providesTags: ['PurchaseOrder'],
    }),
    getPurchaseOrderById: builder.query<PurchaseOrder, number>({
      query: (id) => `/purchase-orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrder>({
      query: (body) => ({ url: '/purchase-orders', method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: number; data: UpdatePurchaseOrder }>({
      query: ({ id, data }) => ({ url: `/purchase-orders/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'PurchaseOrder', id }, 'PurchaseOrder'],
    }),
    deletePurchaseOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `/purchase-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    // Items
    getPurchaseOrderItems: builder.query<PurchaseOrderItem[], number>({
      query: (poId) => `/purchase-orders/${poId}/items`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderItem', id: poId }],
    }),
    addPurchaseOrderItem: builder.mutation<PurchaseOrderItem, { poId: number; data: CreatePurchaseOrderItem }>({
      query: ({ poId, data }) => ({ url: `/purchase-orders/${poId}/items`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { poId }) => [{ type: 'PurchaseOrderItem', id: poId }, 'PurchaseOrder'],
    }),
    updatePurchaseOrderItem: builder.mutation<PurchaseOrderItem, { itemId: number; data: UpdatePurchaseOrderItem }>({
      query: ({ itemId, data }) => ({ url: `/purchase-orders/items/${itemId}`, method: 'PUT', body: data }),
      invalidatesTags: ['PurchaseOrderItem', 'PurchaseOrder'],
    }),
    removePurchaseOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `/purchase-orders/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrderItem', 'PurchaseOrder'],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useGetPurchaseOrderItemsQuery,
  useAddPurchaseOrderItemMutation,
  useUpdatePurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
} = purchaseOrdersApi;
