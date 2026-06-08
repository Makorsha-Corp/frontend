import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  AccountInvoice,
  AccountInvoiceApiResponse,
  CreateAccountInvoiceRequest,
  UpdateAccountInvoiceRequest,
  ListAccountInvoicesParams,
  InvoiceStatusEntry,
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
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AccountInvoice'],
  endpoints: (builder) => ({
    getAccountInvoices: builder.query<AccountInvoice[], ListAccountInvoicesParams>({
      query: ({
        skip = 0,
        limit = 100,
        account_id,
        invoice_type,
        payment_status,
        invoice_status,
        invoice_number_search,
        account_name_search,
        invoice_date_from,
        invoice_date_to,
        due_date_from,
        due_date_to,
        amount_min,
        amount_max,
      } = {}) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (account_id) params.append('account_id', account_id.toString());
        if (invoice_type) params.append('invoice_type', invoice_type);
        if (payment_status) params.append('payment_status', payment_status);
        if (invoice_status) params.append('invoice_status', invoice_status);
        if (invoice_number_search) params.append('invoice_number_search', invoice_number_search);
        if (account_name_search) params.append('account_name_search', account_name_search);
        if (invoice_date_from) params.append('invoice_date_from', invoice_date_from);
        if (invoice_date_to) params.append('invoice_date_to', invoice_date_to);
        if (due_date_from) params.append('due_date_from', due_date_from);
        if (due_date_to) params.append('due_date_to', due_date_to);
        if (amount_min != null) params.append('amount_min', amount_min.toString());
        if (amount_max != null) params.append('amount_max', amount_max.toString());
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
      invalidatesTags: ['AccountInvoice', 'PurchaseOrder', 'PurchaseOrderItem', 'ActiveOrders'],
    }),
    getInvoiceStatusHistory: builder.query<InvoiceStatusEntry[], number>({
      query: (invoiceId) => `account-invoices/${invoiceId}/status-history/`,
      providesTags: (result, error, invoiceId) => [{ type: 'AccountInvoice', id: invoiceId }],
    }),
    confirmAccountInvoice: builder.mutation<AccountInvoice, number>({
      query: (id) => ({
        url: `account-invoices/${id}/confirm/`,
        method: 'POST',
      }),
      transformResponse: (response: AccountInvoiceApiResponse) => normalizeInvoice(response),
      invalidatesTags: (result, error, id) => [
        { type: 'AccountInvoice', id },
        'AccountInvoice',
        'PurchaseOrder',
        'PurchaseOrderItem',
        'ActiveOrders',
      ],
    }),
    voidAccountInvoice: builder.mutation<AccountInvoice, { id: number; void_note: string }>({
      query: ({ id, void_note }) => ({
        url: `account-invoices/${id}/void/`,
        method: 'POST',
        body: { void_note },
      }),
      transformResponse: (response: AccountInvoiceApiResponse) => normalizeInvoice(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AccountInvoice', id },
        'AccountInvoice',
        'PurchaseOrder',
        'PurchaseOrderItem',
        'PurchaseOrderEvents',
        'ActiveOrders',
      ],
    }),
  }),
});

export const {
  useGetAccountInvoicesQuery,
  useGetAccountInvoiceByIdQuery,
  useCreateAccountInvoiceMutation,
  useUpdateAccountInvoiceMutation,
  useDeleteAccountInvoiceMutation,
  useConfirmAccountInvoiceMutation,
  useVoidAccountInvoiceMutation,
  useGetInvoiceStatusHistoryQuery,
} = accountInvoicesApi;
