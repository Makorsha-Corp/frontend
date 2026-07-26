/** User-facing copy for sheet-entry / log-entry API errors (machine + date + Works slot rules). */
export function workOrderEntryErrorMessage(err: unknown, fallback: string): string {
  const detail = extractApiDetail(err);
  if (!detail) return fallback;

  if (/work order already exists for this machine/i.test(detail)) {
    return 'A work order already exists for this machine, date, and Works type. Open that row to add parts or notes — draft saves merge into it instead of creating a second order.';
  }

  return detail;
}

function extractApiDetail(err: unknown): string | undefined {
  const detail = (err as { data?: { detail?: string | Array<string | { msg?: string }> } })?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => (typeof entry === 'string' ? entry : entry?.msg))
      .filter(Boolean)
      .join(' ');
  }
  return undefined;
}
