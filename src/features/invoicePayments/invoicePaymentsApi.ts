import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  InvoicePayment,
  CreateInvoicePaymentRequest,
  UpdateInvoicePaymentRequest,
  ListInvoicePaymentsParams
} from '@/types/invoicePayment';

export const invoicePaymentsApi = createApi({
  reducerPath: 'invoicePaymentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['InvoicePayment', 'AccountInvoice'],
  endpoints: (builder) => ({
    getInvoicePaymentsByInvoice: builder.query<InvoicePayment[], ListInvoicePaymentsParams>({
      query: ({ invoice_id, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        return `invoice-payments/invoice/${invoice_id}/?${params.toString()}`;
      },
      providesTags: (result, error, { invoice_id }) => [
        { type: 'InvoicePayment', id: invoice_id },
        'InvoicePayment'
      ],
    }),
    getInvoicePaymentById: builder.query<InvoicePayment, number>({
      query: (id) => `invoice-payments/${id}/`,
      providesTags: (result, error, id) => [{ type: 'InvoicePayment', id }],
    }),
    createInvoicePayment: builder.mutation<InvoicePayment, CreateInvoicePaymentRequest>({
      query: (body) => ({
        url: 'invoice-payments/',
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
        url: `invoice-payments/${id}/`,
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
        url: `invoice-payments/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InvoicePayment', 'AccountInvoice'],
    }),
    voidInvoicePayment: builder.mutation<InvoicePayment, { id: number; void_note: string }>({
      query: ({ id, void_note }) => ({
        url: `invoice-payments/${id}/void/`,
        method: 'POST',
        body: { void_note },
      }),
      invalidatesTags: ['InvoicePayment', 'AccountInvoice'],
    }),
  }),
});

export const {
  useGetInvoicePaymentsByInvoiceQuery,
  useGetInvoicePaymentByIdQuery,
  useCreateInvoicePaymentMutation,
  useUpdateInvoicePaymentMutation,
  useDeleteInvoicePaymentMutation,
  useVoidInvoicePaymentMutation,
} = invoicePaymentsApi;
