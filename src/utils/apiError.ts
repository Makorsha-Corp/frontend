/**
 * Extract the FastAPI `detail` message from an RTK Query error without
 * resorting to `any`. Falls back to the given message when the shape
 * doesn't match (network errors, unexpected payloads, plain Errors).
 */
export function apiErrorDetail(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
  }
  return fallback;
}
