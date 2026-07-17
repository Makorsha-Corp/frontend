import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { WorkOrder } from '@/types/workOrder';
import type {
  WorkOrderSchedule,
  StageWorkOrderDayRequest,
  ListWorkOrderSchedulesParams,
} from '@/types/workOrderSchedule';

export const workOrderSchedulesApi = createApi({
  reducerPath: 'workOrderSchedulesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WorkOrderSchedule', 'WorkOrder'],
  endpoints: (builder) => ({
    getWorkOrderSchedules: builder.query<WorkOrderSchedule[], ListWorkOrderSchedulesParams>({
      query: ({
        factory_id,
        machine_id,
        start_date_from,
        start_date_to,
        status,
        skip = 0,
        limit = 1000,
      } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', String(skip));
        params.append('limit', String(limit));
        if (factory_id) params.append('factory_id', String(factory_id));
        if (machine_id) params.append('machine_id', String(machine_id));
        if (start_date_from) params.append('start_date_from', start_date_from);
        if (start_date_to) params.append('start_date_to', start_date_to);
        if (status) params.append('status', status);
        return `work-order-schedules/?${params.toString()}`;
      },
      providesTags: ['WorkOrderSchedule'],
    }),
    stageWorkOrderDay: builder.mutation<WorkOrderSchedule[], StageWorkOrderDayRequest>({
      query: (body) => ({
        url: 'work-order-schedules/stage-day/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WorkOrderSchedule'],
    }),
    confirmWorkOrderSchedule: builder.mutation<WorkOrder, number>({
      query: (scheduleId) => ({
        url: `work-order-schedules/${scheduleId}/confirm/`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkOrderSchedule', 'WorkOrder'],
    }),
    cancelWorkOrderSchedule: builder.mutation<WorkOrderSchedule, number>({
      query: (scheduleId) => ({
        url: `work-order-schedules/${scheduleId}/cancel/`,
        method: 'POST',
      }),
      invalidatesTags: ['WorkOrderSchedule'],
    }),
  }),
});

export const {
  useGetWorkOrderSchedulesQuery,
  useStageWorkOrderDayMutation,
  useConfirmWorkOrderScheduleMutation,
  useCancelWorkOrderScheduleMutation,
} = workOrderSchedulesApi;
