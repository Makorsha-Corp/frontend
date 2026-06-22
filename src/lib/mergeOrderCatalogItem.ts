/** Merge duplicate catalog-item lines in order forms. */

export type PricedCatalogLine = {
  item_id: number;
  quantity_ordered: number;
  unit_price: number;
  notes?: string;
};

export type QuantityCatalogLine = {
  item_id: number;
  quantity: number;
  notes?: string;
};

function weightedUnitPrice(
  existingQty: number,
  existingPrice: number,
  addQty: number,
  addPrice: number
): number {
  const oldSub = existingQty * existingPrice;
  const addSub = addQty * addPrice;
  const newQty = existingQty + addQty;
  return newQty > 0 ? (oldSub + addSub) / newQty : addPrice;
}

export function mergePricedCatalogLine<T extends PricedCatalogLine>(
  lines: T[],
  incoming: T
): T[] {
  const idx = lines.findIndex((line) => line.item_id === incoming.item_id);
  if (idx === -1) return [...lines, incoming];

  const existing = lines[idx];
  const merged = {
    ...existing,
    quantity_ordered: existing.quantity_ordered + incoming.quantity_ordered,
    unit_price: weightedUnitPrice(
      existing.quantity_ordered,
      existing.unit_price,
      incoming.quantity_ordered,
      incoming.unit_price
    ),
    notes: incoming.notes ?? existing.notes,
  };

  return lines.map((line, i) => (i === idx ? merged : line));
}

export function mergeQuantityCatalogLine<T extends QuantityCatalogLine>(
  lines: T[],
  incoming: T
): T[] {
  const idx = lines.findIndex((line) => line.item_id === incoming.item_id);
  if (idx === -1) return [...lines, incoming];

  const existing = lines[idx];
  const merged = {
    ...existing,
    quantity: existing.quantity + incoming.quantity,
    notes: incoming.notes ?? existing.notes,
  };

  return lines.map((line, i) => (i === idx ? merged : line));
}

export function mergePricedCatalogLines<T extends PricedCatalogLine>(lines: T[]): T[] {
  return lines.reduce<T[]>((acc, line) => mergePricedCatalogLine(acc, line), []);
}

export function mergeQuantityCatalogLines<T extends QuantityCatalogLine>(lines: T[]): T[] {
  return lines.reduce<T[]>((acc, line) => mergeQuantityCatalogLine(acc, line), []);
}
