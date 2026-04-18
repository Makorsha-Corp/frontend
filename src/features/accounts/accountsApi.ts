/**
 * RTK Query API for Accounts
 */
import { createApi } from '@reduxjs/toolkit/query/react';
import type { Account, AccountApiResponse, CreateAccountRequest, UpdateAccountRequest, ListAccountsParams } from '@/types/account';
import { createBaseQueryWithSessionExpiry } from '@/features/api/baseQueryWithSessionExpiry';

const normalizeAccount = (account: AccountApiResponse): Account => ({
  ...account,
});

export const accountsApi = createApi({
  reducerPath: 'accountsApi',
  baseQuery: createBaseQueryWithSessionExpiry(),
  tagTypes: ['Account'],
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
      providesTags: (result, error, id) => [{ type: 'Account', id }],
    }),

    // Create new account
    createAccount: builder.mutation<Account, CreateAccountRequest>({
      query: (body) => ({
        url: 'accounts/',
        method: 'POST',
        body,
      }),
      transformResponse: (response: AccountApiResponse) => normalizeAccount(response),
      invalidatesTags: [{ type: 'Account', id: 'LIST' }],
    }),

    // Update existing account
    updateAccount: builder.mutation<Account, { id: number; data: UpdateAccountRequest }>({
      query: ({ id, data }) => ({
        url: `accounts/${id}/`,
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: AccountApiResponse) => normalizeAccount(response),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Account', id },
        { type: 'Account', id: 'LIST' },
      ],
    }),

    // Delete account (soft delete)
    deleteAccount: builder.mutation<void, number>({
      query: (id) => ({
        url: `accounts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Account', id },
        { type: 'Account', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountByIdQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountsApi;
