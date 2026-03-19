import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  MachineMaintenanceLog,
  CreateMachineMaintenanceLogRequest,
  UpdateMachineMaintenanceLogRequest,
  ListMachineMaintenanceLogsParams,
} from '../../types/machineMaintenanceLog';

export const machineMaintenanceLogsApi = createApi({
  reducerPath: 'machineMaintenanceLogsApi',
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
        return `/machine-maintenance-logs?${params.toString()}`;
      },
      providesTags: ['MachineMaintenanceLog'],
    }),
    getMachineMaintenanceLogById: builder.query<MachineMaintenanceLog, number>({
      query: (id) => `/machine-maintenance-logs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MachineMaintenanceLog', id }],
    }),
    createMachineMaintenanceLog: builder.mutation<MachineMaintenanceLog, CreateMachineMaintenanceLogRequest>({
      query: (body) => ({
        url: '/machine-maintenance-logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MachineMaintenanceLog'],
    }),
    updateMachineMaintenanceLog: builder.mutation<MachineMaintenanceLog, { id: number; data: UpdateMachineMaintenanceLogRequest }>({
      query: ({ id, data }) => ({
        url: `/machine-maintenance-logs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'MachineMaintenanceLog', id }, 'MachineMaintenanceLog'],
    }),
    deleteMachineMaintenanceLog: builder.mutation<void, number>({
      query: (id) => ({
        url: `/machine-maintenance-logs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MachineMaintenanceLog'],
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
