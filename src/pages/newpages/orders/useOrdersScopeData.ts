import { useMemo } from 'react';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  buildMachineIdToFactoryId,
  buildProjectIdToFactoryId,
  normalizeOrders,
  type OverviewOrder,
} from './ordersOverviewData';
import { useSalesOrdersForOverview } from './useSalesOrdersForOverview';
import {
  usePaginatedPurchaseOrdersForOverview,
  usePaginatedTransferOrdersForOverview,
  usePaginatedExpenseOrdersForOverview,
} from './usePaginatedHubOrdersForOverview';

export function useOrdersScopeData() {
  const {
    purchaseOrders,
    isLoading: loadPo,
    isError: errPo,
    mayTruncate: purchaseMayTruncate,
  } = usePaginatedPurchaseOrdersForOverview();
  const {
    transferOrders,
    isLoading: loadTo,
    isError: errTo,
    mayTruncate: transferMayTruncate,
  } = usePaginatedTransferOrdersForOverview();
  const {
    expenseOrders,
    isLoading: loadEo,
    isError: errEo,
    mayTruncate: expenseMayTruncate,
  } = usePaginatedExpenseOrdersForOverview();
  const {
    salesOrders,
    isLoading: loadSo,
    isError: errSo,
    mayTruncate: salesMayTruncate,
  } = useSalesOrdersForOverview();
  const { data: workOrders = [], isLoading: loadWo, isError: errWo } = useGetWorkOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: statuses = [], isLoading: loadSt, isError: errSt } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: machines = [], isLoading: loadMa, isError: errMa } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: factorySections = [], isLoading: loadSec, isError: errSec } =
    useGetFactorySectionsQuery({
      skip: 0,
      limit: API_LIMITS.FLEXIBLE_1000,
    });
  const { data: projects = [], isLoading: loadPr, isError: errPr } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const isLoading = loadPo || loadTo || loadEo || loadSo || loadWo || loadSt || loadMa || loadSec || loadPr;
  const hasError = errPo || errTo || errEo || errSo || errWo || errSt || errMa || errSec || errPr;
  const hubOrdersMayTruncate =
    purchaseMayTruncate || transferMayTruncate || expenseMayTruncate || salesMayTruncate;

  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, projects]
  );

  const allNormalized: OverviewOrder[] = useMemo(
    () =>
      normalizeOrders(
        purchaseOrders,
        transferOrders,
        expenseOrders,
        salesOrders,
        workOrders,
        statusById,
        resolutionMaps
      ),
    [purchaseOrders, transferOrders, expenseOrders, salesOrders, workOrders, statusById, resolutionMaps]
  );

  return {
    allNormalized,
    statusById,
    resolutionMaps,
    purchaseOrders,
    expenseOrders,
    machines,
    factorySections,
    projects,
    isLoading,
    hasError,
    salesMayTruncate,
    hubOrdersMayTruncate,
  };
}
