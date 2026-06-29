import type { InvoiceEvent } from '@/types/accountInvoice';
import { formatInvoiceCurrency, formatInvoiceDate } from './accountInvoiceFormatters';

export interface InvoiceEventDisplayLine {
  label: string;
  from_value?: string | null;
  to_value?: string | null;
}

export interface InvoiceEventDisplay {
  title: string;
  subtitle?: string;
  lines: InvoiceEventDisplayLine[];
}

function meta(event: InvoiceEvent): Record<string, unknown> {
  return (event.metadata_json ?? {}) as Record<string, unknown>;
}

function str(value: unknown): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

function parseItemAction(description: string): string | null {
  const added = description.match(/^Item '(.+)' added manually/i);
  if (added) return `Line item added: ${added[1]}`;
  const updated = description.match(/^Item '(.+)' updated manually/i);
  if (updated) return `Line item updated: ${updated[1]}`;
  const removed = description.match(/^Item '(.+)' removed manually/i);
  if (removed) return `Line item removed: ${removed[1]}`;
  return null;
}

function parseSyncedItemLines(m: Record<string, unknown>): InvoiceEventDisplayLine[] {
  const raw = m.items;
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx) => {
    const row = item as Record<string, unknown>;
    const description = str(row.description) ?? `Item ${idx + 1}`;
    const qty = str(row.quantity);
    const unit = str(row.unit);
    const unitPrice =
      row.unit_price != null && row.unit_price !== ''
        ? formatInvoiceCurrency(Number(row.unit_price))
        : null;
    const subtotal =
      row.line_subtotal != null && row.line_subtotal !== ''
        ? formatInvoiceCurrency(Number(row.line_subtotal))
        : null;
    const parts: string[] = [];
    if (qty) parts.push(unit ? `${qty} ${unit}` : qty);
    if (unitPrice) parts.push(`@ ${unitPrice}`);
    if (subtotal) parts.push(subtotal);
    const detail = parts.length > 0 ? parts.join(' · ') : null;
    return detail
      ? { label: description, to_value: detail }
      : { label: 'Item', to_value: description };
  });
}

function itemsPreviewSubtitle(
  lines: InvoiceEventDisplayLine[],
  count: number | null | undefined
): string | undefined {
  if (lines.length > 0) {
    const names = lines
      .slice(0, 2)
      .map((line) => (line.label === 'Item' ? line.to_value : line.label) ?? '')
      .filter(Boolean);
    if (names.length === 0) return undefined;
    if (lines.length === 1) return String(names[0]);
    if (lines.length === 2) return names.join(', ');
    return `${names.join(', ')}, +${lines.length - 2} more`;
  }
  if (count != null && count > 0) {
    return count === 1 ? 'Synced from linked order' : `${count} items synced`;
  }
  return undefined;
}

function collapsedLinesPreview(lines: InvoiceEventDisplayLine[]): string {
  const preview = itemsPreviewSubtitle(lines, lines.length);
  if (preview) return preview;
  const first = lines[0];
  if (!first) return '';
  const value = first.to_value ?? first.from_value ?? '';
  if (first.from_value != null && first.to_value != null) {
    return `${first.label}: ${first.from_value} → ${first.to_value}`;
  }
  return value ? `${first.label}: ${value}` : first.label;
}

export function formatInvoiceEventDisplay(event: InvoiceEvent): InvoiceEventDisplay {
  const m = meta(event);
  const desc = event.description ?? '';

  switch (event.event_type) {
    case 'created': {
      const invoiceType = str(m.invoice_type);
      return {
        title: 'Draft invoice created',
        subtitle: invoiceType ? `${invoiceType.charAt(0).toUpperCase()}${invoiceType.slice(1)} invoice` : undefined,
        lines: [],
      };
    }
    case 'confirmed': {
      const amount = str(m.invoice_amount);
      return {
        title: 'Invoice finalized',
        subtitle: amount ? formatInvoiceCurrency(Number(amount)) : undefined,
        lines: [],
      };
    }
    case 'reverted_to_draft':
      return { title: 'Reverted to draft', lines: [] };
    case 'voided': {
      const voidNote = str(m.void_note);
      const paymentsVoided = m.payments_voided;
      const lines: InvoiceEventDisplayLine[] = [];
      if (voidNote) {
        lines.push({ label: 'Reason', to_value: voidNote });
      }
      if (paymentsVoided != null) {
        lines.push({
          label: 'Payments voided',
          to_value: String(paymentsVoided),
        });
      }
      return {
        title: 'Invoice voided',
        subtitle: voidNote && lines.length === 0 ? voidNote : undefined,
        lines,
      };
    }
    case 'receiving_started_set': {
      const legacyPayment = /first payment/i.test(desc);
      const poMatch = desc.match(/PO #(\S+)/i);
      return {
        title: 'Receiving started',
        subtitle: legacyPayment
          ? 'Linked order receiving recorded'
          : poMatch
            ? `Purchase order ${poMatch[1]}`
            : desc.includes('linked order')
              ? 'Linked order receiving recorded'
              : undefined,
        lines: [],
      };
    }
    case 'due_date_changed': {
      const oldDate = str(m.old_due_date);
      const newDate = str(m.new_due_date);
      return {
        title: 'Due date updated',
        lines:
          oldDate != null || newDate != null
            ? [
                {
                  label: 'Due date',
                  from_value: oldDate ? formatInvoiceDate(oldDate) : 'Not set',
                  to_value: newDate ? formatInvoiceDate(newDate) : 'Not set',
                },
              ]
            : [],
      };
    }
    case 'items_synced': {
      const count = typeof m.item_count === 'number' ? m.item_count : Number(m.item_count);
      const lines = parseSyncedItemLines(m);
      return {
        title: 'Items synced from order',
        subtitle: itemsPreviewSubtitle(lines, Number.isFinite(count) ? count : null),
        lines,
      };
    }
    case 'allow_payments_changed': {
      const enabled = m.allow_payments;
      if (desc === 'Payments enabled' || desc === 'Payments disabled') {
        return { title: desc, lines: [] };
      }
      return {
        title: 'Payments setting changed',
        subtitle:
          enabled === true ? 'Payments enabled' : enabled === false ? 'Payments disabled' : undefined,
        lines: [],
      };
    }
    case 'payment_lock_changed': {
      if (desc === 'Payment lock updated') {
        const reason = str(m.payment_locked_reason);
        return {
          title: 'Payment lock updated',
          subtitle: reason ?? undefined,
          lines: reason ? [{ label: 'Lock reason', to_value: reason }] : [],
        };
      }
      const reason = str(m.payment_locked_reason);
      return {
        title: 'Payment lock updated',
        subtitle: reason ?? undefined,
        lines: reason ? [{ label: 'Lock reason', to_value: reason }] : [],
      };
    }
    case 'payment_recorded': {
      const amount = m.payment_amount;
      const method = str(m.payment_method);
      const statusBefore = str(m.payment_status_before);
      const statusAfter = str(m.payment_status_after);
      const subtitleParts: string[] = [];
      if (amount != null) {
        subtitleParts.push(formatInvoiceCurrency(Number(amount)));
      }
      if (method) subtitleParts.push(method);
      const lines: InvoiceEventDisplayLine[] = [];
      if (statusBefore != null && statusAfter != null && statusBefore !== statusAfter) {
        lines.push({
          label: 'Payment status',
          from_value: statusBefore,
          to_value: statusAfter,
        });
      } else if (statusAfter) {
        lines.push({ label: 'Payment status', to_value: statusAfter });
      }
      return {
        title: 'Payment recorded',
        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
        lines,
      };
    }
    case 'payment_voided': {
      const amount = m.payment_amount;
      const voidNote = str(m.void_note);
      const statusBefore = str(m.payment_status_before);
      const statusAfter = str(m.payment_status_after);
      const subtitleParts: string[] = [];
      if (amount != null) {
        subtitleParts.push(formatInvoiceCurrency(Number(amount)));
      }
      const lines: InvoiceEventDisplayLine[] = [];
      if (voidNote) {
        lines.push({ label: 'Reason', to_value: voidNote });
      }
      if (statusBefore != null && statusAfter != null && statusBefore !== statusAfter) {
        lines.push({
          label: 'Payment status',
          from_value: statusBefore,
          to_value: statusAfter,
        });
      }
      return {
        title: 'Payment voided',
        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
        lines,
      };
    }
    case 'item_manually_updated': {
      if (desc === 'Line item added') {
        const amount = m.line_subtotal != null ? formatInvoiceCurrency(Number(m.line_subtotal)) : null;
        const lines: InvoiceEventDisplayLine[] = amount
          ? [{ label: 'Line total', to_value: amount }]
          : [];
        return {
          title: 'Line item added',
          subtitle: str(m.description) ?? undefined,
          lines,
        };
      }
      if (desc === 'Line item updated') {
        const lines: InvoiceEventDisplayLine[] = [];
        const amount = m.line_subtotal != null ? formatInvoiceCurrency(Number(m.line_subtotal)) : null;
        if (amount) lines.push({ label: 'Line total', to_value: amount });
        return {
          title: 'Line item updated',
          subtitle: str(m.description) ?? undefined,
          lines,
        };
      }
      if (desc === 'Line item removed') {
        return {
          title: 'Line item removed',
          subtitle: str(m.description) ?? undefined,
          lines: [],
        };
      }
      if (desc === 'Invoice details updated') {
        return { title: 'Invoice details updated', lines: [] };
      }
      if (desc === 'Items updated') {
        const lines = parseSyncedItemLines(m);
        return {
          title: 'Items updated',
          subtitle: itemsPreviewSubtitle(lines, typeof m.item_count === 'number' ? m.item_count : null),
          lines,
        };
      }
      const itemAction = parseItemAction(desc);
      if (itemAction) {
        const colonIdx = itemAction.indexOf(': ');
        if (colonIdx >= 0) {
          return {
            title: itemAction.slice(0, colonIdx),
            subtitle: itemAction.slice(colonIdx + 2),
            lines: [],
          };
        }
        return { title: itemAction, lines: [] };
      }
      if (/items updated manually/i.test(desc) || /items synced/i.test(desc)) {
        return { title: 'Items updated', lines: [] };
      }
      if (/fields updated manually/i.test(desc) || /admin field/i.test(desc)) {
        const fields = desc.replace(/^Invoice (fields updated manually|admin field\(s\) updated):?\s*/i, '');
        return {
          title: 'Invoice details updated',
          subtitle: fields || undefined,
          lines: [],
        };
      }
      return { title: 'Invoice updated', subtitle: desc || undefined, lines: [] };
    }
    default:
      return {
        title: desc || event.event_type.replace(/_/g, ' '),
        lines: [],
      };
  }
}
