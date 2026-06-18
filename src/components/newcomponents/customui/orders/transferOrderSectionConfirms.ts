import { useCallback, useEffect, useState } from 'react';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';

export type TrSectionConfirmKey = 'route' | 'items';

export interface TrSectionConfirmState {
  route_confirmed: boolean;
  items_confirmed: boolean;
}

export interface TrSectionConfirmReadiness {
  ok: boolean;
  reason?: string;
}

export interface TrSectionConfirmEvent {
  id: string;
  section: TrSectionConfirmKey;
  confirmed: boolean;
  description: string;
  created_at: string;
}

const STORAGE_PREFIX = 'tr-section-confirms-v1';

const SECTION_LABELS: Record<TrSectionConfirmKey, string> = {
  route: 'Order details',
  items: 'Transfer items',
};

function storageKey(transferOrderId: number): string {
  return `${STORAGE_PREFIX}-${transferOrderId}`;
}

function loadState(transferOrderId: number): TrSectionConfirmState {
  try {
    const raw = localStorage.getItem(storageKey(transferOrderId));
    if (!raw) return { route_confirmed: false, items_confirmed: false };
    const parsed = JSON.parse(raw) as Partial<TrSectionConfirmState>;
    return {
      route_confirmed: Boolean(parsed.route_confirmed),
      items_confirmed: Boolean(parsed.items_confirmed),
    };
  } catch {
    return { route_confirmed: false, items_confirmed: false };
  }
}

function saveState(transferOrderId: number, state: TrSectionConfirmState): void {
  localStorage.setItem(storageKey(transferOrderId), JSON.stringify(state));
}

export function readTransferOrderSectionConfirms(transferOrderId: number): TrSectionConfirmState {
  return loadState(transferOrderId);
}

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

export function useTransferOrderSectionConfirms(transferOrderId: number) {
  const [confirms, setConfirms] = useState<TrSectionConfirmState>(() =>
    loadState(transferOrderId)
  );
  const [localEvents, setLocalEvents] = useState<TrSectionConfirmEvent[]>([]);

  useEffect(() => {
    setConfirms(loadState(transferOrderId));
    setLocalEvents([]);
  }, [transferOrderId]);

  const setSectionConfirmed = useCallback(
    (section: TrSectionConfirmKey, confirmed: boolean) => {
      setConfirms((prev) => {
        const next =
          section === 'route'
            ? { ...prev, route_confirmed: confirmed }
            : { ...prev, items_confirmed: confirmed };
        saveState(transferOrderId, next);
        return next;
      });
      const label = SECTION_LABELS[section];
      setLocalEvents((prev) => [
        {
          id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          section,
          confirmed,
          description: confirmed ? `${label} confirmed` : `${label} unconfirmed`,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [transferOrderId]
  );

  return {
    routeConfirmed: confirms.route_confirmed,
    itemsConfirmed: confirms.items_confirmed,
    setSectionConfirmed,
    localEvents,
  };
}
