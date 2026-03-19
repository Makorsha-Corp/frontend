import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  OrderTemplate,
  OrderTemplateItem,
  CreateOrderTemplate,
  UpdateOrderTemplate,
  CreateOrderTemplateItem,
  UpdateOrderTemplateItem,
  ListOrderTemplatesParams,
} from '../../types/orderTemplate';

export const orderTemplatesApi = createApi({
  reducerPath: 'orderTemplatesApi',
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
  tagTypes: ['OrderTemplate', 'OrderTemplateItem'],
  endpoints: (builder) => ({
    getOrderTemplates: builder.query<OrderTemplate[], ListOrderTemplatesParams>({
      query: ({ skip = 0, limit = 100, is_active, expense_category } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (is_active !== undefined) params.append('is_active', is_active.toString());
        if (expense_category) params.append('expense_category', expense_category);
        return `/order-templates?${params.toString()}`;
      },
      providesTags: ['OrderTemplate'],
    }),
    getOrderTemplateById: builder.query<OrderTemplate, number>({
      query: (id) => `/order-templates/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'OrderTemplate', id }],
    }),
    createOrderTemplate: builder.mutation<OrderTemplate, CreateOrderTemplate>({
      query: (body) => ({ url: '/order-templates', method: 'POST', body }),
      invalidatesTags: ['OrderTemplate'],
    }),
    updateOrderTemplate: builder.mutation<OrderTemplate, { id: number; data: UpdateOrderTemplate }>({
      query: ({ id, data }) => ({ url: `/order-templates/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'OrderTemplate', id }, 'OrderTemplate'],
    }),
    deleteOrderTemplate: builder.mutation<void, number>({
      query: (id) => ({ url: `/order-templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OrderTemplate'],
    }),
    // Items
    getOrderTemplateItems: builder.query<OrderTemplateItem[], number>({
      query: (tplId) => `/order-templates/${tplId}/items`,
      providesTags: (_r, _e, tplId) => [{ type: 'OrderTemplateItem', id: tplId }],
    }),
    addOrderTemplateItem: builder.mutation<OrderTemplateItem, { tplId: number; data: CreateOrderTemplateItem }>({
      query: ({ tplId, data }) => ({ url: `/order-templates/${tplId}/items`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { tplId }) => [{ type: 'OrderTemplateItem', id: tplId }],
    }),
    updateOrderTemplateItem: builder.mutation<OrderTemplateItem, { itemId: number; data: UpdateOrderTemplateItem }>({
      query: ({ itemId, data }) => ({ url: `/order-templates/items/${itemId}`, method: 'PUT', body: data }),
      invalidatesTags: ['OrderTemplateItem'],
    }),
    removeOrderTemplateItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `/order-templates/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['OrderTemplateItem'],
    }),
  }),
});

export const {
  useGetOrderTemplatesQuery,
  useGetOrderTemplateByIdQuery,
  useCreateOrderTemplateMutation,
  useUpdateOrderTemplateMutation,
  useDeleteOrderTemplateMutation,
  useGetOrderTemplateItemsQuery,
  useAddOrderTemplateItemMutation,
  useUpdateOrderTemplateItemMutation,
  useRemoveOrderTemplateItemMutation,
} = orderTemplatesApi;
