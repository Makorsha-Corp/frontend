export type OrderLinkType =
  | 'purchase_order'
  | 'transfer_order'
  | 'expense_order'
  | 'work_order'
  | 'sales_order';

export function buildOrderHref(orderType: string, orderId: number): string {
  switch (orderType) {
    case 'purchase_order':
      return `/orders/purchase?orderId=${orderId}`;
    case 'transfer_order':
      return `/orders/transfer?orderId=${orderId}`;
    case 'expense_order':
      return `/orders/expense?orderId=${orderId}`;
    case 'work_order':
      return `/orders/work?orderId=${orderId}`;
    case 'sales_order':
      return `/orders/sales?orderId=${orderId}`;
    default:
      return '/orders';
  }
}

export function buildAccountHref(accountId: number): string {
  return `/accounts/${accountId}`;
}

export function buildMachineHref(machineId: number): string {
  return `/machines?machineId=${machineId}&details=1`;
}

export function buildFactoryHref(factoryId: number): string {
  return `/factories/${factoryId}`;
}

export function buildFactorySectionHref(factoryId: number, sectionId: number): string {
  return `/factories/${factoryId}/sections/${sectionId}`;
}

export function buildItemHref(itemId: number): string {
  return `/items?itemId=${itemId}&details=1`;
}

export function buildWorkOrderHref(workOrderId: number): string {
  return buildOrderHref('work_order', workOrderId);
}

export function buildProductionHref(): string {
  return '/production';
}

export function buildProjectHref(): string {
  return '/project';
}

export function buildStorageHref(opts: {
  factoryId: number;
  itemId: number;
  tab?: 'storage' | 'products';
  inventoryType?: string;
}): string {
  const params = new URLSearchParams();
  params.set('factoryId', String(opts.factoryId));
  params.set('itemId', String(opts.itemId));
  if (opts.tab === 'products') {
    params.set('tab', 'products');
  }
  if (opts.inventoryType) {
    params.set('inventoryType', opts.inventoryType);
  }
  return `/storage?${params.toString()}`;
}
