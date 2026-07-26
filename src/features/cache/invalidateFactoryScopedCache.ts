/**
 * Targeted RTK Query invalidation when navbar global factory changes.
 * Page-local factory picks rely on query arg changes; this refreshes stale cache
 * for slices that may not key every query on factory_id.
 */
import type { AppDispatch } from '@/app/store';
import { calendarApi } from '@/features/calendar/calendarApi';
import { inventoryApi } from '@/features/inventory/inventoryApi';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import { machinesApi } from '@/features/machines/machinesApi';
import { productionApi } from '@/features/production/productionApi';
import { productsApi } from '@/features/products/productsApi';
import { projectsApi } from '@/features/projects/projectsApi';
import { purchaseOrdersApi } from '@/features/purchaseOrders/purchaseOrdersApi';
import { transferOrdersApi } from '@/features/transferOrders/transferOrdersApi';
import { workOrdersApi } from '@/features/workOrders/workOrdersApi';

export function invalidateFactoryScopedCache(dispatch: AppDispatch): void {
  dispatch(machinesApi.util.invalidateTags(['Machine', 'MachineActivity']));
  dispatch(workOrdersApi.util.invalidateTags(['WorkOrder']));
  dispatch(purchaseOrdersApi.util.invalidateTags(['PurchaseOrder', 'ActiveOrders']));
  dispatch(transferOrdersApi.util.invalidateTags(['TransferOrder']));
  dispatch(productionApi.util.invalidateTags(['ProductionLine', 'ProductionBatch']));
  dispatch(inventoryApi.util.invalidateTags(['Inventory']));
  dispatch(productsApi.util.invalidateTags(['Product', 'ProductLedger']));
  dispatch(projectsApi.util.invalidateTags(['Project']));
  dispatch(
    ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance', 'LedgerReports']),
  );
  dispatch(calendarApi.util.invalidateTags(['CalendarEvent']));
}
