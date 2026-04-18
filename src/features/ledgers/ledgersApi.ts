import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';

export interface LedgerEntryBase {
  id: number;
  workspace_id: number;
  item_id: number;
  transaction_type: string;
  quantity: number;
  unit_cost: string | number | null;
  total_cost: string | number | null;
  qty_before: number;
  qty_after: number;
  value_before?: string | number | null;
  value_after?: string | number | null;
  avg_price_before?: string | number | null;
  avg_price_after?: string | number | null;
  source_type: string | null;
  source_id: number | null;
  order_id?: number | null;
  invoice_id?: number | null;
  transfer_source_type: string | null;
  transfer_source_id: number | null;
  transfer_destination_type: string | null;
  transfer_destination_id: number | null;
  notes: string | null;
  performed_by: number | null;
  performed_at: string;
}

export interface StorageLedgerEntry extends LedgerEntryBase {
  factory_id: number;
}

export interface DamagedLedgerEntry extends LedgerEntryBase {
  factory_id: number;
}

export interface MachineLedgerEntry extends LedgerEntryBase {
  machine_id: number;
}

export interface ProjectComponentLedgerEntry extends LedgerEntryBase {
  project_component_id: number;
}

export interface InventoryLedgerEntry extends LedgerEntryBase {
  inventory_type: string | null;
  factory_id: number;
}

export interface LedgerBalanceResponse {
  quantity: number;
  total_value?: string | number | null;
  average_price?: string | number | null;
  [key: string]: unknown;
}

export interface LedgerReconcileResponse {
  message?: string;
  adjustment_made?: boolean;
  [key: string]: unknown;
}

export interface ProjectComponentTotalCostResponse {
  project_component_id: number;
  total_cost: number | string;
  total_quantity?: number;
  entry_count?: number;
}

export interface ItemMovementReportEntry {
  [key: string]: unknown;
}

export interface UserTransactionReportEntry {
  [key: string]: unknown;
}

export interface OrderTransactionReportEntry {
  [key: string]: unknown;
}

export interface StorageDamagedQueryParams {
  factory_id: number;
  item_id: number;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

export interface InventoryQueryParams extends StorageDamagedQueryParams {
  transaction_type?: string;
}

export interface MachineQueryParams {
  machine_id: number;
  item_id: number;
  start_date?: string;
  end_date?: string;
  transaction_type?: string;
  skip?: number;
  limit?: number;
}

export interface ProjectComponentQueryParams {
  project_component_id: number;
  item_id?: number;
  skip?: number;
  limit?: number;
}

export interface LedgerBalanceByFactoryParams {
  factory_id: number;
  item_id: number;
}

export interface LedgerBalanceByMachineParams {
  machine_id: number;
  item_id: number;
}

export interface ItemMovementReportParams {
  item_id: number;
  start_date?: string;
  end_date?: string;
}

export interface UserTransactionsReportParams {
  user_id: number;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

export const ledgersApi = createApi({
  reducerPath: 'ledgersApi',
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
  tagTypes: ['Ledger', 'LedgerBalance', 'ProjectComponentCost', 'LedgerReports'],
  endpoints: (builder) => ({
    getStorageLedger: builder.query<StorageLedgerEntry[], InventoryQueryParams>({
      query: ({ factory_id, item_id, start_date, end_date, transaction_type, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('factory_id', factory_id.toString());
        params.append('item_id', item_id.toString());
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        if (transaction_type) params.append('transaction_type', transaction_type);
        return `ledgers/storage/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getStorageBalance: builder.query<LedgerBalanceResponse, LedgerBalanceByFactoryParams>({
      query: ({ factory_id, item_id }) =>
        `ledgers/storage/balance/?factory_id=${factory_id}&item_id=${item_id}`,
      providesTags: ['LedgerBalance'],
    }),
    reconcileStorage: builder.mutation<LedgerReconcileResponse, LedgerBalanceByFactoryParams>({
      query: ({ factory_id, item_id }) => ({
        url: `ledgers/storage/reconcile/?factory_id=${factory_id}&item_id=${item_id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Ledger', 'LedgerBalance'],
    }),

    getMachineLedger: builder.query<MachineLedgerEntry[], MachineQueryParams>({
      query: ({ machine_id, item_id, start_date, end_date, transaction_type, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('machine_id', machine_id.toString());
        params.append('item_id', item_id.toString());
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        if (transaction_type) params.append('transaction_type', transaction_type);
        return `ledgers/machine/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getMachineBalance: builder.query<LedgerBalanceResponse, LedgerBalanceByMachineParams>({
      query: ({ machine_id, item_id }) =>
        `ledgers/machine/balance/?machine_id=${machine_id}&item_id=${item_id}`,
      providesTags: ['LedgerBalance'],
    }),
    reconcileMachine: builder.mutation<LedgerReconcileResponse, LedgerBalanceByMachineParams>({
      query: ({ machine_id, item_id }) => ({
        url: `ledgers/machine/reconcile/?machine_id=${machine_id}&item_id=${item_id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Ledger', 'LedgerBalance'],
    }),

    getDamagedLedger: builder.query<DamagedLedgerEntry[], StorageDamagedQueryParams>({
      query: ({ factory_id, item_id, start_date, end_date, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('factory_id', factory_id.toString());
        params.append('item_id', item_id.toString());
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        return `ledgers/damaged/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getDamagedBalance: builder.query<LedgerBalanceResponse, LedgerBalanceByFactoryParams>({
      query: ({ factory_id, item_id }) =>
        `ledgers/damaged/balance/?factory_id=${factory_id}&item_id=${item_id}`,
      providesTags: ['LedgerBalance'],
    }),
    reconcileDamaged: builder.mutation<LedgerReconcileResponse, LedgerBalanceByFactoryParams>({
      query: ({ factory_id, item_id }) => ({
        url: `ledgers/damaged/reconcile/?factory_id=${factory_id}&item_id=${item_id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Ledger', 'LedgerBalance'],
    }),

    getInventoryLedger: builder.query<InventoryLedgerEntry[], InventoryQueryParams>({
      query: ({ factory_id, item_id, start_date, end_date, transaction_type, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('factory_id', factory_id.toString());
        params.append('item_id', item_id.toString());
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        if (transaction_type) params.append('transaction_type', transaction_type);
        return `ledgers/inventory/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getInventoryBalance: builder.query<LedgerBalanceResponse, LedgerBalanceByFactoryParams>({
      query: ({ factory_id, item_id }) =>
        `ledgers/inventory/balance/?factory_id=${factory_id}&item_id=${item_id}`,
      providesTags: ['LedgerBalance'],
    }),
    reconcileInventory: builder.mutation<LedgerReconcileResponse, LedgerBalanceByFactoryParams>({
      query: ({ factory_id, item_id }) => ({
        url: `ledgers/inventory/reconcile/?factory_id=${factory_id}&item_id=${item_id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Ledger', 'LedgerBalance'],
    }),

    getProjectComponentLedger: builder.query<ProjectComponentLedgerEntry[], ProjectComponentQueryParams>({
      query: ({ project_component_id, item_id, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('project_component_id', project_component_id.toString());
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (item_id) params.append('item_id', item_id.toString());
        return `ledgers/project-component/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getProjectComponentTotalCost: builder.query<ProjectComponentTotalCostResponse, number>({
      query: (projectComponentId) =>
        `ledgers/project-component/${projectComponentId}/total-cost/`,
      providesTags: (result, error, id) => [{ type: 'ProjectComponentCost', id }],
    }),

    getItemMovementReport: builder.query<ItemMovementReportEntry[], ItemMovementReportParams>({
      query: ({ item_id, start_date, end_date }) => {
        const params = new URLSearchParams();
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        const qs = params.toString();
        return `ledgers/reports/item-movement/${item_id}/${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['LedgerReports'],
    }),
    getUserTransactionsReport: builder.query<UserTransactionReportEntry[], UserTransactionsReportParams>({
      query: ({ user_id, start_date, end_date, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        return `ledgers/reports/user-transactions/${user_id}/?${params.toString()}`;
      },
      providesTags: ['LedgerReports'],
    }),
    getOrderTransactionsReport: builder.query<OrderTransactionReportEntry[], number>({
      query: (order_id) => `ledgers/reports/order-transactions/${order_id}/`,
      providesTags: ['LedgerReports'],
    }),
  }),
});

export const {
  useGetStorageLedgerQuery,
  useGetStorageBalanceQuery,
  useReconcileStorageMutation,
  useGetMachineLedgerQuery,
  useGetMachineBalanceQuery,
  useReconcileMachineMutation,
  useGetDamagedLedgerQuery,
  useGetDamagedBalanceQuery,
  useReconcileDamagedMutation,
  useGetInventoryLedgerQuery,
  useGetInventoryBalanceQuery,
  useReconcileInventoryMutation,
  useGetProjectComponentLedgerQuery,
  useGetProjectComponentTotalCostQuery,
  useGetItemMovementReportQuery,
  useGetUserTransactionsReportQuery,
  useGetOrderTransactionsReportQuery,
} = ledgersApi;
