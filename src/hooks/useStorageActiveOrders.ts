import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import {
  purchaseOrdersApi,
  useGetActiveOrdersForContextQuery,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import type { ActiveOrderRow } from '@/types/purchaseOrder';

function dedupeActiveOrderRows(rows: ActiveOrderRow[]): ActiveOrderRow[] {
  const seen = new Set<string>();
  const out: ActiveOrderRow[] = [];
  for (const row of rows) {
    const key = `${row.order_kind}:${row.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function useStorageActiveOrders(
  factoryId: number | null,
  allFactoryIds: number[],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const dispatch = useAppDispatch();
  const stableFactoryIds = useMemo(
    () => [...allFactoryIds].sort((a, b) => a - b),
    [allFactoryIds],
  );

  const singleFactoryQuery = useGetActiveOrdersForContextQuery(
    { factoryId: factoryId! },
    { skip: !enabled || factoryId == null },
  );

  const [allFactoriesRows, setAllFactoriesRows] = useState<ActiveOrderRow[] | null>(null);
  const [allFactoriesLoading, setAllFactoriesLoading] = useState(false);
  const [allFactoriesError, setAllFactoriesError] = useState(false);

  useEffect(() => {
    if (!enabled || factoryId != null) return;

    if (stableFactoryIds.length === 0) {
      setAllFactoriesRows([]);
      setAllFactoriesLoading(false);
      setAllFactoriesError(false);
      return;
    }

    let cancelled = false;
    setAllFactoriesLoading(true);
    setAllFactoriesError(false);

    Promise.all(
      stableFactoryIds.map((id) =>
        dispatch(
          purchaseOrdersApi.endpoints.getActiveOrdersForContext.initiate(
            { factoryId: id },
            { subscribe: false },
          ),
        ).unwrap(),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        setAllFactoriesRows(dedupeActiveOrderRows(results.flat()));
      })
      .catch(() => {
        if (!cancelled) setAllFactoriesError(true);
      })
      .finally(() => {
        if (!cancelled) setAllFactoriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, factoryId, stableFactoryIds, dispatch]);

  if (factoryId != null) {
    const rows = singleFactoryQuery.data ?? [];
    return {
      rows,
      count: rows.length,
      isLoading: singleFactoryQuery.isLoading,
      isError: singleFactoryQuery.isError,
      error: singleFactoryQuery.error,
    };
  }

  const rows = allFactoriesRows ?? [];
  return {
    rows,
    count: rows.length,
    isLoading: allFactoriesLoading,
    isError: allFactoriesError,
    error: allFactoriesError ? { data: { detail: 'Failed to load orders.' } } : undefined,
  };
}
