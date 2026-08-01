import type { InvoiceItem } from '@/types/accountInvoice';
import { formatInvoiceCurrency } from './accountInvoiceFormatters';

export interface InvoiceItemsPreviewOptions {
  maxLines?: number;
  prioritizeItemId?: number | null;
  prioritizeItemName?: string | null;
}

function itemMatchesHighlight(
  item: InvoiceItem,
  itemId: number | null | undefined,
  itemName: string | null | undefined,
): boolean {
  if (itemId != null && item.item_id === itemId) return true;
  const needle = itemName?.trim().toLowerCase();
  if (!needle) return false;
  const haystack = (item.description ?? '').trim().toLowerCase();
  return haystack.includes(needle) || needle.includes(haystack);
}

function sortItemsForPreview(
  items: InvoiceItem[],
  options: InvoiceItemsPreviewOptions,
): InvoiceItem[] {
  const { prioritizeItemId, prioritizeItemName } = options;
  if (prioritizeItemId == null && !prioritizeItemName?.trim()) {
    return items;
  }

  return [...items].sort((a, b) => {
    const rank = (item: InvoiceItem) =>
      itemMatchesHighlight(item, prioritizeItemId, prioritizeItemName) ? 0 : 1;
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.line_number - b.line_number;
  });
}

function formatInvoiceItemLine(item: InvoiceItem, compact: boolean): string {
  const description = item.description?.trim() || 'Line item';
  const qty = Number(item.quantity);
  const unit = item.unit?.trim() || null;
  const unitPrice =
    item.unit_price != null ? formatInvoiceCurrency(Number(item.unit_price)) : null;

  if (!compact) {
    const qtyLabel = unit ? `${qty} ${unit}` : String(qty);
    return unitPrice ? `${qtyLabel} ${description} @ ${unitPrice}` : `${qtyLabel} ${description}`;
  }

  const qtyPart = unit ? `${qty} ${unit}` : String(qty);
  return unitPrice ? `${description} (${qtyPart} @ ${unitPrice})` : `${description} (${qtyPart})`;
}

/**
 * Compact one-line preview for open-invoice list rows.
 * Single item: "24 meter Mooshda @ $2.71"
 * Multiple: "Mooshda (24 m @ $10), Wool (50 lbs @ $8) +1 more"
 */
export function formatInvoiceItemsPreview(
  items: InvoiceItem[],
  maxLinesOrOptions: number | InvoiceItemsPreviewOptions = 2,
): string | null {
  const options: InvoiceItemsPreviewOptions =
    typeof maxLinesOrOptions === 'number'
      ? { maxLines: maxLinesOrOptions }
      : maxLinesOrOptions;
  const maxLines = options.maxLines ?? 2;

  if (items.length === 0) return null;

  const sorted = sortItemsForPreview(items, options);

  if (sorted.length === 1) {
    return formatInvoiceItemLine(sorted[0], false);
  }

  const visible = sorted.slice(0, maxLines);
  const hiddenCount = sorted.length - visible.length;
  const joined = visible.map((item) => formatInvoiceItemLine(item, true)).join(', ');
  return hiddenCount > 0 ? `${joined} +${hiddenCount} more` : joined;
}
