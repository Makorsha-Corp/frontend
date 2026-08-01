import { useMemo } from 'react';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetTransferOrdersQuery } from '@/features/transferOrders/transferOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
import { API_LIMITS } from '@/constants/apiLimits';
import type { PurchaseOrder } from '@/types/purchaseOrder';

const PAGE = API_LIMITS.ORDER_HUB_LIST_MAX;

function mergeUniqueById<T extends { id: number }>(queries: Array<{ data?: T[] }>): T[] {
  const merged: T[] = [];
  const seen = new Set<number>();
  for (const q of queries) {
    for (const row of q.data ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      merged.push(row);
    }
  }
  return merged;
}

export function usePaginatedPurchaseOrdersForOverview(): {
  purchaseOrders: PurchaseOrder[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  mayTruncate: boolean;
} {
  const q0 = useGetPurchaseOrdersQuery({ skip: 0, limit: PAGE });
  const full0 = (q0.data?.length ?? 0) === PAGE;
  const q1 = useGetPurchaseOrdersQuery({ skip: PAGE, limit: PAGE }, { skip: !full0 });
  const full1 = full0 && (q1.data?.length ?? 0) === PAGE;
  const q2 = useGetPurchaseOrdersQuery({ skip: 2 * PAGE, limit: PAGE }, { skip: !full1 });
  const full2 = full1 && (q2.data?.length ?? 0) === PAGE;
  const q3 = useGetPurchaseOrdersQuery({ skip: 3 * PAGE, limit: PAGE }, { skip: !full2 });
  const full3 = full2 && (q3.data?.length ?? 0) === PAGE;
  const q4 = useGetPurchaseOrdersQuery({ skip: 4 * PAGE, limit: PAGE }, { skip: !full3 });
  const full4 = full3 && (q4.data?.length ?? 0) === PAGE;
  const q5 = useGetPurchaseOrdersQuery({ skip: 5 * PAGE, limit: PAGE }, { skip: !full4 });
  const full5 = full4 && (q5.data?.length ?? 0) === PAGE;
  const q6 = useGetPurchaseOrdersQuery({ skip: 6 * PAGE, limit: PAGE }, { skip: !full5 });
  const full6 = full5 && (q6.data?.length ?? 0) === PAGE;
  const q7 = useGetPurchaseOrdersQuery({ skip: 7 * PAGE, limit: PAGE }, { skip: !full6 });
  const full7 = full6 && (q7.data?.length ?? 0) === PAGE;
  const q8 = useGetPurchaseOrdersQuery({ skip: 8 * PAGE, limit: PAGE }, { skip: !full7 });
  const full8 = full7 && (q8.data?.length ?? 0) === PAGE;
  const q9 = useGetPurchaseOrdersQuery({ skip: 9 * PAGE, limit: PAGE }, { skip: !full8 });

  const queries = [q0, q1, q2, q3, q4, q5, q6, q7, q8, q9];
  const purchaseOrders = useMemo(
    () => mergeUniqueById(queries),
    // `queries` gets a new identity every render; the result only depends on
    // each page's data, so key the memo on those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q0.data, q1.data, q2.data, q3.data, q4.data, q5.data, q6.data, q7.data, q8.data, q9.data]
  );

  return {
    purchaseOrders,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    isError: queries.some((q) => q.isError),
    mayTruncate: (q9.data?.length ?? 0) === PAGE,
  };
}

export function usePaginatedTransferOrdersForOverview() {
  const q0 = useGetTransferOrdersQuery({ skip: 0, limit: PAGE });
  const full0 = (q0.data?.length ?? 0) === PAGE;
  const q1 = useGetTransferOrdersQuery({ skip: PAGE, limit: PAGE }, { skip: !full0 });
  const full1 = full0 && (q1.data?.length ?? 0) === PAGE;
  const q2 = useGetTransferOrdersQuery({ skip: 2 * PAGE, limit: PAGE }, { skip: !full1 });
  const full2 = full1 && (q2.data?.length ?? 0) === PAGE;
  const q3 = useGetTransferOrdersQuery({ skip: 3 * PAGE, limit: PAGE }, { skip: !full2 });
  const full3 = full2 && (q3.data?.length ?? 0) === PAGE;
  const q4 = useGetTransferOrdersQuery({ skip: 4 * PAGE, limit: PAGE }, { skip: !full3 });
  const full4 = full3 && (q4.data?.length ?? 0) === PAGE;
  const q5 = useGetTransferOrdersQuery({ skip: 5 * PAGE, limit: PAGE }, { skip: !full4 });
  const full5 = full4 && (q5.data?.length ?? 0) === PAGE;
  const q6 = useGetTransferOrdersQuery({ skip: 6 * PAGE, limit: PAGE }, { skip: !full5 });
  const full6 = full5 && (q6.data?.length ?? 0) === PAGE;
  const q7 = useGetTransferOrdersQuery({ skip: 7 * PAGE, limit: PAGE }, { skip: !full6 });
  const full7 = full6 && (q7.data?.length ?? 0) === PAGE;
  const q8 = useGetTransferOrdersQuery({ skip: 8 * PAGE, limit: PAGE }, { skip: !full7 });
  const full8 = full7 && (q8.data?.length ?? 0) === PAGE;
  const q9 = useGetTransferOrdersQuery({ skip: 9 * PAGE, limit: PAGE }, { skip: !full8 });

  const queries = [q0, q1, q2, q3, q4, q5, q6, q7, q8, q9];
  const transferOrders = useMemo(
    () => mergeUniqueById(queries),
    // `queries` gets a new identity every render; the result only depends on
    // each page's data, so key the memo on those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q0.data, q1.data, q2.data, q3.data, q4.data, q5.data, q6.data, q7.data, q8.data, q9.data]
  );

  return {
    transferOrders,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    isError: queries.some((q) => q.isError),
    mayTruncate: (q9.data?.length ?? 0) === PAGE,
  };
}

export function usePaginatedExpenseOrdersForOverview() {
  const q0 = useGetExpenseOrdersQuery({ skip: 0, limit: PAGE });
  const full0 = (q0.data?.length ?? 0) === PAGE;
  const q1 = useGetExpenseOrdersQuery({ skip: PAGE, limit: PAGE }, { skip: !full0 });
  const full1 = full0 && (q1.data?.length ?? 0) === PAGE;
  const q2 = useGetExpenseOrdersQuery({ skip: 2 * PAGE, limit: PAGE }, { skip: !full1 });
  const full2 = full1 && (q2.data?.length ?? 0) === PAGE;
  const q3 = useGetExpenseOrdersQuery({ skip: 3 * PAGE, limit: PAGE }, { skip: !full2 });
  const full3 = full2 && (q3.data?.length ?? 0) === PAGE;
  const q4 = useGetExpenseOrdersQuery({ skip: 4 * PAGE, limit: PAGE }, { skip: !full3 });
  const full4 = full3 && (q4.data?.length ?? 0) === PAGE;
  const q5 = useGetExpenseOrdersQuery({ skip: 5 * PAGE, limit: PAGE }, { skip: !full4 });
  const full5 = full4 && (q5.data?.length ?? 0) === PAGE;
  const q6 = useGetExpenseOrdersQuery({ skip: 6 * PAGE, limit: PAGE }, { skip: !full5 });
  const full6 = full5 && (q6.data?.length ?? 0) === PAGE;
  const q7 = useGetExpenseOrdersQuery({ skip: 7 * PAGE, limit: PAGE }, { skip: !full6 });
  const full7 = full6 && (q7.data?.length ?? 0) === PAGE;
  const q8 = useGetExpenseOrdersQuery({ skip: 8 * PAGE, limit: PAGE }, { skip: !full7 });
  const full8 = full7 && (q8.data?.length ?? 0) === PAGE;
  const q9 = useGetExpenseOrdersQuery({ skip: 9 * PAGE, limit: PAGE }, { skip: !full8 });

  const queries = [q0, q1, q2, q3, q4, q5, q6, q7, q8, q9];
  const expenseOrders = useMemo(
    () => mergeUniqueById(queries),
    // `queries` gets a new identity every render; the result only depends on
    // each page's data, so key the memo on those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q0.data, q1.data, q2.data, q3.data, q4.data, q5.data, q6.data, q7.data, q8.data, q9.data]
  );

  return {
    expenseOrders,
    isLoading: queries.some((q) => q.isLoading),
    isFetching: queries.some((q) => q.isFetching),
    isError: queries.some((q) => q.isError),
    mayTruncate: (q9.data?.length ?? 0) === PAGE,
  };
}
