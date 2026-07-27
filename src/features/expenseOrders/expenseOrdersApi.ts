import { createApi } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { baseQueryWithReauth } from '@/app/baseQuery';
import {
  invalidateInvoiceById,
} from '@/features/cache/invalidateOrderInvoiceCache';
import {
  expenseOrderListCacheTags,
  expenseOrderCacheTagsForMutation,
  EXPENSE_ORDER_LIST_TAG,
  EXPENSE_ORDER_HUB_LIST_TAG,
  EXPENSE_ORDER_HUB_STATS_TAG,
} from '@/features/cache/orderHubCacheTags';
import type {
  ExpenseOrder,
  ExpenseOrderItem,
  CreateExpenseOrder,
  CreateExpenseOrderFromTemplate,
  UpdateExpenseOrder,
  CreateExpenseOrderItem,
  UpdateExpenseOrderItem,
  ListExpenseOrdersParams,
  ListExpenseOrdersHubParams,
  ExpenseOrderListResponse,
  ExpenseOrderHubStatsResponse,
  ExpenseOrderApproversList,
  ExpenseOrderApprover,
  ExpenseOrderEvent,
} from '../../types/expenseOrder';

function appendExpenseOrderHubFilters(
  qs: URLSearchParams,
  filters: Omit<ListExpenseOrdersHubParams, 'skip' | 'limit'>,
) {
  if (filters.expense_category) qs.append('expense_category', filters.expense_category);
  if (filters.account_id != null) qs.append('account_id', String(filters.account_id));
  if (filters.invoice_id != null) qs.append('invoice_id', String(filters.invoice_id));
  if (filters.date_from) qs.append('date_from', filters.date_from);
  if (filters.date_to) qs.append('date_to', filters.date_to);
  filters.status_ids?.forEach((id) => qs.append('status_ids', String(id)));
  if (filters.invoice_filter) qs.append('invoice_filter', filters.invoice_filter);
  if (filters.search) qs.append('search', filters.search);
  if (filters.exclude_complete) qs.append('exclude_complete', 'true');
  if (filters.exclude_voided) qs.append('exclude_voided', 'true');
}

function buildExpenseOrderHubQueryString(params: ListExpenseOrdersHubParams): string {
  const { skip = 0, limit = 50, ...filters } = params;
  const qs = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  appendExpenseOrderHubFilters(qs, filters);
  return qs.toString();
}

function buildExpenseOrderHubStatsQueryString(
  filters: Omit<ListExpenseOrdersHubParams, 'skip' | 'limit'>,
): string {
  const qs = new URLSearchParams();
  appendExpenseOrderHubFilters(qs, filters);
  return qs.toString();
}

export const expenseOrdersApi = createApi({
  reducerPath: 'expenseOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['ExpenseOrder', 'ExpenseOrderItem', 'ExpenseOrderApprovers', 'ExpenseOrderEvents'],
  endpoints: (builder) => ({
    getExpenseOrders: builder.query<ExpenseOrder[], ListExpenseOrdersHubParams>({
      query: (args = {}) => `expense-orders/?${buildExpenseOrderHubQueryString(args)}`,
      transformResponse: (response: ExpenseOrderListResponse) => response.items,
      providesTags: [EXPENSE_ORDER_LIST_TAG],
    }),
    getExpenseOrdersPage: builder.query<ExpenseOrderListResponse, ListExpenseOrdersHubParams>({
      query: (args) => `expense-orders/?${buildExpenseOrderHubQueryString(args)}`,
      providesTags: [EXPENSE_ORDER_HUB_LIST_TAG],
    }),
    getExpenseOrderHubStats: builder.query<
      ExpenseOrderHubStatsResponse,
      Omit<ListExpenseOrdersHubParams, 'skip' | 'limit'>
    >({
      query: (args) => `expense-orders/stats/?${buildExpenseOrderHubStatsQueryString(args)}`,
      providesTags: [EXPENSE_ORDER_HUB_STATS_TAG],
    }),
    getExpenseOrderById: builder.query<ExpenseOrder, number>({
      query: (id) => `expense-orders/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'ExpenseOrder', id }],
    }),
    createExpenseOrder: builder.mutation<ExpenseOrder, CreateExpenseOrder>({
      query: (body) => ({ url: 'expense-orders/', method: 'POST', body }),
      invalidatesTags: expenseOrderListCacheTags,
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
      invalidatesTags: expenseOrderListCacheTags,
    }),
    updateExpenseOrder: builder.mutation<ExpenseOrder, { id: number; data: UpdateExpenseOrder }>({
      query: ({ id, data }) => ({ url: `expense-orders/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        ...expenseOrderCacheTagsForMutation(id),
        { type: 'ExpenseOrderApprovers', id },
        { type: 'ExpenseOrderEvents', id },
      ],
    }),
    markExpenseOrderComplete: builder.mutation<ExpenseOrder, number>({
      query: (id) => ({ url: `expense-orders/${id}/complete/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        ...expenseOrderCacheTagsForMutation(id),
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
        ...expenseOrderCacheTagsForMutation(id),
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
      invalidatesTags: expenseOrderListCacheTags,
    }),
    createInvoiceFromExpenseOrder: builder.mutation<ExpenseOrder, number>({
      query: (id) => ({ url: `expense-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        ...expenseOrderCacheTagsForMutation(id),
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
        ...expenseOrderCacheTagsForMutation(eoId),
      ],
    }),
    unapproveExpenseOrder: builder.mutation<ExpenseOrderApprover, number>({
      query: (eoId) => ({ url: `expense-orders/${eoId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, eoId) => [
        { type: 'ExpenseOrderApprovers', id: eoId },
        { type: 'ExpenseOrderEvents', id: eoId },
        ...expenseOrderCacheTagsForMutation(eoId),
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
        ...expenseOrderListCacheTags,
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
        ...expenseOrderListCacheTags,
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
        ...expenseOrderListCacheTags,
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
  useGetExpenseOrdersPageQuery,
  useGetExpenseOrderHubStatsQuery,
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
