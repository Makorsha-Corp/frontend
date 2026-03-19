import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type { SalesDelivery, CreateSalesDeliveryDTO, UpdateSalesDeliveryDTO } from '@/types/salesDelivery';
import type { SalesDeliveryItem, CreateSalesDeliveryItemDTO } from '@/types/salesDeliveryItem';

export interface ListSalesDeliveriesParams {
  skip?: number;
  limit?: number;
  delivery_status?: 'planned' | 'delivered' | 'cancelled';
}

export interface CreateSalesDeliveryWithItemsDTO {
  delivery: CreateSalesDeliveryDTO;
  items: CreateSalesDeliveryItemDTO[];
}

export interface ActionResponse<T> {
  data: T;
  messages: string[];
}

export const salesDeliveriesApi = createApi({
  reducerPath: 'salesDeliveriesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/v1',
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
        return `/sales-deliveries/?${params.toString()}`;
      },
      providesTags: ['SalesDelivery'],
    }),
    getSalesDeliveryById: builder.query<SalesDelivery, number>({
      query: (id) => `/sales-deliveries/${id}/`,
      providesTags: (result, error, id) => [{ type: 'SalesDelivery', id }],
    }),
    createSalesDelivery: builder.mutation<SalesDelivery, CreateSalesDeliveryWithItemsDTO>({
      query: ({ delivery, items }) => ({
        url: '/sales-deliveries/',
        method: 'POST',
        body: {
          delivery_in: delivery,
          items: items,
        },
      }),
      invalidatesTags: ['SalesDelivery', 'SalesOrder'],
    }),
    completeSalesDelivery: builder.mutation<ActionResponse<any>, number>({
      query: (id) => ({
        url: `/sales-deliveries/${id}/complete/`,
        method: 'POST',
      }),
      invalidatesTags: ['SalesDelivery', 'SalesOrder'],
    }),
    getSalesDeliveryItems: builder.query<SalesDeliveryItem[], number>({
      query: (deliveryId) => `/sales-deliveries/${deliveryId}/items/`,
      providesTags: (result, error, deliveryId) => [{ type: 'SalesDeliveryItem', id: `delivery-${deliveryId}` }],
    }),
  }),
});

export const {
  useGetSalesDeliveriesQuery,
  useGetSalesDeliveryByIdQuery,
  useCreateSalesDeliveryMutation,
  useCompleteSalesDeliveryMutation,
  useGetSalesDeliveryItemsQuery,
} = salesDeliveriesApi;
