import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';

export type TrSectionConfirmKey = 'route' | 'items';

export interface TrSectionConfirmReadiness {
  ok: boolean;
  reason?: string;
}

const SECTION_LABELS: Record<TrSectionConfirmKey, string> = {
  route: 'Order details',
  items: 'Transfer items',
};

function isRouteDefined(order: TransferOrder): boolean {
  return (
    order.source_location_id > 0 &&
    order.destination_location_id > 0 &&
    Boolean(order.source_location_type) &&
    Boolean(order.destination_location_type)
  );
}

export function getTrSectionConfirmReadiness(
  section: TrSectionConfirmKey,
  order: TransferOrder,
  items: TransferOrderItem[]
): TrSectionConfirmReadiness {
  if (section === 'route') {
    if (!isRouteDefined(order)) {
      return { ok: false, reason: 'Source and destination must be set before confirming order details' };
    }
    return { ok: true };
  }
  if (items.length === 0) {
    return { ok: false, reason: 'Add at least one transfer item before confirming' };
  }
  return { ok: true };
}

export function trSectionConfirmLabel(section: TrSectionConfirmKey): string {
  return SECTION_LABELS[section];
}
