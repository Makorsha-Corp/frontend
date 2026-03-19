import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  WorkOrder,
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  ListWorkOrdersParams,
  WorkOrderItem,
  CreateWorkOrderItemRequest,
  UpdateWorkOrderItemRequest,
} from '../../types/workOrder';

export const workOrdersApi = createApi({
  reducerPath: 'workOrdersApi',
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
  tagTypes: ['WorkOrder', 'WorkOrderItem'],
  endpoints: (builder) => ({
    getWorkOrders: builder.query<WorkOrder[], ListWorkOrdersParams>({
      query: ({ skip = 0, limit = 100, work_type, status, priority, factory_id, machine_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (work_type) params.append('work_type', work_type);
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (factory_id) params.append('factory_id', factory_id.toString());
        if (machine_id) params.append('machine_id', machine_id.toString());
        return `/work-orders?${params.toString()}`;
      },
      providesTags: ['WorkOrder'],
    }),
    getWorkOrderById: builder.query<WorkOrder, number>({
      query: (id) => `/work-orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'WorkOrder', id }],
    }),
    createWorkOrder: builder.mutation<WorkOrder, CreateWorkOrderRequest>({
      query: (body) => ({
        url: '/work-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    updateWorkOrder: builder.mutation<WorkOrder, { id: number; data: UpdateWorkOrderRequest }>({
      query: ({ id, data }) => ({
        url: `/work-orders/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'WorkOrder', id }, 'WorkOrder'],
    }),
    deleteWorkOrder: builder.mutation<void, number>({
      query: (id) => ({
        url: `/work-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkOrder'],
    }),
    // Work Order Items
    getWorkOrderItems: builder.query<WorkOrderItem[], number>({
      query: (woId) => `/work-orders/${woId}/items`,
      providesTags: (_result, _error, woId) => [{ type: 'WorkOrderItem', id: woId }],
    }),
    addWorkOrderItem: builder.mutation<WorkOrderItem, { woId: number; data: Omit<CreateWorkOrderItemRequest, 'work_order_id'> }>({
      query: ({ woId, data }) => ({
        url: `/work-orders/${woId}/items`,
        method: 'POST',
        body: { ...data, work_order_id: woId },
      }),
      invalidatesTags: (_result, _error, { woId }) => [{ type: 'WorkOrderItem', id: woId }],
    }),
    updateWorkOrderItem: builder.mutation<WorkOrderItem, { itemId: number; data: UpdateWorkOrderItemRequest }>({
      query: ({ itemId, data }) => ({
        url: `/work-orders/items/${itemId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['WorkOrderItem'],
    }),
    removeWorkOrderItem: builder.mutation<void, number>({
      query: (itemId) => ({
        url: `/work-orders/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkOrderItem'],
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useDeleteWorkOrderMutation,
  useGetWorkOrderItemsQuery,
  useAddWorkOrderItemMutation,
  useUpdateWorkOrderItemMutation,
  useRemoveWorkOrderItemMutation,
} = workOrdersApi;
