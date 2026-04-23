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
  ActiveOrderRow,
  ActiveOrdersScope,
} from '../../types/purchaseOrder';

function activeOrdersQueryString(scope: ActiveOrdersScope): string {
  const params = new URLSearchParams();
  if ('machineId' in scope) params.append('machine_id', String(scope.machineId));
  if ('factoryId' in scope) params.append('factory_id', String(scope.factoryId));
  if ('projectComponentId' in scope) {
    params.append('project_component_id', String(scope.projectComponentId));
  }
  return params.toString();
}

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
  tagTypes: ['PurchaseOrder', 'PurchaseOrderItem', 'AccountInvoice', 'ActiveOrders'],
  endpoints: (builder) => ({
    getActiveOrdersForContext: builder.query<ActiveOrderRow[], ActiveOrdersScope>({
      query: (scope) => `purchase-orders/active/?${activeOrdersQueryString(scope)}`,
      providesTags: ['ActiveOrders'],
    }),
    getPurchaseOrders: builder.query<PurchaseOrder[], ListPurchaseOrdersParams>({
      query: ({ skip = 0, limit = 100, account_id, invoice_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (account_id) params.append('account_id', account_id.toString());
        if (invoice_id) params.append('invoice_id', invoice_id.toString());
        return `purchase-orders/?${params.toString()}`;
      },
      providesTags: ['PurchaseOrder'],
    }),
    getPurchaseOrderById: builder.query<PurchaseOrder, number>({
      query: (id) => `purchase-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'PurchaseOrder', id }],
    }),
    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrder>({
      query: (body) => ({ url: 'purchase-orders/', method: 'POST', body }),
      invalidatesTags: ['PurchaseOrder', 'ActiveOrders'],
    }),
    updatePurchaseOrder: builder.mutation<PurchaseOrder, { id: number; data: UpdatePurchaseOrder }>({
      query: ({ id, data }) => ({ url: `purchase-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'PurchaseOrder', id }, 'PurchaseOrder', 'ActiveOrders'],
    }),
    deletePurchaseOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `purchase-orders/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrder', 'ActiveOrders'],
    }),
    createInvoiceFromPurchaseOrder: builder.mutation<PurchaseOrder, number>({
      query: (id) => ({ url: `purchase-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PurchaseOrder', id },
        'PurchaseOrder',
        'PurchaseOrderItem',
        'AccountInvoice',
        'ActiveOrders',
      ],
    }),
    // Items
    getPurchaseOrderItems: builder.query<PurchaseOrderItem[], number>({
      query: (poId) => `purchase-orders/${poId}/items/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderItem', id: poId }],
    }),
    addPurchaseOrderItem: builder.mutation<PurchaseOrderItem, { poId: number; data: CreatePurchaseOrderItem }>({
      query: ({ poId, data }) => ({ url: `purchase-orders/${poId}/items/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { poId }) => [{ type: 'PurchaseOrderItem', id: poId }, 'PurchaseOrder', 'ActiveOrders'],
    }),
    updatePurchaseOrderItem: builder.mutation<PurchaseOrderItem, { itemId: number; data: UpdatePurchaseOrderItem }>({
      query: ({ itemId, data }) => ({ url: `purchase-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: ['PurchaseOrderItem', 'PurchaseOrder', 'ActiveOrders'],
    }),
    removePurchaseOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `purchase-orders/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrderItem', 'PurchaseOrder', 'ActiveOrders'],
    }),
  }),
});

export const {
  useGetActiveOrdersForContextQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useCreateInvoiceFromPurchaseOrderMutation,
  useGetPurchaseOrderItemsQuery,
  useAddPurchaseOrderItemMutation,
  useUpdatePurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
} = purchaseOrdersApi;
