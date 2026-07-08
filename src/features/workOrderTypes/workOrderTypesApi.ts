import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  WorkOrderType,
  CreateWorkOrderTypeRequest,
  UpdateWorkOrderTypeRequest,
  ListWorkOrderTypesParams,
} from '@/types/workOrderType';

export const workOrderTypesApi = createApi({
  reducerPath: 'workOrderTypesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkOrderType'],
  endpoints: (builder) => ({
    getWorkOrderTypes: builder.query<WorkOrderType[], ListWorkOrderTypesParams>({
      query: ({ skip = 0, limit = 100, search } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (search) {
          params.append('search', search);
        }
        return `work-order-types/?${params.toString()}`;
      },
      providesTags: ['WorkOrderType'],
    }),
    getWorkOrderTypeById: builder.query<WorkOrderType, number>({
      query: (id) => `work-order-types/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'WorkOrderType', id }],
    }),
    createWorkOrderType: builder.mutation<WorkOrderType, CreateWorkOrderTypeRequest>({
      query: (body) => ({
        url: 'work-order-types/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrderType'],
    }),
    updateWorkOrderType: builder.mutation<WorkOrderType, { id: number; data: UpdateWorkOrderTypeRequest }>({
      query: ({ id, data }) => ({
        url: `work-order-types/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'WorkOrderType', id }, 'WorkOrderType'],
    }),
    deleteWorkOrderType: builder.mutation<WorkOrderType, number>({
      query: (id) => ({
        url: `work-order-types/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['WorkOrderType'],
    }),
  }),
});

export const {
  useGetWorkOrderTypesQuery,
  useGetWorkOrderTypeByIdQuery,
  useCreateWorkOrderTypeMutation,
  useUpdateWorkOrderTypeMutation,
  useDeleteWorkOrderTypeMutation,
} = workOrderTypesApi;
