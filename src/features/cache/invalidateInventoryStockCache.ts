/**
 * Cross-slice RTK Query invalidation after stock movements (storage, machine, ledgers).
 */
import type { AppDispatch } from '@/app/store';
import { inventoryApi } from '@/features/inventory/inventoryApi';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import { machineItemsApi } from '@/features/machineItems/machineItemsApi';

export function invalidateIncomingSummaryCache(dispatch: AppDispatch): void {
  dispatch(inventoryApi.util.invalidateTags(['IncomingSummary']));
}

export function invalidateInventoryStockCache(dispatch: AppDispatch): void {
  dispatch(inventoryApi.util.invalidateTags(['Inventory', 'InventoryStats', 'IncomingSummary']));
  dispatch(machineItemsApi.util.invalidateTags(['MachineItem']));
  dispatch(ledgersApi.util.invalidateTags(['Ledger', 'LedgerBalance', 'LedgerReports']));
}
