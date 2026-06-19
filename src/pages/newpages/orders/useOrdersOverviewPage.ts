import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAppSelector } from '@/app/hooks';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetOrdersOverviewStatsQuery } from '@/features/orders/ordersOverviewApi';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  filterOverviewOrders,
  aggregateCountsByType,
  aggregateStatusBreakdown,
  bucketOrdersOverTime,
  extendedOverviewStats,
  recentOrders,
} from './ordersOverviewData';
import { useOrdersScopeData } from './useOrdersScopeData';

export function useOrdersOverviewPage() {
  const authFactory = useAppSelector((s) => s.auth.factory);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [factoryFilter, setFactoryFilter] = useState<string>(() =>
    authFactory ? String(authFactory.id) : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    allNormalized,
    statusById,
    purchaseOrders,
    expenseOrders,
    isLoading: scopeLoading,
    hasError: scopeError,
    salesMayTruncate,
  } = useOrdersScopeData();

  const { data: factories = [], isLoading: loadFa, isError: errFa } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const statsParams =
    dateRange.from && dateRange.to
      ? {
          from_date: format(dateRange.from, 'yyyy-MM-dd'),
          to_date: format(dateRange.to, 'yyyy-MM-dd'),
          factory_id: factoryFilter !== 'all' ? Number(factoryFilter) : undefined,
          limit: 5,
        }
      : null;

  const {
    data: apiStats,
    isLoading: loadStats,
    isError: errStats,
  } = useGetOrdersOverviewStatsQuery(statsParams!, { skip: !statsParams });

  const isLoading = scopeLoading || loadFa;
  const loadError = scopeError || errFa || errStats;

  const scopedOrders = React.useMemo(
    () =>
      filterOverviewOrders(allNormalized, {
        from: dateRange.from,
        to: dateRange.to,
        factoryId: factoryFilter,
        statusFilter: 'all',
      }),
    [allNormalized, dateRange.from, dateRange.to, factoryFilter]
  );

  const statusOptions = React.useMemo(() => {
    const labels = [...new Set(scopedOrders.map((o) => o.statusLabel))];
    return labels.sort((a, b) => a.localeCompare(b));
  }, [scopedOrders]);

  const filteredRecentOrders = React.useMemo(() => {
    const filtered = filterOverviewOrders(allNormalized, {
      from: dateRange.from,
      to: dateRange.to,
      factoryId: factoryFilter,
      statusFilter,
    });
    return recentOrders(filtered, 25);
  }, [allNormalized, dateRange.from, dateRange.to, factoryFilter, statusFilter]);

  const countsByType = React.useMemo(() => aggregateCountsByType(scopedOrders), [scopedOrders]);
  const statusBreakdown = React.useMemo(() => aggregateStatusBreakdown(scopedOrders), [scopedOrders]);
  const ordersOverTime = React.useMemo(
    () => bucketOrdersOverTime(scopedOrders, dateRange.from, dateRange.to),
    [scopedOrders, dateRange.from, dateRange.to]
  );

  const stats = React.useMemo(
    () => extendedOverviewStats(scopedOrders, new Date(), purchaseOrders, expenseOrders, statusById),
    [scopedOrders, purchaseOrders, expenseOrders, statusById]
  );

  return {
    dateRange,
    setDateRange,
    factoryFilter,
    setFactoryFilter,
    statusFilter,
    setStatusFilter,
    factories,
    statusOptions,
    isLoading,
    loadStats,
    loadError,
    salesMayTruncate,
    scopedOrders,
    countsByType,
    statusBreakdown,
    ordersOverTime,
    stats,
    totalOrdersCount: scopedOrders.length,
    filteredRecentOrders,
    apiStats: apiStats ?? {
      top_items: [],
      top_vendors: [],
      top_customers: [],
      top_expense_categories: [],
      top_factories: [],
    },
  };
}
