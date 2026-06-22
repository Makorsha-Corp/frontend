import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  MachineMaintenanceLog,
  CreateMachineMaintenanceLogRequest,
  UpdateMachineMaintenanceLogRequest,
  ListMachineMaintenanceLogsParams,
} from '../../types/machineMaintenanceLog';
import { machinesApi } from '../machines/machinesApi';

export const machineMaintenanceLogsApi = createApi({
  reducerPath: 'machineMaintenanceLogsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['MachineMaintenanceLog'],
  endpoints: (builder) => ({
    getMachineMaintenanceLogs: builder.query<MachineMaintenanceLog[], ListMachineMaintenanceLogsParams>({
      query: ({ skip = 0, limit = 100, machine_id, maintenance_type } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (machine_id) {
          params.append('machine_id', machine_id.toString());
        }
        if (maintenance_type) {
          params.append('maintenance_type', maintenance_type);
        }
        return `machine-maintenance-logs/?${params.toString()}`;
      },
      providesTags: ['MachineMaintenanceLog'],
    }),
    getMachineMaintenanceLogById: builder.query<MachineMaintenanceLog, number>({
      query: (id) => `machine-maintenance-logs/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'MachineMaintenanceLog', id }],
    }),
    createMachineMaintenanceLog: builder.mutation<MachineMaintenanceLog, CreateMachineMaintenanceLogRequest>({
      query: (body) => ({
        url: 'machine-maintenance-logs/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MachineMaintenanceLog'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            machinesApi.util.invalidateTags([{ type: 'MachineActivity', id: arg.machine_id }])
          );
        } catch {
          // Ignore
        }
      },
    }),
    updateMachineMaintenanceLog: builder.mutation<MachineMaintenanceLog, { id: number; data: UpdateMachineMaintenanceLogRequest }>({
      query: ({ id, data }) => ({
        url: `machine-maintenance-logs/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'MachineMaintenanceLog', id }, 'MachineMaintenanceLog'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            machinesApi.util.invalidateTags([{ type: 'MachineActivity', id: data.machine_id }])
          );
        } catch {
          // Ignore
        }
      },
    }),
    deleteMachineMaintenanceLog: builder.mutation<void, number>({
      query: (id) => ({
        url: `machine-maintenance-logs/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MachineMaintenanceLog'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(machinesApi.util.invalidateTags([{ type: 'MachineActivity' }]));
        } catch {
          // Ignore
        }
      },
    }),
  }),
});

export const {
  useGetMachineMaintenanceLogsQuery,
  useGetMachineMaintenanceLogByIdQuery,
  useCreateMachineMaintenanceLogMutation,
  useUpdateMachineMaintenanceLogMutation,
  useDeleteMachineMaintenanceLogMutation,
} = machineMaintenanceLogsApi;
