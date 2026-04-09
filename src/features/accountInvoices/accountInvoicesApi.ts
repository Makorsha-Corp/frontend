import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithSessionExpiry } from '@/features/api/baseQueryWithSessionExpiry';
import type {
  AccountInvoice,
  AccountInvoiceApiResponse,
  CreateAccountInvoiceRequest,
  UpdateAccountInvoiceRequest,
  ListAccountInvoicesParams
} from '@/types/accountInvoice';

const toNumber = (value: number | string | null | undefined): number =>
  typeof value === 'number' ? value : Number(value ?? 0);

const normalizeInvoice = (invoice: AccountInvoiceApiResponse): AccountInvoice => ({
  ...invoice,
  invoice_amount: toNumber(invoice.invoice_amount),
  paid_amount: toNumber(invoice.paid_amount),
  outstanding_amount: toNumber(invoice.outstanding_amount),
});

export const accountInvoicesApi = createApi({
  reducerPath: 'accountInvoicesApi',
  baseQuery: createBaseQueryWithSessionExpiry(),
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
        return `account-invoices/?${params.toString()}`;
      },
      transformResponse: (response: AccountInvoiceApiResponse[]) => response.map(normalizeInvoice),
      providesTags: ['AccountInvoice'],
    }),
    getAccountInvoiceById: builder.query<AccountInvoice, number>({
      query: (id) => `account-invoices/${id}/`,
      transformResponse: (response: AccountInvoiceApiResponse) => normalizeInvoice(response),
      providesTags: (result, error, id) => [{ type: 'AccountInvoice', id }],
    }),
    createAccountInvoice: builder.mutation<AccountInvoice, CreateAccountInvoiceRequest>({
      query: (body) => ({
        url: 'account-invoices/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: AccountInvoiceApiResponse) => normalizeInvoice(response),
      invalidatesTags: ['AccountInvoice'],
    }),
    updateAccountInvoice: builder.mutation<AccountInvoice, { id: number; data: UpdateAccountInvoiceRequest }>({
      query: ({ id, data }) => ({
        url: `account-invoices/${id}/`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: AccountInvoiceApiResponse) => normalizeInvoice(response),
      invalidatesTags: (result, error, { id }) => [{ type: 'AccountInvoice', id }, 'AccountInvoice'],
    }),
    deleteAccountInvoice: builder.mutation<AccountInvoice, number>({
      query: (id) => ({
        url: `account-invoices/${id}/`,
        method: 'DELETE',
      }),
      transformResponse: (response: AccountInvoiceApiResponse) => normalizeInvoice(response),
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
