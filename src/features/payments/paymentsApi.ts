import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentTransaction,
  PaymentTransactionApiResponse,
  PaymentTransactionDetail,
  PaymentTransactionDetailApiResponse,
  ResolveRiskRequest,
} from '@/types/payment';

const toNumber = (value: number | string | null | undefined): number =>
  typeof value === 'number' ? value : Number(value ?? 0);

const normalizeTransaction = (txn: PaymentTransactionApiResponse): PaymentTransaction => ({
  ...txn,
  amount: toNumber(txn.amount),
});

const normalizeDetail = (txn: PaymentTransactionDetailApiResponse): PaymentTransactionDetail => ({
  ...txn,
  amount: toNumber(txn.amount),
});

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PaymentTransaction'],
  endpoints: (builder) => ({
    listPayments: builder.query<PaymentTransaction[], { skip?: number; limit?: number } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        search.append('skip', String(params?.skip ?? 0));
        search.append('limit', String(params?.limit ?? 100));
        return `payments/?${search.toString()}`;
      },
      transformResponse: (response: PaymentTransactionApiResponse[]) => response.map(normalizeTransaction),
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: 'PaymentTransaction' as const, id: t.id })), 'PaymentTransaction']
          : ['PaymentTransaction'],
    }),
    getPaymentByTranId: builder.query<PaymentTransactionDetail, string>({
      query: (tranId) => `payments/${tranId}/`,
      transformResponse: normalizeDetail,
      providesTags: (_result, _error, tranId) => [{ type: 'PaymentTransaction', id: tranId }],
    }),
    initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (body) => ({ url: 'payments/initiate/', method: 'POST', body }),
      invalidatesTags: ['PaymentTransaction'],
    }),
    resolveRisk: builder.mutation<PaymentTransaction, { transactionId: number; data: ResolveRiskRequest }>({
      query: ({ transactionId, data }) => ({
        url: `payments/${transactionId}/resolve-risk/`,
        method: 'POST',
        body: data,
      }),
      transformResponse: normalizeTransaction,
      invalidatesTags: ['PaymentTransaction'],
    }),
  }),
});

export const {
  useListPaymentsQuery,
  useGetPaymentByTranIdQuery,
  useInitiatePaymentMutation,
  useResolveRiskMutation,
} = paymentsApi;
