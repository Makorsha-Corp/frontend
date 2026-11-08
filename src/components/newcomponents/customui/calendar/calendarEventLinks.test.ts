import { describe, expect, it } from 'vitest';
import { getCalendarEventOpenHref } from './calendarEventLinks';
import type { CalendarEvent } from '@/types/calendar';

function baseEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'x:1:planned_date',
    category: 'work_orders',
    source_type: 'work_order',
    record_id: 1,
    date: '2026-03-10',
    date_label: 'Planned date',
    title: 'WO-1',
    subtitle: null,
    link: '/orders/work',
    meta: {},
    ...overrides,
  };
}

describe('getCalendarEventOpenHref', () => {
  it('opens work order on machines tab with scope from meta', () => {
    const href = getCalendarEventOpenHref(
      baseEvent({
        meta: { factory_id: 2, machine_id: 9 },
      }),
    );
    expect(href).toContain('/machines?');
    expect(href).toContain('tab=workOrders');
    expect(href).toContain('orderId=1');
    expect(href).toContain('factoryId=2');
    expect(href).toContain('woMachine=9');
  });

  it('opens production batch by batchId even when link is stale', () => {
    const href = getCalendarEventOpenHref(
      baseEvent({
        source_type: 'production_batch',
        category: 'production',
        record_id: 55,
        link: '/production',
      }),
    );
    expect(href).toBe('/production?batchId=55');
  });
});
