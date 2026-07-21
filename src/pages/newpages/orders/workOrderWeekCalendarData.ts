import type { WorkOrderSheetBundle } from '@/types/workOrderSheet';
import {
  buildOrderCountByDate,
  buildSheetWeekPickerSections,
  filterBundlesByOrderIds,
  flattenSheetBundles,
  flattenSheetBundlesToOrders,
  getWeekSectionByPosition,
  sheetCalendarGridBounds,
  type SheetFlattenLabelContext,
  type SheetWeekSection,
  type WorkOrderSheetRow,
} from '@/pages/newpages/orders/workOrderSheetData';
import {
  filterWorkOrders,
  type WorkOrderFilters,
  type WorkOrderLabelContext,
} from '@/pages/newpages/orders/workOrdersOverviewData';

export interface DeriveWorkOrderWeekCalendarViewInput {
  bundles: WorkOrderSheetBundle[];
  calendarMonth: Date;
  sheetDate: string;
  anchorWeekFrom?: Date;
  anchorWeekTo?: Date;
  filterOptsBase: Omit<WorkOrderFilters, 'from' | 'to'>;
  orderCountByDateFromApi: Record<string, number>;
  searchQuery: string;
  machineName: (id: number | null) => string;
  accountName: (id: number | null) => string | null;
  sheetLabelCtx: SheetFlattenLabelContext;
  labelCtx: WorkOrderLabelContext;
  useWeekCalendar: boolean;
}

export interface WorkOrderWeekCalendarDerivedView {
  calendarSheetRows: WorkOrderSheetRow[];
  bodySheetRows: WorkOrderSheetRow[];
  orderCountByDate: Record<string, number>;
  anchorWeekSection: SheetWeekSection | null;
  listSheetRows: WorkOrderSheetRow[];
}

function sheetRowsForDateRange(
  bundles: WorkOrderSheetBundle[],
  filterOptsBase: Omit<WorkOrderFilters, 'from' | 'to'>,
  from: Date | undefined,
  to: Date | undefined,
  labelCtx: WorkOrderLabelContext,
  machineName: (id: number | null) => string,
  accountName: (id: number | null) => string | null,
  sheetLabelCtx: SheetFlattenLabelContext,
): WorkOrderSheetRow[] {
  const orders = flattenSheetBundlesToOrders(bundles);
  const filteredOrders = filterWorkOrders(
    orders,
    { ...filterOptsBase, from, to },
    labelCtx,
  );
  const filteredOrderIds = new Set(filteredOrders.map((order) => order.id));
  const filteredBundles = filterBundlesByOrderIds(bundles, filteredOrderIds);
  return flattenSheetBundles(filteredBundles, machineName, accountName, sheetLabelCtx);
}

/** Single derive pass: month-scoped rows for popover, anchor-week rows for body. */
export function deriveWorkOrderWeekCalendarView(
  input: DeriveWorkOrderWeekCalendarViewInput,
): WorkOrderWeekCalendarDerivedView {
  const {
    bundles,
    calendarMonth,
    sheetDate,
    anchorWeekFrom,
    anchorWeekTo,
    filterOptsBase,
    orderCountByDateFromApi,
    searchQuery,
    machineName,
    accountName,
    sheetLabelCtx,
    labelCtx,
    useWeekCalendar,
  } = input;

  if (!useWeekCalendar) {
    const listSheetRows = sheetRowsForDateRange(
      bundles,
      filterOptsBase,
      undefined,
      undefined,
      labelCtx,
      machineName,
      accountName,
      sheetLabelCtx,
    );
    return {
      calendarSheetRows: [],
      bodySheetRows: [],
      orderCountByDate: {},
      anchorWeekSection: null,
      listSheetRows,
    };
  }

  const { from: calendarFrom, to: calendarTo } = sheetCalendarGridBounds(calendarMonth);
  const calendarSheetRows = sheetRowsForDateRange(
    bundles,
    filterOptsBase,
    calendarFrom,
    calendarTo,
    labelCtx,
    machineName,
    accountName,
    sheetLabelCtx,
  );
  const bodySheetRows = sheetRowsForDateRange(
    bundles,
    filterOptsBase,
    anchorWeekFrom,
    anchorWeekTo,
    labelCtx,
    machineName,
    accountName,
    sheetLabelCtx,
  );

  const orderCountByDate = searchQuery.trim()
    ? buildOrderCountByDate(calendarSheetRows)
    : orderCountByDateFromApi;

  const weekPickerSections = buildSheetWeekPickerSections(bodySheetRows, sheetDate);
  const anchorWeekSection = getWeekSectionByPosition(weekPickerSections, 'anchor') ?? null;

  return {
    calendarSheetRows,
    bodySheetRows,
    orderCountByDate,
    anchorWeekSection,
    listSheetRows: bodySheetRows,
  };
}
