import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/app/baseQuery';
import type { OrdersOverviewStats, OrdersOverviewStatsParams } from '@/types/ordersOverview';

export const ordersOverviewApi = createApi({
  reducerPath: 'ordersOverviewApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getOrdersOverviewStats: builder.query<OrdersOverviewStats, OrdersOverviewStatsParams>({
      query: ({ from_date, to_date, factory_id, limit = 5 }) => {
        const params = new URLSearchParams();
        params.append('from_date', from_date);
        params.append('to_date', to_date);
        params.append('limit', String(limit));
        if (factory_id != null) params.append('factory_id', String(factory_id));
        return `orders/overview/stats?${params.toString()}`;
      },
    }),
  }),
});

export const { useGetOrdersOverviewStatsQuery } = ordersOverviewApi;
