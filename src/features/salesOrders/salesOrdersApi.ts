import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { invalidateInvoiceById, invalidateUnlinkedDraftInvoice } from '@/features/cache/invalidateOrderInvoiceCache';
import type {
  SalesOrder,
  CreateSalesOrderDTO,
  UpdateSalesOrderDTO,
  SalesOrderApprover,
  SalesOrderApproversList,
  SalesOrderSection,
  SalesOrderEvent,
} from '@/types/salesOrder';
import type { SalesOrderItem, CreateSalesOrderItemDTO } from '@/types/salesOrderItem';
import type { SalesDelivery } from '@/types/salesDelivery';
import type { ActionResponse } from '@/types/common';

export interface ListSalesOrdersParams {
  skip?: number;
  limit?: number;
}

export interface CreateSalesOrderWithItemsDTO {
  order: CreateSalesOrderDTO;
  items: CreateSalesOrderItemDTO[];
}

export const salesOrdersApi = createApi({
  reducerPath: 'salesOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SalesOrder', 'SalesOrderItem', 'SalesOrderApprovers', 'SalesOrderEvents'],
  endpoints: (builder) => ({
    getSalesOrders: builder.query<SalesOrder[], ListSalesOrdersParams>({
      query: ({ skip = 0, limit = 100 } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        return `sales-orders/?${params.toString()}`;
      },
      providesTags: ['SalesOrder'],
    }),
    getSalesOrderById: builder.query<SalesOrder, number>({
      query: (id) => `sales-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'SalesOrder', id }],
    }),
    createSalesOrder: builder.mutation<SalesOrder, CreateSalesOrderWithItemsDTO>({
      query: ({ order, items }) => ({
        url: 'sales-orders/',
        method: 'POST',
        body: {
          order_in: order,
          items: items,
        },
      }),
      invalidatesTags: ['SalesOrder'],
    }),
    updateSalesOrder: builder.mutation<SalesOrder, { id: number; data: UpdateSalesOrderDTO }>({
      query: ({ id, data }) => ({
        url: `sales-orders/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SalesOrder', id }, 'SalesOrder'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.invoice_id != null) {
            invalidateInvoiceById(dispatch, data.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    createInvoiceFromSalesOrder: builder.mutation<SalesOrder, number>({
      query: (id) => ({ url: `sales-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'SalesOrder', id }, 'SalesOrder'],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    getSalesOrderItems: builder.query<SalesOrderItem[], number>({
      query: (orderId) => `sales-orders/${orderId}/items/`,
      providesTags: (_r, _e, orderId) => [{ type: 'SalesOrderItem', id: `order-${orderId}` }],
    }),
    getSalesOrderDeliveries: builder.query<SalesDelivery[], number>({
      query: (orderId) => `sales-orders/${orderId}/deliveries/`,
      providesTags: (_r, _e, orderId) => [{ type: 'SalesOrder', id: `deliveries-${orderId}` }],
    }),
    fulfillSalesOrderItem: builder.mutation<
      ActionResponse<SalesOrder>,
      { orderId: number; itemId: number; completion_code?: string }
    >({
      query: ({ orderId, itemId, completion_code }) => ({
        url: `sales-orders/${orderId}/items/${itemId}/fulfill/`,
        method: 'POST',
        body: { completion_code: completion_code || undefined },
      }),
      invalidatesTags: (_r, _e, { orderId }) => [
        { type: 'SalesOrder', id: orderId },
        { type: 'SalesOrderItem', id: `order-${orderId}` },
        'SalesOrder',
      ],
    }),
    finalizeSalesOrderInvoice: builder.mutation<SalesOrder, number>({
      query: (id) => ({ url: `sales-orders/${id}/finalize-invoice/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrderEvents', id },
        'SalesOrder',
      ],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    markSalesOrderComplete: builder.mutation<SalesOrder, number>({
      query: (id) => ({ url: `sales-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrderEvents', id },
        'SalesOrder',
      ],
    }),
    setSalesOrderSectionConfirm: builder.mutation<
      SalesOrder,
      { orderId: number; section: SalesOrderSection; confirmed: boolean }
    >({
      query: ({ orderId, section, confirmed }) => ({
        url: `sales-orders/${orderId}/section-confirm/`,
        method: 'PATCH',
        body: { section, confirmed },
      }),
      invalidatesTags: (_r, _e, { orderId }) => [
        { type: 'SalesOrder', id: orderId },
        { type: 'SalesOrderEvents', id: orderId },
        { type: 'SalesOrderApprovers', id: orderId },
        'SalesOrder',
      ],
      async onQueryStarted({ orderId }, { dispatch, getState, queryFulfilled }) {
        const previousInvoiceId =
          salesOrdersApi.endpoints.getSalesOrderById.select(orderId)(getState()).data?.invoice_id ??
          null;
        try {
          const { data: updated } = await queryFulfilled;
          if (updated.invoice_id != null) {
            invalidateInvoiceById(dispatch, updated.invoice_id);
          }
          invalidateUnlinkedDraftInvoice(dispatch, previousInvoiceId, updated.invoice_id);
        } catch {
          /* mutation failed */
        }
      },
    }),
    // Approvers
    getSalesOrderApprovers: builder.query<SalesOrderApproversList, number>({
      query: (orderId) => `sales-orders/${orderId}/approvers/`,
      providesTags: (_r, _e, orderId) => [{ type: 'SalesOrderApprovers', id: orderId }],
    }),
    addSalesOrderApprover: builder.mutation<SalesOrderApprover, { orderId: number; user_id: number }>({
      query: ({ orderId, user_id }) => ({
        url: `sales-orders/${orderId}/approvers/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { orderId }) => [{ type: 'SalesOrderApprovers', id: orderId }],
    }),
    removeSalesOrderApprover: builder.mutation<void, { orderId: number; userId: number }>({
      query: ({ orderId, userId }) => ({
        url: `sales-orders/${orderId}/approvers/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { orderId }) => [{ type: 'SalesOrderApprovers', id: orderId }],
    }),
    approveSalesOrder: builder.mutation<SalesOrderApprover, number>({
      query: (orderId) => ({ url: `sales-orders/${orderId}/approvers/me/approve/`, method: 'POST' }),
      invalidatesTags: (_r, _e, orderId) => [
        { type: 'SalesOrderApprovers', id: orderId },
        { type: 'SalesOrderEvents', id: orderId },
        { type: 'SalesOrder', id: orderId },
        'SalesOrder',
      ],
    }),
    unapproveSalesOrder: builder.mutation<SalesOrderApprover, number>({
      query: (orderId) => ({ url: `sales-orders/${orderId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, orderId) => [
        { type: 'SalesOrderApprovers', id: orderId },
        { type: 'SalesOrderEvents', id: orderId },
        { type: 'SalesOrder', id: orderId },
        'SalesOrder',
      ],
    }),
    // Events
    getSalesOrderEvents: builder.query<SalesOrderEvent[], number>({
      query: (orderId) => `sales-orders/${orderId}/events/`,
      providesTags: (_r, _e, orderId) => [{ type: 'SalesOrderEvents', id: orderId }],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useCreateInvoiceFromSalesOrderMutation,
  useGetSalesOrderItemsQuery,
  useGetSalesOrderDeliveriesQuery,
  useFulfillSalesOrderItemMutation,
  useFinalizeSalesOrderInvoiceMutation,
  useMarkSalesOrderCompleteMutation,
  useSetSalesOrderSectionConfirmMutation,
  useGetSalesOrderApproversQuery,
  useAddSalesOrderApproverMutation,
  useRemoveSalesOrderApproverMutation,
  useApproveSalesOrderMutation,
  useUnapproveSalesOrderMutation,
  useGetSalesOrderEventsQuery,
} = salesOrdersApi;
