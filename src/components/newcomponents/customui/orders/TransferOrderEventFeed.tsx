import { useMemo } from 'react';
import type { TransferOrderEvent as ApiTransferOrderEvent } from '@/types/transferOrder';

const CONFIRM_EVENT_TYPES = new Set([
  'route_confirmed',
  'route_unconfirmed',
  'items_confirmed',
  'items_unconfirmed',
  'approved',
  'approval_withdrawn',
  'approvals_reset',
  'transfer_recorded',
  'transfer_cleared',
  'item_added',
  'item_removed',
]);

export function useTransferOrderEvents(
  apiEvents: ApiTransferOrderEvent[] | undefined,
  showConfirmEvents: boolean
) {
  const allEvents = useMemo(() => apiEvents ?? [], [apiEvents]);

  const filteredEvents = useMemo(
    () =>
      showConfirmEvents
        ? allEvents
        : allEvents.filter((e) => !CONFIRM_EVENT_TYPES.has(e.event_type)),
    [allEvents, showConfirmEvents]
  );

  return { allEvents, filteredEvents };
}

export { default as ToEventLogRow } from './ToEventLogRow';
