import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import {
  Machine,
  CreateMachineRequest,
  UpdateMachineRequest,
  ListMachinesParams,
  MachineEvent,
  CreateMachineEventRequest,
  ListMachineEventsParams,
} from '../../types/machine';

export const machinesApi = createApi({
  reducerPath: 'machinesApi',
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
  tagTypes: ['Machine', 'MachineEvent'],
  endpoints: (builder) => ({
    // ==================== MACHINE CRUD ====================
    getMachines: builder.query<Machine[], ListMachinesParams>({
      query: ({ skip = 0, limit = 100, factory_section_id, is_running, search } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (factory_section_id) {
          params.append('factory_section_id', factory_section_id.toString());
        }
        if (is_running !== undefined) {
          params.append('is_running', is_running.toString());
        }
        if (search) {
          params.append('search', search);
        }
        return `/machines?${params.toString()}`;
      },
      providesTags: ['Machine'],
    }),
    getMachineById: builder.query<Machine, number>({
      query: (id) => `/machines/${id}`,
      providesTags: (result, error, id) => [{ type: 'Machine', id }],
    }),
    createMachine: builder.mutation<Machine, CreateMachineRequest>({
      query: (body) => ({
        url: '/machines',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Machine'],
    }),
    updateMachine: builder.mutation<Machine, { id: number; data: UpdateMachineRequest }>({
      query: ({ id, data }) => ({
        url: `/machines/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Machine', id }, 'Machine'],
    }),
    deleteMachine: builder.mutation<Machine, number>({
      query: (id) => ({
        url: `/machines/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Machine'],
    }),

    // ==================== MACHINE EVENTS ====================
    getMachineEvents: builder.query<MachineEvent[], ListMachineEventsParams>({
      query: ({ machine_id, event_type, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (event_type) {
          params.append('event_type', event_type);
        }
        return `/machines/${machine_id}/events?${params.toString()}`;
      },
      providesTags: (result, error, { machine_id }) => [{ type: 'MachineEvent', id: machine_id }],
    }),
    getLatestMachineEvent: builder.query<MachineEvent, number>({
      query: (machine_id) => `/machines/${machine_id}/events/latest`,
      providesTags: (result, error, machine_id) => [{ type: 'MachineEvent', id: machine_id }],
    }),
    createMachineEvent: builder.mutation<MachineEvent, { machine_id: number; data: CreateMachineEventRequest }>({
      query: ({ machine_id, data }) => ({
        url: `/machines/${machine_id}/events`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { machine_id }) => [
        { type: 'MachineEvent', id: machine_id },
        'Machine',
      ],
    }),
  }),
});

export const {
  useGetMachinesQuery,
  useGetMachineByIdQuery,
  useCreateMachineMutation,
  useUpdateMachineMutation,
  useDeleteMachineMutation,
  useGetMachineEventsQuery,
  useGetLatestMachineEventQuery,
  useCreateMachineEventMutation,
} = machinesApi;
