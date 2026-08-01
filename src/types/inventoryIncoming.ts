export type IncomingOrderKind = 'purchase' | 'transfer';

export interface IncomingOrderLine {
  order_kind: IncomingOrderKind;
  order_id: number;
  order_number: string;
  status_name: string | null;
  pending_qty: number | string;
}

export interface ItemIncomingSummary {
  factory_id: number;
  item_id: number;
  total_pending_qty: number | string;
  order_count: number;
  orders: IncomingOrderLine[];
}

export function incomingSummaryKey(factoryId: number, itemId: number): string {
  return `${factoryId}:${itemId}`;
}
