import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import type {
  InvoicePayment,
  CreateInvoicePaymentRequest,
  UpdateInvoicePaymentRequest,
  ListInvoicePaymentsParams
} from '@/types/invoicePayment';

export const invoicePaymentsApi = createApi({
  reducerPath: 'invoicePaymentsApi',
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
  tagTypes: ['InvoicePayment', 'AccountInvoice'],
  endpoints: (builder) => ({
    getInvoicePaymentsByInvoice: builder.query<InvoicePayment[], ListInvoicePaymentsParams>({
      query: ({ invoice_id, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        return `/invoice-payments/invoice/${invoice_id}?${params.toString()}`;
      },
      providesTags: (result, error, { invoice_id }) => [
        { type: 'InvoicePayment', id: invoice_id },
        'InvoicePayment'
      ],
    }),
    getInvoicePaymentById: builder.query<InvoicePayment, number>({
      query: (id) => `/invoice-payments/${id}`,
      providesTags: (result, error, id) => [{ type: 'InvoicePayment', id }],
    }),
    createInvoicePayment: builder.mutation<InvoicePayment, CreateInvoicePaymentRequest>({
      query: (body) => ({
        url: '/invoice-payments',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { invoice_id }) => [
        { type: 'InvoicePayment', id: invoice_id },
        'InvoicePayment',
        'AccountInvoice', // Invalidate invoices because payment_status changes
      ],
    }),
    updateInvoicePayment: builder.mutation<InvoicePayment, { id: number; data: UpdateInvoicePaymentRequest }>({
      query: ({ id, data }) => ({
        url: `/invoice-payments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'InvoicePayment', id },
        'InvoicePayment',
      ],
    }),
    deleteInvoicePayment: builder.mutation<InvoicePayment, number>({
      query: (id) => ({
        url: `/invoice-payments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InvoicePayment', 'AccountInvoice'], // Invalidate both
    }),
  }),
});

export const {
  useGetInvoicePaymentsByInvoiceQuery,
  useGetInvoicePaymentByIdQuery,
  useCreateInvoicePaymentMutation,
  useUpdateInvoicePaymentMutation,
  useDeleteInvoicePaymentMutation,
} = invoicePaymentsApi;
