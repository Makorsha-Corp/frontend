import type { InventoryType } from '@/types/inventory';

export const INVENTORY_TYPES: { value: InventoryType; label: string }[] = [
  { value: 'STORAGE', label: 'Storage' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'SCRAP', label: 'Scrap' },
];

export const formatCurrency = (value: number | null | undefined) =>
  value != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
    : '—';

export const formatNumber = (value: number | null | undefined) =>
  value != null ? new Intl.NumberFormat('en-US').format(value) : '—';

export interface StorageOverviewStats {
  records: number;
  totalQty: number;
  estimatedValue: number;
  byType: { type: string; uniqueCount: number; totalQty: number }[];
}

export interface ProductsOverviewStats {
  records: number;
  totalQty: number;
  totalCostValue: number;
  totalSalesValue: number;
  availableForSale: number;
  uniqueCount: number;
}
