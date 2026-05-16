import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  MachineItem,
  CreateMachineItemRequest,
  UpdateMachineItemRequest,
  ListMachineItemsParams,
} from '../../types/machineItem';
import { ledgersApi } from '../ledgers/ledgersApi';

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
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        // Backend writes a ledger row on create — refresh ledger views.
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          // Ignore: mutation already surfaced the error via RTK Query.
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
        // qty changes trigger a ledger adjustment row on the backend.
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          // Ignore: mutation already surfaced the error via RTK Query.
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
        // A delete with remaining stock writes a final adjustment row.
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          // Ignore: mutation already surfaced the error via RTK Query.
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
