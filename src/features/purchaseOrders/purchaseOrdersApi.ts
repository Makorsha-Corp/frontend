import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrder,
  UpdatePurchaseOrder,
  CreatePurchaseOrderItem,
  UpdatePurchaseOrderItem,
  PurchaseOrderItemSyncRequest,
  ListPurchaseOrdersParams,
  ActiveOrderRow,
  ActiveOrdersScope,
  PurchaseOrderApprover,
  PurchaseOrderApproversList,
  PurchaseOrderEvent,
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
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PurchaseOrder', 'PurchaseOrderItem', 'PurchaseOrderApprovers', 'PurchaseOrderEvents', 'AccountInvoice', 'ActiveOrders'],
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
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'PurchaseOrder', id },
        'PurchaseOrder',
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id },
      ],
      async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
        const patchById = dispatch(
          purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, (draft) => {
            Object.assign(draft, data);
          })
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, () => updated)
          );
        } catch {
          patchById.undo();
        }
      },
    }),
    setPurchaseOrderSectionConfirm: builder.mutation<
      PurchaseOrder,
      {
        poId: number;
        section: 'supplier' | 'details' | 'items' | 'invoice';
        confirmed: boolean;
      }
    >({
      query: ({ poId, section, confirmed }) => ({
        url: `purchase-orders/${poId}/section-confirm/`,
        method: 'PATCH',
        body: { section, confirmed },
      }),
      invalidatesTags: (_r, _e, { poId }) => [
        { type: 'PurchaseOrder', id: poId },
        'PurchaseOrder',
        { type: 'PurchaseOrderEvents', id: poId },
        { type: 'PurchaseOrderApprovers', id: poId },
      ],
      async onQueryStarted({ poId, section, confirmed }, { dispatch, queryFulfilled }) {
        const fieldMap = {
          supplier: 'supplier_confirmed',
          details: 'details_confirmed',
          items: 'items_confirmed',
          invoice: 'invoice_confirmed',
        } as const;
        const field = fieldMap[section];
        const patchById = dispatch(
          purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', poId, (draft) => {
            draft[field] = confirmed;
          })
        );
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', poId, () => updated)
          );
        } catch {
          patchById.undo();
        }
      },
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
        { type: 'PurchaseOrderEvents', id },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            purchaseOrdersApi.util.updateQueryData('getPurchaseOrderById', id, () => updated)
          );
          dispatch(accountInvoicesApi.util.invalidateTags(['AccountInvoice']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    markPurchaseOrderComplete: builder.mutation<PurchaseOrder, number>({
      query: (id) => ({ url: `purchase-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'PurchaseOrder', id },
        'PurchaseOrder',
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id },
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
    updatePurchaseOrderItem: builder.mutation<
      PurchaseOrderItem,
      { itemId: number; poId: number; data: UpdatePurchaseOrderItem }
    >({
      query: ({ itemId, data }) => ({ url: `purchase-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { poId }) => [
        'PurchaseOrderItem',
        'PurchaseOrder',
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id: poId },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(accountInvoicesApi.util.invalidateTags(['AccountInvoice']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    removePurchaseOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `purchase-orders/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: ['PurchaseOrderItem', 'PurchaseOrder', 'ActiveOrders'],
    }),
    syncPurchaseOrderItems: builder.mutation<
      PurchaseOrder,
      { poId: number; data: PurchaseOrderItemSyncRequest }
    >({
      query: ({ poId, data }) => ({
        url: `purchase-orders/${poId}/items/sync/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_r, _e, { poId }) => [
        { type: 'PurchaseOrderItem', id: poId },
        { type: 'PurchaseOrder', id: poId },
        'PurchaseOrder',
        'ActiveOrders',
        { type: 'PurchaseOrderEvents', id: poId },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(accountInvoicesApi.util.invalidateTags(['AccountInvoice']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    // Approvers
    getPurchaseOrderApprovers: builder.query<PurchaseOrderApproversList, number>({
      query: (poId) => `purchase-orders/${poId}/approvers/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderApprovers', id: poId }],
    }),
    addPurchaseOrderApprover: builder.mutation<PurchaseOrderApprover, { poId: number; user_id: number }>({
      query: ({ poId, user_id }) => ({
        url: `purchase-orders/${poId}/approvers/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { poId }) => [{ type: 'PurchaseOrderApprovers', id: poId }],
    }),
    removePurchaseOrderApprover: builder.mutation<void, { poId: number; userId: number }>({
      query: ({ poId, userId }) => ({
        url: `purchase-orders/${poId}/approvers/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { poId }) => [{ type: 'PurchaseOrderApprovers', id: poId }],
    }),
    approvePurchaseOrder: builder.mutation<PurchaseOrderApprover, number>({
      query: (poId) => ({ url: `purchase-orders/${poId}/approvers/me/approve/`, method: 'POST' }),
      invalidatesTags: (_r, _e, poId) => [
        { type: 'PurchaseOrderApprovers', id: poId },
        { type: 'PurchaseOrderEvents', id: poId },
      ],
    }),
    unapprovePurchaseOrder: builder.mutation<PurchaseOrderApprover, number>({
      query: (poId) => ({ url: `purchase-orders/${poId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, poId) => [
        { type: 'PurchaseOrderApprovers', id: poId },
        { type: 'PurchaseOrderEvents', id: poId },
      ],
    }),
    // Events
    getPurchaseOrderEvents: builder.query<PurchaseOrderEvent[], number>({
      query: (poId) => `purchase-orders/${poId}/events/`,
      providesTags: (_r, _e, poId) => [{ type: 'PurchaseOrderEvents', id: poId }],
    }),
  }),
});

export const {
  useGetActiveOrdersForContextQuery,
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useSetPurchaseOrderSectionConfirmMutation,
  useDeletePurchaseOrderMutation,
  useCreateInvoiceFromPurchaseOrderMutation,
  useMarkPurchaseOrderCompleteMutation,
  useGetPurchaseOrderItemsQuery,
  useAddPurchaseOrderItemMutation,
  useUpdatePurchaseOrderItemMutation,
  useRemovePurchaseOrderItemMutation,
  useSyncPurchaseOrderItemsMutation,
  useGetPurchaseOrderApproversQuery,
  useAddPurchaseOrderApproverMutation,
  useRemovePurchaseOrderApproverMutation,
  useApprovePurchaseOrderMutation,
  useUnapprovePurchaseOrderMutation,
  useGetPurchaseOrderEventsQuery,
} = purchaseOrdersApi;
