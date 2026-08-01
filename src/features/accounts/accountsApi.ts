/**
 * RTK Query API for Accounts
 */
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Account, AccountApiResponse, CreateAccountRequest, UpdateAccountRequest, ListAccountsParams, AccountInvoiceSummary, AccountInvoiceSummaryApiResponse, AccountInvoiceSummaryParams, AccountHubListApiResponse, AccountHubListPage, AccountHubPageParams, AccountHubRowApi, AccountHubRow, AccountOpenBalanceRollupApi } from '@/types/account';
import type {
  AccountInvoice,
  AccountInvoiceApiResponse,
  AccountOpenInvoicesPage,
  AccountOpenInvoicesPageApiResponse,
  AccountOpenInvoicesPageParams,
  AccountInvoicesPageParams,
} from '@/types/accountInvoice';
import { baseQueryWithReauth } from '@/app/baseQuery';
const normalizeAccount = (account: AccountApiResponse): Account => ({
  ...account,
});

const toNumber = (value: number | string | null | undefined): number =>
  typeof value === 'number' ? value : Number(value ?? 0);

const normalizeInvoiceSummary = (response: AccountInvoiceSummaryApiResponse): AccountInvoiceSummary => ({
  invoiceCount: response.invoice_count,
  invoiced: toNumber(response.invoiced_total),
  paid: toNumber(response.paid_total),
  outstanding: toNumber(response.outstanding_total),
});

const normalizeAccountInvoice = (invoice: AccountInvoiceApiResponse): AccountInvoice => ({
  ...invoice,
  invoice_amount: toNumber(invoice.invoice_amount),
  paid_amount: toNumber(invoice.paid_amount),
  outstanding_amount: toNumber(invoice.outstanding_amount),
});

const normalizeOpenInvoicesPage = (
  response: AccountOpenInvoicesPageApiResponse
): AccountOpenInvoicesPage => ({
  items: response.items.map(normalizeAccountInvoice),
  total: response.total,
  skip: response.skip,
  limit: response.limit,
  hasMore: response.has_more,
});

const normalizeOpenBalanceRollup = (rollup: AccountOpenBalanceRollupApi) => ({
  payableOutstanding: toNumber(rollup.payable_outstanding),
  receivableOutstanding: toNumber(rollup.receivable_outstanding),
  openPayableCount: rollup.open_payable_count,
  openReceivableCount: rollup.open_receivable_count,
  hasOverduePayable: rollup.has_overdue_payable,
  hasOverdueReceivable: rollup.has_overdue_receivable,
});

const normalizeAccountHubRow = (row: AccountHubRowApi): AccountHubRow => ({
  ...normalizeAccount(row),
  account_tags: row.account_tags,
  openBalance: normalizeOpenBalanceRollup(row.open_balance),
});

const normalizeAccountHubPage = (response: AccountHubListApiResponse): AccountHubListPage => ({
  items: response.items.map(normalizeAccountHubRow),
  total: response.total,
  skip: response.skip,
  limit: response.limit,
  hasMore: response.has_more,
});

export const accountsApi = createApi({
  reducerPath: 'accountsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Account', 'AccountInvoiceSummary', 'AccountOpenInvoices', 'AccountHub', 'AccountInvoicesPage'],
  endpoints: (builder) => ({
    // Get all accounts with pagination and search
    getAccounts: builder.query<Account[], ListAccountsParams>({
      query: ({ skip = 0, limit = 100, search, tag_code }) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
        });

        if (search) {
          params.append('search', search);
        }
        if (tag_code) {
          params.append('tag_code', tag_code);
        }

        return `accounts/?${params.toString()}`;
      },
      transformResponse: (response: AccountApiResponse[]) => response.map(normalizeAccount),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Account' as const, id })),
              { type: 'Account', id: 'LIST' },
            ]
          : [{ type: 'Account', id: 'LIST' }],
    }),

    // Get single account by ID
    getAccountById: builder.query<Account, number>({
      query: (id) => `accounts/${id}/`,
      transformResponse: (response: AccountApiResponse) => normalizeAccount(response),
      providesTags: (_result, _error, id) => [{ type: 'Account', id }],
    }),

    getAccountInvoiceSummary: builder.query<AccountInvoiceSummary, AccountInvoiceSummaryParams>({
      query: ({
        account_id,
        invoice_type,
        payment_status,
        invoice_status,
        invoice_number_search,
        invoice_date_from,
        invoice_date_to,
        due_date_from,
        due_date_to,
        amount_min,
        amount_max,
      }) => {
        const params = new URLSearchParams();
        if (invoice_type) params.append('invoice_type', invoice_type);
        if (payment_status) params.append('payment_status', payment_status);
        if (invoice_status) params.append('invoice_status', invoice_status);
        if (invoice_number_search) params.append('invoice_number_search', invoice_number_search);
        if (invoice_date_from) params.append('invoice_date_from', invoice_date_from);
        if (invoice_date_to) params.append('invoice_date_to', invoice_date_to);
        if (due_date_from) params.append('due_date_from', due_date_from);
        if (due_date_to) params.append('due_date_to', due_date_to);
        if (amount_min != null) params.append('amount_min', String(amount_min));
        if (amount_max != null) params.append('amount_max', String(amount_max));
        const qs = params.toString();
        return `accounts/${account_id}/invoice-summary/${qs ? `?${qs}` : ''}`;
      },
      transformResponse: (response: AccountInvoiceSummaryApiResponse) => normalizeInvoiceSummary(response),
      providesTags: (_result, _error, { account_id }) => [
        { type: 'AccountInvoiceSummary', id: account_id },
      ],
    }),

    getAccountOpenInvoicesPage: builder.query<AccountOpenInvoicesPage, AccountOpenInvoicesPageParams>({
      query: ({
        account_id,
        skip = 0,
        limit = 10,
        prioritize_purchase_order_id,
      }) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
        });
        if (prioritize_purchase_order_id != null) {
          params.append('prioritize_purchase_order_id', prioritize_purchase_order_id.toString());
        }
        return `accounts/${account_id}/open-invoices/?${params.toString()}`;
      },
      transformResponse: (response: AccountOpenInvoicesPageApiResponse) =>
        normalizeOpenInvoicesPage(response),
      providesTags: (_result, _error, { account_id }) => [
        { type: 'AccountOpenInvoices', id: account_id },
      ],
    }),

    getAccountsHubPage: builder.query<AccountHubListPage, AccountHubPageParams>({
      query: ({ section = 'overview', search, skip = 0, limit = 50 }) => {
        const params = new URLSearchParams({
          section,
          skip: skip.toString(),
          limit: limit.toString(),
        });
        if (search) params.append('search', search);
        return `accounts/hub/?${params.toString()}`;
      },
      transformResponse: (response: AccountHubListApiResponse) => normalizeAccountHubPage(response),
      providesTags: [{ type: 'AccountHub', id: 'LIST' }],
    }),

    getAccountInvoicesPage: builder.query<AccountOpenInvoicesPage, AccountInvoicesPageParams>({
      query: ({
        account_id,
        skip = 0,
        limit = 50,
        invoice_type,
        payment_status,
        invoice_status,
        invoice_number_search,
        invoice_date_from,
        invoice_date_to,
        due_date_from,
        due_date_to,
      }) => {
        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: limit.toString(),
        });
        if (invoice_type) params.append('invoice_type', invoice_type);
        if (payment_status) params.append('payment_status', payment_status);
        if (invoice_status) params.append('invoice_status', invoice_status);
        if (invoice_number_search) params.append('invoice_number_search', invoice_number_search);
        if (invoice_date_from) params.append('invoice_date_from', invoice_date_from);
        if (invoice_date_to) params.append('invoice_date_to', invoice_date_to);
        if (due_date_from) params.append('due_date_from', due_date_from);
        if (due_date_to) params.append('due_date_to', due_date_to);
        return `accounts/${account_id}/invoices/?${params.toString()}`;
      },
      transformResponse: (response: AccountOpenInvoicesPageApiResponse) =>
        normalizeOpenInvoicesPage(response),
      providesTags: (_result, _error, { account_id }) => [
        { type: 'AccountInvoicesPage', id: account_id },
      ],
    }),

    // Create new account
    createAccount: builder.mutation<Account, CreateAccountRequest>({
      query: (body) => ({
        url: 'accounts/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: AccountApiResponse) => normalizeAccount(response),
      invalidatesTags: [{ type: 'Account', id: 'LIST' }, { type: 'AccountHub', id: 'LIST' }],
    }),

    // Update existing account
    updateAccount: builder.mutation<Account, { id: number; data: UpdateAccountRequest }>({
      query: ({ id, data }) => ({
        url: `accounts/${id}/`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: AccountApiResponse) => normalizeAccount(response),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Account', id },
        { type: 'Account', id: 'LIST' },
        { type: 'AccountHub', id: 'LIST' },
      ],
    }),

    // Delete account (soft delete)
    deleteAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `accounts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Account', id },
        { type: 'Account', id: 'LIST' },
        { type: 'AccountHub', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useGetAccountInvoiceSummaryQuery,
  useGetAccountOpenInvoicesPageQuery,
  useGetAccountsHubPageQuery,
  useGetAccountInvoicesPageQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountsApi;
