import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  DeliveryMethod,
  CreateDeliveryMethodRequest,
  UpdateDeliveryMethodRequest,
  ListDeliveryMethodsParams,
} from '@/types/deliveryMethod';

export const deliveryMethodsApi = createApi({
  reducerPath: 'deliveryMethodsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['DeliveryMethod'],
  endpoints: (builder) => ({
    getDeliveryMethods: builder.query<DeliveryMethod[], ListDeliveryMethodsParams | void>({
      query: ({ skip = 0, limit = 100, search } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (search) {
          params.append('search', search);
        }
        return `delivery-methods/?${params.toString()}`;
      },
      providesTags: ['DeliveryMethod'],
    }),
    getDeliveryMethodById: builder.query<DeliveryMethod, number>({
      query: (id) => `delivery-methods/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'DeliveryMethod', id }],
    }),
    createDeliveryMethod: builder.mutation<DeliveryMethod, CreateDeliveryMethodRequest>({
      query: (body) => ({
        url: 'delivery-methods/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryMethod'],
    }),
    updateDeliveryMethod: builder.mutation<DeliveryMethod, { id: number; data: UpdateDeliveryMethodRequest }>({
      query: ({ id, data }) => ({
        url: `delivery-methods/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'DeliveryMethod', id }, 'DeliveryMethod'],
    }),
    deleteDeliveryMethod: builder.mutation<DeliveryMethod, number>({
      query: (id) => ({
        url: `delivery-methods/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryMethod'],
    }),
  }),
});

export const {
  useGetDeliveryMethodsQuery,
  useGetDeliveryMethodByIdQuery,
  useCreateDeliveryMethodMutation,
  useUpdateDeliveryMethodMutation,
  useDeleteDeliveryMethodMutation,
} = deliveryMethodsApi;
