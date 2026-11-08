/**
 * Extract the FastAPI `detail` message from an RTK Query error without
 * resorting to `any`. Falls back to the given message when the shape
 * doesn't match (network errors, unexpected payloads, plain Errors).
 */
function fieldErrorText(data: object): string | null {
  if (!('errors' in data)) return null;
  const errors = (data as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const first = errors[0];
  if (typeof first !== 'object' || first === null) return null;
  const message = 'message' in first && typeof first.message === 'string' ? first.message.trim() : '';
  const field = 'field' in first && typeof first.field === 'string' ? first.field.trim() : '';
  if (!message) return null;
  return field && field !== 'body' ? `${field}: ${message}` : message;
}

export function apiErrorDetail(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'object' && data !== null) {
      const fieldText = fieldErrorText(data);
      const detail = 'detail' in data && typeof data.detail === 'string' ? data.detail.trim() : '';
      if (fieldText && (!detail || detail === 'Request validation failed')) return fieldText;
      if (detail) return detail;
      if (fieldText) return fieldText;
    }
  }
  return fallback;
}
