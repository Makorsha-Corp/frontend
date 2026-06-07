import { createApi } from '@reduxjs/toolkit/query/react';
import type { AppDispatch } from '@/app/store';
import { baseQueryWithReauth } from '@/app/baseQuery';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import type {
  InvoicePayment,
  CreateInvoicePaymentRequest,
  UpdateInvoicePaymentRequest,
  ListInvoicePaymentsParams
} from '@/types/invoicePayment';

function invalidateInvoiceCache(dispatch: AppDispatch, invoiceId: number) {
  dispatch(
    accountInvoicesApi.util.invalidateTags([
      { type: 'AccountInvoice', id: invoiceId },
      'AccountInvoice',
    ])
  );
}

export const invoicePaymentsApi = createApi({
  reducerPath: 'invoicePaymentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['InvoicePayment'],
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
      ],
      async onQueryStarted({ invoice_id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          invalidateInvoiceCache(dispatch, invoice_id);
        } catch {
          /* mutation failed */
        }
      },
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
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateInvoiceCache(dispatch, data.invoice_id);
        } catch {
          /* mutation failed */
        }
      },
    }),
    deleteInvoicePayment: builder.mutation<InvoicePayment, number>({
      query: (id) => ({
        url: `invoice-payments/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InvoicePayment'],
      async onQueryStarted(_paymentId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateInvoiceCache(dispatch, data.invoice_id);
        } catch {
          /* mutation failed */
        }
      },
    }),
    voidInvoicePayment: builder.mutation<InvoicePayment, { id: number; void_note: string }>({
      query: ({ id, void_note }) => ({
        url: `invoice-payments/${id}/void/`,
        method: 'POST',
        body: { void_note },
      }),
      invalidatesTags: ['InvoicePayment'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          invalidateInvoiceCache(dispatch, data.invoice_id);
        } catch {
          /* mutation failed */
        }
      },
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
