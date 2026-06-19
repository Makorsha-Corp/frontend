import { useMemo } from 'react';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetTransferOrdersQuery } from '@/features/transferOrders/transferOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
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

export function useOrdersScopeData() {
  const { data: purchaseOrders = [], isLoading: loadPo, isError: errPo } = useGetPurchaseOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: transferOrders = [], isLoading: loadTo, isError: errTo } = useGetTransferOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: expenseOrders = [], isLoading: loadEo, isError: errEo } = useGetExpenseOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
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

  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines, factorySections),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, factorySections, projects]
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
  };
}
