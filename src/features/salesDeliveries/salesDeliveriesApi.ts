import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { invalidateSalesOrderById } from '@/features/cache/invalidateOrderInvoiceCache';
import type { SalesDelivery, CreateSalesDeliveryDTO } from '@/types/salesDelivery';
import type { SalesDeliveryItem, CreateSalesDeliveryItemDTO } from '@/types/salesDeliveryItem';
import type { SalesOrder } from '@/types/salesOrder';
import type { ActionResponse } from '@/types/common';

export interface ListSalesDeliveriesParams {
  skip?: number;
  limit?: number;
  delivery_status?: 'planned' | 'delivered' | 'cancelled';
}

export interface CreateSalesDeliveryWithItemsDTO {
  delivery: CreateSalesDeliveryDTO;
  items: CreateSalesDeliveryItemDTO[];
}

export const salesDeliveriesApi = createApi({
  reducerPath: 'salesDeliveriesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SalesDelivery', 'SalesDeliveryItem', 'SalesOrder'],
  endpoints: (builder) => ({
    getSalesDeliveries: builder.query<SalesDelivery[], ListSalesDeliveriesParams>({
      query: ({ skip = 0, limit = 100, delivery_status } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (delivery_status) {
          params.append('delivery_status', delivery_status);
        }
        return `sales-deliveries/?${params.toString()}`;
      },
      providesTags: ['SalesDelivery'],
    }),
    getSalesDeliveryById: builder.query<SalesDelivery, number>({
      query: (id) => `sales-deliveries/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'SalesDelivery', id }],
    }),
    createSalesDelivery: builder.mutation<SalesDelivery, CreateSalesDeliveryWithItemsDTO>({
      query: ({ delivery, items }) => ({
        url: 'sales-deliveries/',
        method: 'POST',
        body: {
          delivery_in: delivery,
          items: items,
        },
      }),
      invalidatesTags: ['SalesDelivery', 'SalesOrder'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateSalesOrderById(dispatch, data.sales_order_id);
        } catch {
          /* mutation failed */
        }
      },
    }),
    completeSalesDelivery: builder.mutation<ActionResponse<SalesOrder>, number>({
      query: (id) => ({
        url: `sales-deliveries/${id}/complete/`,
        method: 'POST',
      }),
      invalidatesTags: ['SalesDelivery', 'SalesOrder'],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateSalesOrderById(dispatch, data.data.id);
        } catch {
          /* mutation failed */
        }
      },
    }),
    cancelSalesDelivery: builder.mutation<SalesDelivery, number>({
      query: (id) => ({
        url: `sales-deliveries/${id}/cancel/`,
        method: 'POST',
      }),
      invalidatesTags: ['SalesDelivery', 'SalesOrder'],
      async onQueryStarted(_id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateSalesOrderById(dispatch, data.sales_order_id);
        } catch {
          /* mutation failed */
        }
      },
    }),
    getSalesDeliveryItems: builder.query<SalesDeliveryItem[], number>({
      query: (deliveryId) => `sales-deliveries/${deliveryId}/items/`,
      providesTags: (_result, _error, deliveryId) => [{ type: 'SalesDeliveryItem', id: `delivery-${deliveryId}` }],
    }),
  }),
});

export const {
  useGetSalesDeliveriesQuery,
  useGetSalesDeliveryByIdQuery,
  useCreateSalesDeliveryMutation,
  useCompleteSalesDeliveryMutation,
  useCancelSalesDeliveryMutation,
  useGetSalesDeliveryItemsQuery,
} = salesDeliveriesApi;
