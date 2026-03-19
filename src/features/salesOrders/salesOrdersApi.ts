import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
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
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;
      const workspaceId = state.auth.workspace?.id;

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (workspaceId) {
        headers.set('X-Workspace-ID', workspaceId.toString());
      }
      return headers;
    },
  }),
  tagTypes: ['SalesOrder', 'SalesOrderItem'],
  endpoints: (builder) => ({
    getSalesOrders: builder.query<SalesOrder[], ListSalesOrdersParams>({
      query: ({ skip = 0, limit = 100 } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        return `/sales-orders/?${params.toString()}`;
      },
      providesTags: ['SalesOrder'],
    }),
    getSalesOrderById: builder.query<SalesOrder, number>({
      query: (id) => `/sales-orders/${id}/`,
      providesTags: (result, error, id) => [{ type: 'SalesOrder', id }],
    }),
    createSalesOrder: builder.mutation<SalesOrder, CreateSalesOrderWithItemsDTO>({
      query: ({ order, items }) => ({
        url: '/sales-orders/',
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
        url: `/sales-orders/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'SalesOrder', id }, 'SalesOrder'],
    }),
    getSalesOrderItems: builder.query<SalesOrderItem[], number>({
      query: (orderId) => `/sales-orders/${orderId}/items/`,
      providesTags: (result, error, orderId) => [{ type: 'SalesOrderItem', id: `order-${orderId}` }],
    }),
    getSalesOrderDeliveries: builder.query<SalesDelivery[], number>({
      query: (orderId) => `/sales-orders/${orderId}/deliveries/`,
      providesTags: (result, error, orderId) => [{ type: 'SalesOrder', id: `deliveries-${orderId}` }],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useGetSalesOrderByIdQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useGetSalesOrderItemsQuery,
  useGetSalesOrderDeliveriesQuery,
} = salesOrdersApi;
