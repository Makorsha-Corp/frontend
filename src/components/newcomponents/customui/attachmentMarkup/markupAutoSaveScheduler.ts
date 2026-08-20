import type { MarkupPayload } from '@/types/attachment';

export const MARKUP_AUTOSAVE_DEBOUNCE_MS = 400;

export function createDebouncedMarkupSave(
  save: (payload: MarkupPayload) => Promise<void>,
  debounceMs = MARKUP_AUTOSAVE_DEBOUNCE_MS,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latest: MarkupPayload = { pages: {} };

  const schedule = (payload: MarkupPayload) => {
    latest = payload;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void save(latest);
    }, debounceMs);
  };

  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    void save(latest);
  };

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return { schedule, flush, cancel, getLatest: () => latest };
}
