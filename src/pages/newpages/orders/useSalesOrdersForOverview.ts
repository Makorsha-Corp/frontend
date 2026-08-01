import { useMemo } from 'react';
import { useGetSalesOrdersQuery } from '@/features/salesOrders/salesOrdersApi';
import { API_LIMITS } from '@/constants/apiLimits';
import type { SalesOrder } from '@/types/salesOrder';

const PAGE = API_LIMITS.STRICT_100;

/**
 * Loads sales orders in pages of 100 until a short page or cap (10 requests = 1000 rows).
 */
export function useSalesOrdersForOverview(): {
  salesOrders: SalesOrder[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  mayTruncate: boolean;
} {
  const q0 = useGetSalesOrdersQuery({ skip: 0 * PAGE, limit: PAGE });
  const full0 = (q0.data?.length ?? 0) === PAGE;
  const q1 = useGetSalesOrdersQuery({ skip: 1 * PAGE, limit: PAGE }, { skip: !full0 });
  const full1 = full0 && (q1.data?.length ?? 0) === PAGE;
  const q2 = useGetSalesOrdersQuery({ skip: 2 * PAGE, limit: PAGE }, { skip: !full1 });
  const full2 = full1 && (q2.data?.length ?? 0) === PAGE;
  const q3 = useGetSalesOrdersQuery({ skip: 3 * PAGE, limit: PAGE }, { skip: !full2 });
  const full3 = full2 && (q3.data?.length ?? 0) === PAGE;
  const q4 = useGetSalesOrdersQuery({ skip: 4 * PAGE, limit: PAGE }, { skip: !full3 });
  const full4 = full3 && (q4.data?.length ?? 0) === PAGE;
  const q5 = useGetSalesOrdersQuery({ skip: 5 * PAGE, limit: PAGE }, { skip: !full4 });
  const full5 = full4 && (q5.data?.length ?? 0) === PAGE;
  const q6 = useGetSalesOrdersQuery({ skip: 6 * PAGE, limit: PAGE }, { skip: !full5 });
  const full6 = full5 && (q6.data?.length ?? 0) === PAGE;
  const q7 = useGetSalesOrdersQuery({ skip: 7 * PAGE, limit: PAGE }, { skip: !full6 });
  const full7 = full6 && (q7.data?.length ?? 0) === PAGE;
  const q8 = useGetSalesOrdersQuery({ skip: 8 * PAGE, limit: PAGE }, { skip: !full7 });
  const full8 = full7 && (q8.data?.length ?? 0) === PAGE;
  const q9 = useGetSalesOrdersQuery({ skip: 9 * PAGE, limit: PAGE }, { skip: !full8 });

  const queries = [q0, q1, q2, q3, q4, q5, q6, q7, q8, q9];

  const salesOrders = useMemo(() => {
    const merged: SalesOrder[] = [];
    const seen = new Set<number>();
    for (const q of queries) {
      for (const row of q.data ?? []) {
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        merged.push(row);
      }
    }
    return merged;
  }, [q0.data, q1.data, q2.data, q3.data, q4.data, q5.data, q6.data, q7.data, q8.data, q9.data]);

  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);
  const isError = queries.some((q) => q.isError);

  /** True when the last fetched page is full — more rows may exist beyond the 1000 cap. */
  const mayTruncate = (q9.data?.length ?? 0) === PAGE;

  return { salesOrders, isLoading, isFetching, isError, mayTruncate };
}
