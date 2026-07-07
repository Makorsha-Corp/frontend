import type { MachineActivityEvent } from '@/types/machineActivityEvent';

export type MachineActivityLogDisplayItem =
  | { kind: 'single'; event: MachineActivityEvent }
  | { kind: 'work_order_group'; workOrderId: number; events: MachineActivityEvent[] };

/**
 * Collapses every log entry tied to the same work order (status changes it drove, items
 * installed/replaced/borrowed, completion) into a single group, in one pass. Assumes
 * `events` is already sorted newest-first — the group is placed at the position of its
 * most-recent entry so overall chronological order is preserved.
 */
export function groupMachineActivityEvents(events: MachineActivityEvent[]): MachineActivityLogDisplayItem[] {
  const groupsByWorkOrderId = new Map<number, MachineActivityEvent[]>();
  const display: MachineActivityLogDisplayItem[] = [];

  for (const event of events) {
    const workOrderId = event.metadata?.work_order_id;
    if (typeof workOrderId === 'number') {
      let group = groupsByWorkOrderId.get(workOrderId);
      if (!group) {
        group = [];
        groupsByWorkOrderId.set(workOrderId, group);
        display.push({ kind: 'work_order_group', workOrderId, events: group });
      }
      group.push(event);
    } else {
      display.push({ kind: 'single', event });
    }
  }

  return display;
}
