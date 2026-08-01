import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  Inventory,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  ListInventoryParams,
  InventoryListResponse,
  InventoryStatsResponse,
} from '../../types/inventory';
import type { ItemIncomingSummary } from '../../types/inventoryIncoming';
import { ledgersApi } from '../ledgers/ledgersApi';

function buildInventoryQueryString(params: ListInventoryParams = {}): string {
  const {
    skip = 0,
    limit = 100,
    inventory_type,
    factory_id,
    search,
    item_id,
    include_zero_qty,
  } = params;
  const qs = new URLSearchParams();
  qs.append('skip', skip.toString());
  qs.append('limit', limit.toString());
  if (inventory_type) qs.append('inventory_type', inventory_type);
  if (factory_id != null) qs.append('factory_id', factory_id.toString());
  if (search) qs.append('search', search);
  if (item_id != null) qs.append('item_id', item_id.toString());
  if (include_zero_qty) qs.append('include_zero_qty', 'true');
  return qs.toString();
}

function buildInventoryStatsQueryString(
  params: Omit<ListInventoryParams, 'skip' | 'limit'> = {},
): string {
  const { inventory_type, factory_id, search, item_id, include_zero_qty } = params;
  const qs = new URLSearchParams();
  if (inventory_type) qs.append('inventory_type', inventory_type);
  if (factory_id != null) qs.append('factory_id', factory_id.toString());
  if (search) qs.append('search', search);
  if (item_id != null) qs.append('item_id', item_id.toString());
  if (include_zero_qty) qs.append('include_zero_qty', 'true');
  return qs.toString();
}

function normalizeInventoryListResponse(
  response: InventoryListResponse | Inventory[],
  params: ListInventoryParams = {},
): InventoryListResponse {
  if (Array.isArray(response)) {
    const skip = params.skip ?? 0;
    const limit = params.limit ?? response.length;
    return {
      items: response.slice(skip, skip + limit),
      total: response.length,
      skip,
      limit,
      has_more: skip + limit < response.length,
    };
  }
  return response;
}

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Inventory', 'InventoryStats', 'IncomingSummary'],
  endpoints: (builder) => ({
    getInventoryList: builder.query<Inventory[], ListInventoryParams>({
      query: (params = {}) => `inventory/?${buildInventoryQueryString(params)}`,
      transformResponse: (response: InventoryListResponse | Inventory[], _meta, arg) =>
        normalizeInventoryListResponse(response, arg).items,
      providesTags: ['Inventory'],
    }),
    getInventoryPage: builder.query<InventoryListResponse, ListInventoryParams>({
      query: (params) => `inventory/?${buildInventoryQueryString(params)}`,
      transformResponse: (response: InventoryListResponse | Inventory[], _meta, arg) =>
        normalizeInventoryListResponse(response, arg),
      providesTags: ['Inventory'],
    }),
    getInventoryStats: builder.query<
      InventoryStatsResponse,
      Omit<ListInventoryParams, 'skip' | 'limit'>
    >({
      query: (params = {}) => `inventory/stats/?${buildInventoryStatsQueryString(params)}`,
      providesTags: ['InventoryStats'],
    }),
    getIncomingSummary: builder.query<ItemIncomingSummary[], { factory_id?: number }>({
      query: ({ factory_id } = {}) => {
        const params = new URLSearchParams();
        if (factory_id != null) {
          params.append('factory_id', factory_id.toString());
        }
        const qs = params.toString();
        return qs ? `inventory/incoming-summary/?${qs}` : 'inventory/incoming-summary/';
      },
      providesTags: ['IncomingSummary'],
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
      invalidatesTags: ['Inventory', 'InventoryStats'],
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
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Inventory', id },
        'Inventory',
        'InventoryStats',
      ],
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
      invalidatesTags: ['Inventory', 'InventoryStats'],
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
  useGetInventoryPageQuery,
  useGetInventoryStatsQuery,
  useGetIncomingSummaryQuery,
  useGetInventoryByIdQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} = inventoryApi;
