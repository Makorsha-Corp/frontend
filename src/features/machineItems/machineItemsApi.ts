import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  MachineItem,
  CreateMachineItemRequest,
  UpdateMachineItemRequest,
  ListMachineItemsParams,
} from '../../types/machineItem';

export const machineItemsApi = createApi({
  reducerPath: 'machineItemsApi',
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
  tagTypes: ['MachineItem'],
  endpoints: (builder) => ({
    getMachineItems: builder.query<MachineItem[], ListMachineItemsParams>({
      query: ({ skip = 0, limit = 100, machine_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (machine_id) {
          params.append('machine_id', machine_id.toString());
        }
        return `/machine-items?${params.toString()}`;
      },
      providesTags: ['MachineItem'],
    }),
    getMachineItemById: builder.query<MachineItem, number>({
      query: (id) => `/machine-items/${id}`,
      providesTags: (result, error, id) => [{ type: 'MachineItem', id }],
    }),
    createMachineItem: builder.mutation<MachineItem, CreateMachineItemRequest>({
      query: (body) => ({
        url: '/machine-items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MachineItem'],
    }),
    updateMachineItem: builder.mutation<MachineItem, { id: number; data: UpdateMachineItemRequest }>({
      query: ({ id, data }) => ({
        url: `/machine-items/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'MachineItem', id }, 'MachineItem'],
    }),
    deleteMachineItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `/machine-items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MachineItem'],
    }),
  }),
});

export const {
  useGetMachineItemsQuery,
  useGetMachineItemByIdQuery,
  useCreateMachineItemMutation,
  useUpdateMachineItemMutation,
  useDeleteMachineItemMutation,
} = machineItemsApi;
