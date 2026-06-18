import { useMemo } from 'react';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';
import type { TransferApprovalEvent } from './transferOrderApprovals';
import type { TrSectionConfirmEvent } from './transferOrderSectionConfirms';
import ToEventLogRow, { type TransferOrderEvent } from './ToEventLogRow';

export function buildTransferOrderEvents(
  order: TransferOrder,
  items: TransferOrderItem[],
  localApprovalEvents: TransferApprovalEvent[],
  localSectionEvents: TrSectionConfirmEvent[] = []
): TransferOrderEvent[] {
  const events: TransferOrderEvent[] = [];

  events.push({
    id: `created-${order.id}`,
    event_type: 'created',
    description: `Transfer order ${order.transfer_number} created`,
    created_at: order.created_at,
  });

  if (order.updated_at && order.updated_at !== order.created_at) {
    events.push({
      id: `updated-${order.id}`,
      event_type: 'updated',
      description: 'Order details updated',
      created_at: order.updated_at,
    });
  }

  if (order.completed_at) {
    events.push({
      id: `completed-${order.id}`,
      event_type: 'completed',
      description: 'Transfer marked complete',
      created_at: order.completed_at,
    });
  }

  for (const item of items) {
    if (item.approved_at) {
      events.push({
        id: `item-approved-${item.id}`,
        event_type: 'item_approved',
        description: `Line ${item.line_number}: ${item.item_name ?? `Item #${item.item_id}`} approved`,
        created_at: item.approved_at,
        isConfirm: true,
      });
    }
    if (item.transferred_at) {
      events.push({
        id: `item-transferred-${item.id}`,
        event_type: 'item_transferred',
        description: `Line ${item.line_number}: ${item.item_name ?? `Item #${item.item_id}`} transferred`,
        created_at: item.transferred_at,
        isConfirm: true,
      });
    }
  }

  for (const evt of localApprovalEvents) {
    events.push({
      id: evt.id,
      event_type: evt.event_type,
      description: evt.description,
      created_at: evt.created_at,
      user_name: evt.user_name,
    });
  }

  for (const evt of localSectionEvents) {
    events.push({
      id: evt.id,
      event_type: evt.confirmed ? 'section_confirmed' : 'section_unconfirmed',
      description: evt.description,
      created_at: evt.created_at,
      isConfirm: true,
    });
  }

  return events.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function useTransferOrderEvents(
  order: TransferOrder,
  items: TransferOrderItem[],
  localApprovalEvents: TransferApprovalEvent[],
  showConfirmEvents: boolean,
  localSectionEvents: TrSectionConfirmEvent[] = []
) {
  const allEvents = useMemo(
    () => buildTransferOrderEvents(order, items, localApprovalEvents, localSectionEvents),
    [order, items, localApprovalEvents, localSectionEvents]
  );

  const filteredEvents = useMemo(
    () => (showConfirmEvents ? allEvents : allEvents.filter((e) => !e.isConfirm)),
    [allEvents, showConfirmEvents]
  );

  return { allEvents, filteredEvents };
}

export { ToEventLogRow };
