/**
 * Financial Audit Logs API
 *
 * RTK Query API for fetching audit logs for accounts, invoices, and payments
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type { FinancialAuditLog } from '../../types/financialAuditLog';

export const financialAuditLogsApi = createApi({
  reducerPath: 'financialAuditLogsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/v1',
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
  tagTypes: ['AuditLog'],
  endpoints: (builder) => ({
    // Get recent audit logs
    getRecentAuditLogs: builder.query<FinancialAuditLog[], { limit?: number }>({
      query: ({ limit = 50 }) => `/financial-audit-logs/?limit=${limit}`,
      providesTags: ['AuditLog'],
    }),

    // Get audit logs for specific entity
    getEntityAuditLogs: builder.query<
      FinancialAuditLog[],
      { entityType: string; entityId: number; skip?: number; limit?: number }
    >({
      query: ({ entityType, entityId, skip = 0, limit = 100 }) =>
        `/financial-audit-logs/entity/${entityType}/${entityId}?skip=${skip}&limit=${limit}`,
      providesTags: (result, error, { entityType, entityId }) => [
        { type: 'AuditLog', id: `${entityType}-${entityId}` },
      ],
    }),

    // Get related audit logs (e.g., account + its invoices + payments)
    getRelatedAuditLogs: builder.query<
      FinancialAuditLog[],
      { entityType: string; entityId: number; skip?: number; limit?: number }
    >({
      query: ({ entityType, entityId, skip = 0, limit = 100 }) =>
        `/financial-audit-logs/related/${entityType}/${entityId}?skip=${skip}&limit=${limit}`,
      providesTags: (result, error, { entityType, entityId }) => [
        { type: 'AuditLog', id: `related-${entityType}-${entityId}` },
      ],
    }),

    // Get audit logs by action type
    getAuditLogsByAction: builder.query<
      FinancialAuditLog[],
      { actionType: string; skip?: number; limit?: number }
    >({
      query: ({ actionType, skip = 0, limit = 100 }) =>
        `/financial-audit-logs/action/${actionType}?skip=${skip}&limit=${limit}`,
      providesTags: ['AuditLog'],
    }),

    // Get audit logs by user
    getUserAuditLogs: builder.query<
      FinancialAuditLog[],
      { userId: number; skip?: number; limit?: number }
    >({
      query: ({ userId, skip = 0, limit = 100 }) =>
        `/financial-audit-logs/user/${userId}?skip=${skip}&limit=${limit}`,
      providesTags: (result, error, { userId }) => [{ type: 'AuditLog', id: `user-${userId}` }],
    }),

    // Get audit logs by date range
    getAuditLogsByDateRange: builder.query<
      FinancialAuditLog[],
      { startDate: string; endDate: string; skip?: number; limit?: number }
    >({
      query: ({ startDate, endDate, skip = 0, limit = 100 }) =>
        `/financial-audit-logs/date-range?start_date=${startDate}&end_date=${endDate}&skip=${skip}&limit=${limit}`,
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetRecentAuditLogsQuery,
  useGetEntityAuditLogsQuery,
  useGetRelatedAuditLogsQuery,
  useGetAuditLogsByActionQuery,
  useGetUserAuditLogsQuery,
  useGetAuditLogsByDateRangeQuery,
} = financialAuditLogsApi;
