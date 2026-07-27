/** User-facing copy for sheet-entry / log-entry API errors. */
export function workOrderEntryErrorMessage(err: unknown, fallback: string): string {
  const detail = extractApiDetail(err);
  if (!detail) return fallback;
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
