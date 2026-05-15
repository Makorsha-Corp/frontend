import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  Inventory,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  ListInventoryParams,
} from '../../types/inventory';
import { ledgersApi } from '../ledgers/ledgersApi';

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
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
  tagTypes: ['Inventory'],
  endpoints: (builder) => ({
    getInventoryList: builder.query<Inventory[], ListInventoryParams>({
      query: ({ skip = 0, limit = 100, inventory_type, factory_id } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (inventory_type) {
          params.append('inventory_type', inventory_type);
        }
        if (factory_id) {
          params.append('factory_id', factory_id.toString());
        }
        return `inventory/?${params.toString()}`;
      },
      providesTags: ['Inventory'],
    }),
    getInventoryById: builder.query<Inventory, number>({
      query: (id) => `inventory/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Inventory', id }],
    }),
    createInventory: builder.mutation<Inventory, CreateInventoryRequest>({
      query: (body) => ({
        url: 'inventory/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          /* noop */
        }
      },
    }),
    updateInventory: builder.mutation<Inventory, { id: number; data: UpdateInventoryRequest }>({
      query: ({ id, data }) => ({
        url: `inventory/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Inventory', id }, 'Inventory'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          /* noop */
        }
      },
    }),
    deleteInventory: builder.mutation<void, number>({
      query: (id) => ({
        url: `inventory/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance']));
        } catch {
          /* noop */
        }
      },
    }),
  }),
});

export const {
  useGetInventoryListQuery,
  useGetInventoryByIdQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} = inventoryApi;
