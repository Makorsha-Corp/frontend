import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  WorkOrderTemplate,
  WorkOrderTemplateItem,
  WorkOrderTemplateApprover,
  CreateWorkOrderTemplate,
  UpdateWorkOrderTemplate,
  CreateWorkOrderTemplateItem,
  UpdateWorkOrderTemplateItem,
  ListWorkOrderTemplatesParams,
  GenerateWorkOrderDraftsRequest,
} from '@/types/workOrderTemplate';
import type { WorkOrder } from '@/types/workOrder';

export const workOrderTemplatesApi = createApi({
  reducerPath: 'workOrderTemplatesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkOrderTemplate', 'WorkOrderTemplateItem', 'WorkOrderTemplateApprover'],
  endpoints: (builder) => ({
    getWorkOrderTemplates: builder.query<WorkOrderTemplate[], ListWorkOrderTemplatesParams>({
      query: ({ skip = 0, limit = 100, is_active, work_order_type_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (is_active !== undefined) params.append('is_active', is_active.toString());
        if (work_order_type_id) params.append('work_order_type_id', work_order_type_id.toString());
        return `work-order-templates/?${params.toString()}`;
      },
      providesTags: ['WorkOrderTemplate'],
    }),
    getWorkOrderTemplateById: builder.query<WorkOrderTemplate, number>({
      query: (id) => `work-order-templates/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'WorkOrderTemplate', id }],
    }),
    createWorkOrderTemplate: builder.mutation<WorkOrderTemplate, CreateWorkOrderTemplate>({
      query: (body) => ({ url: 'work-order-templates/', method: 'POST', body }),
      invalidatesTags: ['WorkOrderTemplate'],
    }),
    updateWorkOrderTemplate: builder.mutation<WorkOrderTemplate, { id: number; data: UpdateWorkOrderTemplate }>({
      query: ({ id, data }) => ({ url: `work-order-templates/${id}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WorkOrderTemplate', id }, 'WorkOrderTemplate', 'WorkOrderTemplateApprover'],
    }),
    deleteWorkOrderTemplate: builder.mutation<void, number>({
      query: (id) => ({ url: `work-order-templates/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['WorkOrderTemplate'],
    }),
    restoreWorkOrderTemplate: builder.mutation<WorkOrderTemplate, number>({
      query: (id) => ({ url: `work-order-templates/${id}/restore/`, method: 'POST' }),
      invalidatesTags: ['WorkOrderTemplate'],
    }),
    // Items
    getWorkOrderTemplateItems: builder.query<WorkOrderTemplateItem[], number>({
      query: (tplId) => `work-order-templates/${tplId}/items/`,
      providesTags: (_r, _e, tplId) => [{ type: 'WorkOrderTemplateItem', id: tplId }],
    }),
    addWorkOrderTemplateItem: builder.mutation<WorkOrderTemplateItem, { tplId: number; data: CreateWorkOrderTemplateItem }>({
      query: ({ tplId, data }) => ({ url: `work-order-templates/${tplId}/items/`, method: 'POST', body: data }),
      invalidatesTags: (_r, _e, { tplId }) => [{ type: 'WorkOrderTemplateItem', id: tplId }],
    }),
    updateWorkOrderTemplateItem: builder.mutation<WorkOrderTemplateItem, { tplId: number; itemId: number; data: UpdateWorkOrderTemplateItem }>({
      query: ({ itemId, data }) => ({ url: `work-order-templates/items/${itemId}/`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { tplId }) => [{ type: 'WorkOrderTemplateItem', id: tplId }],
    }),
    removeWorkOrderTemplateItem: builder.mutation<void, { tplId: number; itemId: number }>({
      query: ({ itemId }) => ({ url: `work-order-templates/items/${itemId}/`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { tplId }) => [{ type: 'WorkOrderTemplateItem', id: tplId }],
    }),
    // Approvers
    getWorkOrderTemplateApprovers: builder.query<WorkOrderTemplateApprover[], number>({
      query: (tplId) => `work-order-templates/${tplId}/approvers/`,
      providesTags: (_r, _e, tplId) => [{ type: 'WorkOrderTemplateApprover', id: tplId }],
    }),
    generateWorkOrderDrafts: builder.mutation<WorkOrder[], GenerateWorkOrderDraftsRequest>({
      query: (body) => ({
        url: 'work-order-templates/generate-drafts/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrder', 'WorkOrderTemplate'],
    }),
  }),
});

export const {
  useGetWorkOrderTemplatesQuery,
  useGetWorkOrderTemplateByIdQuery,
  useCreateWorkOrderTemplateMutation,
  useUpdateWorkOrderTemplateMutation,
  useDeleteWorkOrderTemplateMutation,
  useRestoreWorkOrderTemplateMutation,
  useGetWorkOrderTemplateItemsQuery,
  useAddWorkOrderTemplateItemMutation,
  useUpdateWorkOrderTemplateItemMutation,
  useRemoveWorkOrderTemplateItemMutation,
  useGetWorkOrderTemplateApproversQuery,
  useGenerateWorkOrderDraftsMutation,
} = workOrderTemplatesApi;
