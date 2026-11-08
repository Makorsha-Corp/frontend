/** Two-decimal production quantity. Empty or invalid input returns null. */
export function parseProductionQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function roundProductionQuantity(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Display qty without trailing zeros (max 2 decimals). */
export function formatProductionQuantity(n: number): string {
  const rounded = roundProductionQuantity(n);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

/** Scale factor from target ÷ recipe base output. */
export function formatProductionScaleFactor(n: number): string {
  return formatProductionQuantity(n);
}
