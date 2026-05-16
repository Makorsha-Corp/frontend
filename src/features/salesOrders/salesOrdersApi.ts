import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import type { SalesOrder, CreateSalesOrderDTO, UpdateSalesOrderDTO } from '@/types/salesOrder';
import type { SalesOrderItem, CreateSalesOrderItemDTO } from '@/types/salesOrderItem';
import type { SalesDelivery } from '@/types/salesDelivery';

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
  tagTypes: ['SalesOrder', 'SalesOrderItem', 'AccountInvoice'],
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
          if (data.invoice_id != null || data.is_invoiced) {
            dispatch(accountInvoicesApi.util.invalidateTags(['AccountInvoice']));
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    createInvoiceFromSalesOrder: builder.mutation<SalesOrder, number>({
      query: (id) => ({ url: `sales-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'SalesOrder', id },
        'SalesOrder',
        'AccountInvoice',
      ],
    }),
    getSalesOrderItems: builder.query<SalesOrderItem[], number>({
      query: (orderId) => `sales-orders/${orderId}/items/`,
      providesTags: (_r, _e, orderId) => [{ type: 'SalesOrderItem', id: `order-${orderId}` }],
    }),
    getSalesOrderDeliveries: builder.query<SalesDelivery[], number>({
      query: (orderId) => `sales-orders/${orderId}/deliveries/`,
      providesTags: (_r, _e, orderId) => [{ type: 'SalesOrder', id: `deliveries-${orderId}` }],
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
} = salesOrdersApi;
