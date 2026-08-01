import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  MachineItem,
  CreateMachineItemRequest,
  UpdateMachineItemRequest,
  ListMachineItemsParams,
} from '../../types/machineItem';
import { ledgersApi } from '../ledgers/ledgersApi';
import { machinesApi } from '../machines/machinesApi';

export const machineItemsApi = createApi({
  reducerPath: 'machineItemsApi',
  baseQuery: baseQueryWithReauth,
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
        return `machine-items/?${params.toString()}`;
      },
      providesTags: ['MachineItem'],
    }),
    getMachineItemById: builder.query<MachineItem, number>({
      query: (id) => `machine-items/${id}/`,
      providesTags: (result, error, id) => [{ type: 'MachineItem', id }],
    }),
    createMachineItem: builder.mutation<MachineItem, CreateMachineItemRequest>({
      query: (body) => ({
        url: 'machine-items/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MachineItem'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
          dispatch(
            machinesApi.util.invalidateTags([{ type: 'MachineActivity', id: arg.machine_id }])
          );
        } catch {
          // Ignore
        }
      },
    }),
    updateMachineItem: builder.mutation<MachineItem, { id: number; data: UpdateMachineItemRequest }>({
      query: ({ id, data }) => ({
        url: `machine-items/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'MachineItem', id }, 'MachineItem'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
          dispatch(
            machinesApi.util.invalidateTags([{ type: 'MachineActivity', id: data.machine_id }])
          );
        } catch {
          // Ignore
        }
      },
    }),
    deleteMachineItem: builder.mutation<void, number>({
      query: (id) => ({
        url: `machine-items/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MachineItem'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
          dispatch(machinesApi.util.invalidateTags([{ type: 'MachineActivity' }]));
        } catch {
          // Ignore
        }
      },
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
