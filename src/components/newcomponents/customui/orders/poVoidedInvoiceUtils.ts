import type { PurchaseOrderEvent } from '@/types/purchaseOrder';

export interface PoVoidedInvoiceRef {
  invoiceId: number;
  voidedAt: string;
  eventDescription: string;
}

export function getVoidedInvoicesFromPoEvents(events: PurchaseOrderEvent[]): PoVoidedInvoiceRef[] {
  const byId = new Map<number, PoVoidedInvoiceRef>();

  for (const event of events) {
    if (event.event_type !== 'invoice_voided') continue;
    const invoiceId =
      typeof event.metadata?.invoice_id === 'number'
        ? event.metadata.invoice_id
        : parseInvoiceIdFromVoidDescription(event.description);
    if (invoiceId == null) continue;

    byId.set(invoiceId, {
      invoiceId,
      voidedAt: event.created_at,
      eventDescription: event.description,
    });
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.voidedAt).getTime() - new Date(a.voidedAt).getTime()
  );
}

function parseInvoiceIdFromVoidDescription(description: string): number | null {
  const match = description.match(/Invoice #(\d+) voided/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isNaN(id) ? null : id;
}
