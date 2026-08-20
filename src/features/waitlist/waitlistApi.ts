import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';

export type WaitlistStatus = 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'DECLINED';

export interface WaitlistSignup {
  id: number;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string;
  wants_product_updates: boolean;
  source: string | null;
  status: WaitlistStatus;
  created_at: string;
}

export interface WaitlistSignupListResponse {
  items: WaitlistSignup[];
  total: number;
  skip: number;
  limit: number;
}

export const waitlistApi = createApi({
  reducerPath: 'waitlistApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WaitlistSignup'],
  endpoints: (builder) => ({
    listWaitlistSignups: builder.query<
      WaitlistSignupListResponse,
      {
        skip?: number;
        limit?: number;
        search?: string;
        status?: WaitlistStatus;
        wants_product_updates?: boolean;
      } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.skip != null) search.set('skip', String(params.skip));
        if (params?.limit != null) search.set('limit', String(params.limit));
        if (params?.search) search.set('search', params.search);
        if (params?.status) search.set('status', params.status);
        if (params?.wants_product_updates != null) {
          search.set('wants_product_updates', String(params.wants_product_updates));
        }
        const qs = search.toString();
        return qs ? `waitlist?${qs}` : 'waitlist';
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'WaitlistSignup' as const, id })),
              { type: 'WaitlistSignup', id: 'LIST' },
            ]
          : [{ type: 'WaitlistSignup', id: 'LIST' }],
    }),
    updateWaitlistSignupStatus: builder.mutation<
      WaitlistSignup,
      { signupId: number; status: WaitlistStatus }
    >({
      query: ({ signupId, status }) => ({
        url: `waitlist/${signupId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { signupId }) => [
        { type: 'WaitlistSignup', id: signupId },
        { type: 'WaitlistSignup', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListWaitlistSignupsQuery,
  useUpdateWaitlistSignupStatusMutation,
} = waitlistApi;
