import { buildAccountInvoiceHref, buildOrderHref } from '@/lib/entityLinks';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';

function metaNumber(meta: Record<string, unknown>, key: string): number | null {
  const value = meta[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function getCalendarEventOpenHref(event: CalendarEvent): string {
  const meta = event.meta ?? {};

  if (event.source_type === 'account_invoice') {
    const accountId = metaNumber(meta, 'account_id');
    if (accountId != null) return buildAccountInvoiceHref(accountId, event.record_id);
  }

  if (event.source_type === 'invoice_payment') {
    const accountId = metaNumber(meta, 'account_id');
    const invoiceId = metaNumber(meta, 'invoice_id');
    if (accountId != null && invoiceId != null) {
      return buildAccountInvoiceHref(accountId, invoiceId);
    }
  }

  if (event.source_type === 'purchase_order') {
    return buildOrderHref('purchase_order', event.record_id);
  }

  return event.link;
}

const POPOVER_VIEWPORT_SHELL =
  'h-[min(66vh,var(--radix-popover-content-available-height,66vh))] max-h-[min(66vh,var(--radix-popover-content-available-height,66vh))]';

/** Cream page canvas — lifts off calendar grid (bg-card). Inner panels stay card. */
const CALENDAR_POPOVER_SURFACE = 'border-border bg-background text-foreground shadow-lg';

export function getCalendarPopoverContentClass(sourceType: string): string {
  if (sourceType === 'purchase_order') {
    return cn(
      'flex w-[min(56rem,94vw)] flex-col overflow-hidden p-0',
      CALENDAR_POPOVER_SURFACE,
      POPOVER_VIEWPORT_SHELL,
    );
  }
  if (sourceType === 'account_invoice' || sourceType === 'invoice_payment') {
    return cn(
      'flex w-[min(44rem,94vw)] flex-col overflow-hidden p-0',
      CALENDAR_POPOVER_SURFACE,
      POPOVER_VIEWPORT_SHELL,
    );
  }
  return cn('w-80 p-0', CALENDAR_POPOVER_SURFACE);
}

export function isRichCalendarPreview(sourceType: string): boolean {
  return (
    sourceType === 'account_invoice' ||
    sourceType === 'invoice_payment' ||
    sourceType === 'purchase_order'
  );
}
