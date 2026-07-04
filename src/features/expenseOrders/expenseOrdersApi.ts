import { createApi } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { baseQueryWithReauth } from '@/app/baseQuery';
import {
  invalidateInvoiceById,
} from '@/features/cache/invalidateOrderInvoiceCache';
import type {
  ExpenseOrder,
  ExpenseOrderItem,
  CreateExpenseOrder,
  CreateExpenseOrderFromTemplate,
  UpdateExpenseOrder,
  CreateExpenseOrderItem,
  UpdateExpenseOrderItem,
  ListExpenseOrdersParams,
  ExpenseOrderApproversList,
  ExpenseOrderApprover,
  ExpenseOrderEvent,
} from '../../types/expenseOrder';

export const expenseOrdersApi = createApi({
  reducerPath: 'expenseOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ExpenseOrder', 'ExpenseOrderItem', 'ExpenseOrderApprovers', 'ExpenseOrderEvents'],
  endpoints: (builder) => ({
    getExpenseOrders: builder.query<ExpenseOrder[], ListExpenseOrdersParams>({
      query: ({ skip = 0, limit = 100, expense_category, account_id, invoice_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (expense_category) params.append('expense_category', expense_category);
        if (account_id) params.append('account_id', account_id.toString());
        if (invoice_id) params.append('invoice_id', invoice_id.toString());
        return `expense-orders/?${params.toString()}`;
      },
      providesTags: ['ExpenseOrder'],
    }),
    getExpenseOrderById: builder.query<ExpenseOrder, number>({
      query: (id) => `expense-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'ExpenseOrder', id }],
    }),
    createExpenseOrder: builder.mutation<ExpenseOrder, CreateExpenseOrder>({
      query: (body) => ({ url: 'expense-orders/', method: 'POST', body }),
      invalidatesTags: ['ExpenseOrder'],
    }),
    createExpenseOrderFromTemplate: builder.mutation<
      ExpenseOrder,
      { templateId: number; data: CreateExpenseOrderFromTemplate }
    >({
      query: ({ templateId, data }) => ({
        url: `expense-orders/from-template/${templateId}/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ExpenseOrder'],
    }),
    updateExpenseOrder: builder.mutation<ExpenseOrder, { id: number; data: UpdateExpenseOrder }>({
      query: ({ id, data }) => ({ url: `expense-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ExpenseOrder', id },
        'ExpenseOrder',
        { type: 'ExpenseOrderApprovers', id },
        { type: 'ExpenseOrderEvents', id },
      ],
    }),
    markExpenseOrderComplete: builder.mutation<ExpenseOrder, number>({
      query: (id) => ({ url: `expense-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'ExpenseOrder', id },
        'ExpenseOrder',
        { type: 'ExpenseOrderEvents', id },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
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
    voidExpenseOrder: builder.mutation<ExpenseOrder, { id: number; void_note: string }>({
      query: ({ id, void_note }) => ({ url: `expense-orders/${id}/void/`, method: 'POST', body: { void_note } }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'ExpenseOrder', id },
        'ExpenseOrder',
        { type: 'ExpenseOrderEvents', id },
        { type: 'ExpenseOrderApprovers', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
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
    deleteExpenseOrder: builder.mutation<void, number>({
      query: (id) => ({ url: `expense-orders/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['ExpenseOrder'],
    }),
    createInvoiceFromExpenseOrder: builder.mutation<ExpenseOrder, number>({
      query: (id) => ({ url: `expense-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'ExpenseOrder', id },
        'ExpenseOrder',
        { type: 'ExpenseOrderItem', id: id },
        { type: 'ExpenseOrderEvents', id },
      ],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
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
    getExpenseOrderApprovers: builder.query<ExpenseOrderApproversList, number>({
      query: (eoId) => `expense-orders/${eoId}/approvers/`,
      providesTags: (_r, _e, eoId) => [{ type: 'ExpenseOrderApprovers', id: eoId }],
    }),
    addExpenseOrderApprover: builder.mutation<ExpenseOrderApprover, { eoId: number; user_id: number }>({
      query: ({ eoId, user_id }) => ({
        url: `expense-orders/${eoId}/approvers/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { eoId }) => [
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
      ],
    }),
    removeExpenseOrderApprover: builder.mutation<void, { eoId: number; userId: number }>({
      query: ({ eoId, userId }) => ({
        url: `expense-orders/${eoId}/approvers/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { eoId }) => [
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
      ],
    }),
    approveExpenseOrder: builder.mutation<ExpenseOrderApprover, number>({
      query: (eoId) => ({ url: `expense-orders/${eoId}/approvers/me/approve/`, method: 'POST' }),
      invalidatesTags: (_r, _e, eoId) => [
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
        { type: 'ExpenseOrder', id: eoId },
        'ExpenseOrder',
      ],
    }),
    unapproveExpenseOrder: builder.mutation<ExpenseOrderApprover, number>({
      query: (eoId) => ({ url: `expense-orders/${eoId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, eoId) => [
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
        { type: 'ExpenseOrder', id: eoId },
        'ExpenseOrder',
      ],
    }),
    getExpenseOrderEvents: builder.query<ExpenseOrderEvent[], number>({
      query: (eoId) => `expense-orders/${eoId}/events/`,
      providesTags: (_r, _e, eoId) => [{ type: 'ExpenseOrderEvents', id: eoId }],
    }),
    getExpenseOrderItems: builder.query<ExpenseOrderItem[], number>({
      query: (eoId) => `expense-orders/${eoId}/items/`,
      providesTags: (_r, _e, eoId) => [{ type: 'ExpenseOrderItem', id: eoId }],
    }),
    addExpenseOrderItem: builder.mutation<ExpenseOrderItem, { eoId: number; data: CreateExpenseOrderItem }>({
      query: ({ eoId, data }) => ({ url: `expense-orders/${eoId}/items/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { eoId }) => [
        { type: 'ExpenseOrderItem', id: eoId },
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
        'ExpenseOrder',
      ],
      async onQueryStarted({ eoId }, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          const cachedEo = expenseOrdersApi.endpoints.getExpenseOrderById.select(eoId)(
            getState() as RootState
          )?.data;
          if (cachedEo?.invoice_id != null) {
            invalidateInvoiceById(dispatch, cachedEo.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    updateExpenseOrderItem: builder.mutation<
      ExpenseOrderItem,
      { itemId: number; data: UpdateExpenseOrderItem; eoId?: number }
    >({
      query: ({ itemId, data }) => ({ url: `expense-orders/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { eoId }) => [
        'ExpenseOrderItem',
        'ExpenseOrder',
        ...(eoId != null
          ? [
              { type: 'ExpenseOrderApprovers' as const, id: eoId },
              { type: 'ExpenseOrderEvents' as const, id: eoId },
            ]
          : []),
      ],
      async onQueryStarted({ eoId }, { dispatch, queryFulfilled, getState }) {
        if (eoId == null) return;
        try {
          await queryFulfilled;
          const cachedEo = expenseOrdersApi.endpoints.getExpenseOrderById.select(eoId)(
            getState() as RootState
          )?.data;
          if (cachedEo?.invoice_id != null) {
            invalidateInvoiceById(dispatch, cachedEo.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
    removeExpenseOrderItem: builder.mutation<void, { itemId: number; eoId: number }>({
      query: ({ itemId }) => ({ url: `expense-orders/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { eoId }) => [
        { type: 'ExpenseOrderItem', id: eoId },
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
        'ExpenseOrder',
      ],
      async onQueryStarted({ eoId }, { dispatch, queryFulfilled, getState }) {
        try {
          await queryFulfilled;
          const cachedEo = expenseOrdersApi.endpoints.getExpenseOrderById.select(eoId)(
            getState() as RootState
          )?.data;
          if (cachedEo?.invoice_id != null) {
            invalidateInvoiceById(dispatch, cachedEo.invoice_id);
          }
        } catch {
          /* mutation failed */
        }
      },
    }),
  }),
});

export const {
  useGetExpenseOrdersQuery,
  useGetExpenseOrderByIdQuery,
  useCreateExpenseOrderMutation,
  useCreateExpenseOrderFromTemplateMutation,
  useUpdateExpenseOrderMutation,
  useMarkExpenseOrderCompleteMutation,
  useVoidExpenseOrderMutation,
  useDeleteExpenseOrderMutation,
  useCreateInvoiceFromExpenseOrderMutation,
  useGetExpenseOrderApproversQuery,
  useAddExpenseOrderApproverMutation,
  useRemoveExpenseOrderApproverMutation,
  useApproveExpenseOrderMutation,
  useUnapproveExpenseOrderMutation,
  useGetExpenseOrderEventsQuery,
  useGetExpenseOrderItemsQuery,
  useAddExpenseOrderItemMutation,
  useUpdateExpenseOrderItemMutation,
  useRemoveExpenseOrderItemMutation,
} = expenseOrdersApi;
