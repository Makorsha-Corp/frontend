import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { accountInvoicesApi } from '../accountInvoices/accountInvoicesApi';
import type {
  WorkOrder,
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  ListWorkOrdersParams,
  WorkOrderItem,
  CreateWorkOrderItemRequest,
  UpdateWorkOrderItemRequest,
  WorkOrderApproversList,
  WorkOrderApprover,
  WorkOrderEvent,
  WorkOrderCompleteRequest,
} from '../../types/workOrder';
import type { CreateWorkOrderFromTemplate, GenerateWorkOrderDraftsRequest } from '../../types/workOrderTemplate';
import type { WorkOrderSheetBundle, WorkOrderSheetEntryRequest, ListWorkOrderSheetParams, ListWorkOrderSheetDailyCountsParams, WorkOrderSheetDailyCountsResponse } from '../../types/workOrderSheet';

export const workOrdersApi = createApi({
  reducerPath: 'workOrdersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkOrder', 'WorkOrderItem', 'WorkOrderApprovers', 'WorkOrderEvents', 'Notification'],
  endpoints: (builder) => ({
    getWorkOrders: builder.query<WorkOrder[], ListWorkOrdersParams>({
      query: ({ skip = 0, limit = 100, work_order_type_id, status, priority, factory_id, machine_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (work_order_type_id) params.append('work_order_type_id', work_order_type_id.toString());
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (factory_id) params.append('factory_id', factory_id.toString());
        if (machine_id) params.append('machine_id', machine_id.toString());
        return `work-orders/?${params.toString()}`;
      },
      providesTags: ['WorkOrder'],
    }),
    getWorkOrderById: builder.query<WorkOrder, number>({
      query: (id) => `work-orders/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'WorkOrder', id }],
    }),
    createWorkOrder: builder.mutation<WorkOrder, CreateWorkOrderRequest>({
      query: (body) => ({
        url: 'work-orders/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    createWorkOrderFromTemplate: builder.mutation<WorkOrder, { templateId: number; data: CreateWorkOrderFromTemplate }>({
      query: ({ templateId, data }) => ({
        url: `work-orders/from-template/${templateId}/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    getWorkOrdersSheet: builder.query<WorkOrderSheetBundle[], ListWorkOrderSheetParams>({
      query: ({ factory_id, machine_id, start_date_from, start_date_to, skip = 0, limit = 1000 } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', String(skip));
        params.append('limit', String(limit));
        if (factory_id) params.append('factory_id', String(factory_id));
        if (machine_id) params.append('machine_id', String(machine_id));
        if (start_date_from) params.append('start_date_from', start_date_from);
        if (start_date_to) params.append('start_date_to', start_date_to);
        return `work-orders/sheet/?${params.toString()}`;
      },
      providesTags: ['WorkOrder', 'WorkOrderItem'],
    }),
    getWorkOrderSheetDailyCounts: builder.query<
      Record<string, number>,
      ListWorkOrderSheetDailyCountsParams
    >({
      query: ({
        factory_id,
        machine_id,
        start_date_from,
        start_date_to,
        status,
        work_order_type_id,
        priority,
      } = {}) => {
        const params = new URLSearchParams();
        if (factory_id) params.append('factory_id', String(factory_id));
        if (machine_id) params.append('machine_id', String(machine_id));
        if (start_date_from) params.append('start_date_from', start_date_from);
        if (start_date_to) params.append('start_date_to', start_date_to);
        if (status) params.append('status', status);
        if (work_order_type_id) params.append('work_order_type_id', String(work_order_type_id));
        if (priority) params.append('priority', priority);
        return `work-orders/sheet/daily-counts/?${params.toString()}`;
      },
      transformResponse: (response: WorkOrderSheetDailyCountsResponse) => response.counts,
      providesTags: ['WorkOrder'],
    }),
    createWorkOrderSheetEntry: builder.mutation<WorkOrder, WorkOrderSheetEntryRequest>({
      query: (body) => ({
        url: 'work-orders/sheet-entry/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrder', 'WorkOrderItem'],
    }),
    updateWorkOrder: builder.mutation<WorkOrder, { id: number; data: UpdateWorkOrderRequest }>({
      query: ({ id, data }) => ({
        url: `work-orders/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'WorkOrder', id },
        'WorkOrder',
        { type: 'WorkOrderApprovers', id },
        { type: 'WorkOrderEvents', id },
        'Notification',
      ],
    }),
    startWorkOrder: builder.mutation<WorkOrder, number>({
      query: (id) => ({ url: `work-orders/${id}/start/`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'WorkOrder', id },
        'WorkOrder',
        { type: 'WorkOrderItem', id },
        { type: 'WorkOrderEvents', id },
      ],
    }),
    completeWorkOrder: builder.mutation<WorkOrder, { id: number; data?: WorkOrderCompleteRequest }>({
      query: ({ id, data }) => ({ url: `work-orders/${id}/complete/`, method: 'POST', body: data ?? {} }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'WorkOrder', id },
        'WorkOrder',
        { type: 'WorkOrderEvents', id },
      ],
    }),
    voidWorkOrder: builder.mutation<WorkOrder, { id: number; void_note: string }>({
      query: ({ id, void_note }) => ({ url: `work-orders/${id}/void/`, method: 'POST', body: { void_note } }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'WorkOrder', id },
        'WorkOrder',
        { type: 'WorkOrderItem', id },
        { type: 'WorkOrderEvents', id },
        { type: 'WorkOrderApprovers', id },
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(accountInvoicesApi.util.invalidateTags(['AccountInvoice']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    deleteWorkOrder: builder.mutation<WorkOrder, number>({
      query: (id) => ({
        url: `work-orders/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    createInvoiceFromWorkOrder: builder.mutation<WorkOrder, number>({
      query: (id) => ({ url: `work-orders/${id}/create-invoice`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'WorkOrder', id },
        'WorkOrder',
        { type: 'WorkOrderEvents', id },
        'Notification',
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(accountInvoicesApi.util.invalidateTags(['AccountInvoice']));
        } catch {
          /* mutation failed */
        }
      },
    }),
    // Approvers
    getWorkOrderApprovers: builder.query<WorkOrderApproversList, number>({
      query: (woId) => `work-orders/${woId}/approvers/`,
      providesTags: (_r, _e, woId) => [{ type: 'WorkOrderApprovers', id: woId }],
    }),
    addWorkOrderApprover: builder.mutation<WorkOrderApprover, { woId: number; user_id: number }>({
      query: ({ woId, user_id }) => ({
        url: `work-orders/${woId}/approvers/`,
        method: 'POST',
        body: { user_id },
      }),
      invalidatesTags: (_r, _e, { woId }) => [
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        { type: 'WorkOrder', id: woId },
        'WorkOrder',
        'Notification',
      ],
    }),
    removeWorkOrderApprover: builder.mutation<void, { woId: number; userId: number }>({
      query: ({ woId, userId }) => ({
        url: `work-orders/${woId}/approvers/${userId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { woId }) => [
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        { type: 'WorkOrder', id: woId },
        'WorkOrder',
      ],
    }),
    approveWorkOrder: builder.mutation<WorkOrderApprover, number>({
      query: (woId) => ({ url: `work-orders/${woId}/approvers/me/approve/`, method: 'POST' }),
      invalidatesTags: (_r, _e, woId) => [
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        { type: 'WorkOrder', id: woId },
        'WorkOrder',
        'Notification',
      ],
    }),
    unapproveWorkOrder: builder.mutation<WorkOrderApprover, number>({
      query: (woId) => ({ url: `work-orders/${woId}/approvers/me/approve/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, woId) => [
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        { type: 'WorkOrder', id: woId },
        'WorkOrder',
      ],
    }),
    getWorkOrderEvents: builder.query<WorkOrderEvent[], number>({
      query: (woId) => `work-orders/${woId}/events/`,
      providesTags: (_r, _e, woId) => [{ type: 'WorkOrderEvents', id: woId }],
    }),
    // Work Order Items
    getWorkOrderItems: builder.query<WorkOrderItem[], number>({
      query: (woId) => `work-orders/${woId}/items/`,
      providesTags: (_result, _error, woId) => [{ type: 'WorkOrderItem', id: woId }],
    }),
    addWorkOrderItem: builder.mutation<WorkOrderItem, { woId: number; data: Omit<CreateWorkOrderItemRequest, 'work_order_id'> }>({
      query: ({ woId, data }) => ({
        url: `work-orders/${woId}/items/`,
        method: 'POST',
        body: { ...data, work_order_id: woId },
      }),
      invalidatesTags: (_result, _error, { woId }) => [
        { type: 'WorkOrderItem', id: woId },
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        'WorkOrder',
      ],
    }),
    updateWorkOrderItem: builder.mutation<WorkOrderItem, { woId: number; itemId: number; data: UpdateWorkOrderItemRequest }>({
      query: ({ woId, itemId, data }) => ({
        url: `work-orders/${woId}/items/${itemId}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { woId }) => [
        { type: 'WorkOrderItem', id: woId },
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        'WorkOrder',
      ],
    }),
    removeWorkOrderItem: builder.mutation<void, { woId: number; itemId: number }>({
      query: ({ woId, itemId }) => ({
        url: `work-orders/${woId}/items/${itemId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { woId }) => [
        { type: 'WorkOrderItem', id: woId },
        { type: 'WorkOrderApprovers', id: woId },
        { type: 'WorkOrderEvents', id: woId },
        'WorkOrder',
      ],
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  useCreateWorkOrderFromTemplateMutation,
  useGetWorkOrdersSheetQuery,
  useGetWorkOrderSheetDailyCountsQuery,
  useCreateWorkOrderSheetEntryMutation,
  useUpdateWorkOrderMutation,
  useStartWorkOrderMutation,
  useCompleteWorkOrderMutation,
  useVoidWorkOrderMutation,
  useDeleteWorkOrderMutation,
  useCreateInvoiceFromWorkOrderMutation,
  useGetWorkOrderApproversQuery,
  useAddWorkOrderApproverMutation,
  useRemoveWorkOrderApproverMutation,
  useApproveWorkOrderMutation,
  useUnapproveWorkOrderMutation,
  useGetWorkOrderEventsQuery,
  useGetWorkOrderItemsQuery,
  useAddWorkOrderItemMutation,
  useUpdateWorkOrderItemMutation,
  useRemoveWorkOrderItemMutation,
} = workOrdersApi;
