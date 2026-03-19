import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type {
  AccountInvoice,
  CreateAccountInvoiceRequest,
  UpdateAccountInvoiceRequest,
  ListAccountInvoicesParams
} from '@/types/accountInvoice';

export const accountInvoicesApi = createApi({
  reducerPath: 'accountInvoicesApi',
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
  tagTypes: ['AccountInvoice'],
  endpoints: (builder) => ({
    getAccountInvoices: builder.query<AccountInvoice[], ListAccountInvoicesParams>({
      query: ({ skip = 0, limit = 100, account_id, invoice_type, payment_status } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (account_id) {
          params.append('account_id', account_id.toString());
        }
        if (invoice_type) {
          params.append('invoice_type', invoice_type);
        }
        if (payment_status) {
          params.append('payment_status', payment_status);
        }
        return `/account-invoices?${params.toString()}`;
      },
      providesTags: ['AccountInvoice'],
    }),
    getAccountInvoiceById: builder.query<AccountInvoice, number>({
      query: (id) => `/account-invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'AccountInvoice', id }],
    }),
    createAccountInvoice: builder.mutation<AccountInvoice, CreateAccountInvoiceRequest>({
      query: (body) => ({
        url: '/account-invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AccountInvoice'],
    }),
    updateAccountInvoice: builder.mutation<AccountInvoice, { id: number; data: UpdateAccountInvoiceRequest }>({
      query: ({ id, data }) => ({
        url: `/account-invoices/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AccountInvoice', id }, 'AccountInvoice'],
    }),
    deleteAccountInvoice: builder.mutation<AccountInvoice, number>({
      query: (id) => ({
        url: `/account-invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AccountInvoice'],
    }),
  }),
});

export const {
  useGetAccountInvoicesQuery,
  useGetAccountInvoiceByIdQuery,
  useCreateAccountInvoiceMutation,
  useUpdateAccountInvoiceMutation,
  useDeleteAccountInvoiceMutation,
} = accountInvoicesApi;
