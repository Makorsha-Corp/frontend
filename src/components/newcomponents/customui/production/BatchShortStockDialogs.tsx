import React from 'react';
import AddInventoryDialog from '@/components/newcomponents/customui/AddInventoryDialog';
import AddPurchaseOrderDialog from '@/components/newcomponents/customui/orders/AddPurchaseOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Inventory } from '@/types/inventory';

export interface ShortStockSeed {
  itemId: number;
  itemName: string;
  factoryId: number;
  quantity: number;
  existing: { id: number; qty: number } | null;
}

interface BatchShortStockDialogsProps {
  stockSeed: ShortStockSeed | null;
  purchaseSeed: ShortStockSeed | null;
  onStockOpenChange: (open: boolean) => void;
  onPurchaseOpenChange: (open: boolean) => void;
}

const BatchShortStockDialogs: React.FC<BatchShortStockDialogsProps> = ({
  stockSeed,
  purchaseSeed,
  onStockOpenChange,
  onPurchaseOpenChange,
}) => {
  const open = stockSeed != null || purchaseSeed != null;
  const { data: accounts = [] } = useGetAccountsQuery(
    { skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX },
    { skip: !open },
  );
  const { data: factories = [] } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open },
  );

  return (
    <>
      {stockSeed ? (
        <AddInventoryDialog
          open
          onOpenChange={onStockOpenChange}
          factoryId={stockSeed.factoryId}
          defaultType="STORAGE"
          initialItemId={stockSeed.itemId}
          initialItemName={stockSeed.itemName}
          initialQty={stockSeed.quantity}
          existingQty={stockSeed.existing}
        />
      ) : null}
      {purchaseSeed ? (
        <AddPurchaseOrderDialog
          open
          onOpenChange={onPurchaseOpenChange}
          accounts={accounts}
          factories={factories}
          shortageSeed={{
            factoryId: purchaseSeed.factoryId,
            itemId: purchaseSeed.itemId,
            quantity: purchaseSeed.quantity,
          }}
          onSuccess={() => onPurchaseOpenChange(false)}
        />
      ) : null}
    </>
  );
};

export function existingStorageForShort(
  storageRows: Inventory[],
  itemId: number,
  factoryId: number,
): { id: number; qty: number } | null {
  const row = storageRows.find(
    (entry) =>
      entry.item_id === itemId &&
      entry.factory_id === factoryId &&
      entry.inventory_type === 'STORAGE' &&
      !entry.is_deleted,
  );
  if (!row) return null;
  return { id: row.id, qty: Number(row.qty) };
}

export default BatchShortStockDialogs;
