import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  ExpenseOrder,
  ExpenseOrderItem,
  CreateExpenseOrder,
  UpdateExpenseOrder,
  CreateExpenseOrderItem,
  UpdateExpenseOrderItem,
  ListExpenseOrdersParams,
} from '../../types/expenseOrder';

export const expenseOrdersApi = createApi({
  reducerPath: 'expenseOrdersApi',
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
  tagTypes: ['ExpenseOrder', 'ExpenseOrderItem'],
  endpoints: (builder) => ({
    getExpenseOrders: builder.query<ExpenseOrder[], ListExpenseOrdersParams>({
      query: ({ skip = 0, limit = 100, expense_category, account_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (expense_category) params.append('expense_category', expense_category);
        if (account_id) params.append('account_id', account_id.toString());
        return `/expense-orders?${params.toString()}`;
      },
      providesTags: ['ExpenseOrder'],
    }),
    getExpenseOrderById: builder.query<ExpenseOrder, number>({
      query: (id) => `/expense-orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ExpenseOrder', id }],
    }),
    createExpenseOrder: builder.mutation<ExpenseOrder, CreateExpenseOrder>({
      query: (body) => ({ url: '/expense-orders', method: 'POST', body }),
      invalidatesTags: ['ExpenseOrder'],
    }),
    updateExpenseOrder: builder.mutation<ExpenseOrder, { id: number; data: UpdateExpenseOrder }>({
      query: ({ id, data }) => ({ url: `/expense-orders/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'ExpenseOrder', id }, 'ExpenseOrder'],
    }),
    deleteExpenseOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `/expense-orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ExpenseOrder'],
    }),
    // Items
    getExpenseOrderItems: builder.query<ExpenseOrderItem[], number>({
      query: (eoId) => `/expense-orders/${eoId}/items`,
      providesTags: (_r, _e, eoId) => [{ type: 'ExpenseOrderItem', id: eoId }],
    }),
    addExpenseOrderItem: builder.mutation<ExpenseOrderItem, { eoId: number; data: CreateExpenseOrderItem }>({
      query: ({ eoId, data }) => ({ url: `/expense-orders/${eoId}/items`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { eoId }) => [{ type: 'ExpenseOrderItem', id: eoId }, 'ExpenseOrder'],
    }),
    updateExpenseOrderItem: builder.mutation<ExpenseOrderItem, { itemId: number; data: UpdateExpenseOrderItem }>({
      query: ({ itemId, data }) => ({ url: `/expense-orders/items/${itemId}`, method: 'PUT', body: data }),
      invalidatesTags: ['ExpenseOrderItem', 'ExpenseOrder'],
    }),
    removeExpenseOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({ url: `/expense-orders/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: ['ExpenseOrderItem', 'ExpenseOrder'],
    }),
  }),
});

export const {
  useGetExpenseOrdersQuery,
  useGetExpenseOrderByIdQuery,
  useCreateExpenseOrderMutation,
  useUpdateExpenseOrderMutation,
  useDeleteExpenseOrderMutation,
  useGetExpenseOrderItemsQuery,
  useAddExpenseOrderItemMutation,
  useUpdateExpenseOrderItemMutation,
  useRemoveExpenseOrderItemMutation,
} = expenseOrdersApi;
