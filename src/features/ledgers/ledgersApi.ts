import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type {
  InventoryLedgerEntry,
  MachineLedgerEntry,
  ProjectComponentLedgerEntry,
  LedgerBalanceResponse,
  LedgerReconcileResponse,
  ProjectComponentTotalCostResponse,
  ItemMovementReportEntry,
  UserTransactionReportEntry,
  OrderTransactionReportEntry,
  InventoryLedgerQueryParams,
  InventoryBalanceParams,
  InventoryReconcileParams,
  MachineQueryParams,
  MachineBalanceParams,
  ProjectComponentQueryParams,
  ItemMovementReportParams,
  UserTransactionsReportParams,
} from '@/types/ledger';

// Re-export the most commonly-consumed types for backwards compatibility
// with existing imports (LedgersPage, ApiTestPage, etc.).
export type {
  InventoryLedgerEntry,
  MachineLedgerEntry,
  ProjectComponentLedgerEntry,
  LedgerBalanceResponse,
  LedgerReconcileResponse,
};

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
    // ─── Inventory ledger (unified: STORAGE / DAMAGED / WASTE / SCRAP) ──────

    getInventoryLedger: builder.query<InventoryLedgerEntry[], InventoryLedgerQueryParams | void>({
      query: (args) => {
        const {
          inventory_type,
          factory_id,
          item_id,
          start_date,
          end_date,
          transaction_type,
          skip = 0,
          limit = 100,
        } = args ?? {};
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (inventory_type) params.append('inventory_type', inventory_type);
        if (factory_id !== undefined) params.append('factory_id', factory_id.toString());
        if (item_id !== undefined) params.append('item_id', item_id.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        if (transaction_type) params.append('transaction_type', transaction_type);
        return `ledgers/inventory/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getInventoryBalance: builder.query<LedgerBalanceResponse, InventoryBalanceParams>({
      query: ({ factory_id, item_id, inventory_type }) => {
        const params = new URLSearchParams();
        params.append('factory_id', factory_id.toString());
        params.append('item_id', item_id.toString());
        params.append('inventory_type', inventory_type);
        return `ledgers/inventory/balance/?${params.toString()}`;
      },
      providesTags: ['LedgerBalance'],
    }),
    reconcileInventory: builder.mutation<LedgerReconcileResponse, InventoryReconcileParams>({
      query: ({ factory_id, item_id, inventory_type }) => {
        const params = new URLSearchParams();
        params.append('factory_id', factory_id.toString());
        params.append('item_id', item_id.toString());
        params.append('inventory_type', inventory_type);
        return {
          url: `ledgers/inventory/reconcile/?${params.toString()}`,
          method: 'POST',
        };
      },
      invalidatesTags: ['Ledger', 'LedgerBalance'],
    }),

    // ─── Machine ledger ─────────────────────────────────────────────────────

    getMachineLedger: builder.query<MachineLedgerEntry[], MachineQueryParams>({
      query: ({ machine_id, item_id, start_date, end_date, transaction_type, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('machine_id', machine_id.toString());
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (item_id !== undefined) params.append('item_id', item_id.toString());
        if (start_date) params.append('start_date', start_date);
        if (end_date) params.append('end_date', end_date);
        if (transaction_type) params.append('transaction_type', transaction_type);
        return `ledgers/machine/?${params.toString()}`;
      },
      providesTags: ['Ledger'],
    }),
    getMachineBalance: builder.query<LedgerBalanceResponse, MachineBalanceParams>({
      query: ({ machine_id, item_id }) =>
        `ledgers/machine/balance/?machine_id=${machine_id}&item_id=${item_id}`,
      providesTags: ['LedgerBalance'],
    }),
    reconcileMachine: builder.mutation<LedgerReconcileResponse, MachineBalanceParams>({
      query: ({ machine_id, item_id }) => ({
        url: `ledgers/machine/reconcile/?machine_id=${machine_id}&item_id=${item_id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Ledger', 'LedgerBalance'],
    }),

    // ─── Project component ledger ───────────────────────────────────────────

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
      providesTags: (_result, _error, id) => [{ type: 'ProjectComponentCost', id }],
    }),

    // ─── Cross-ledger reports ───────────────────────────────────────────────

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
  // Inventory (STORAGE / DAMAGED / WASTE / SCRAP)
  useGetInventoryLedgerQuery,
  useGetInventoryBalanceQuery,
  useReconcileInventoryMutation,
  // Machine
  useGetMachineLedgerQuery,
  useGetMachineBalanceQuery,
  useReconcileMachineMutation,
  // Project component
  useGetProjectComponentLedgerQuery,
  useGetProjectComponentTotalCostQuery,
  // Reports
  useGetItemMovementReportQuery,
  useGetUserTransactionsReportQuery,
  useGetOrderTransactionsReportQuery,
} = ledgersApi;
