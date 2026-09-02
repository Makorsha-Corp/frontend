import type { MarkupPayload, MarkupStamp, PageMarks } from '@/types/attachment';

export function createStampId(): string {
  return crypto.randomUUID();
}

export function findStampIndexById(stamps: MarkupStamp[], id: string | null): number {
  if (!id) return -1;
  return stamps.findIndex((stamp) => stamp.id === id);
}

export function findStampById(
  stamps: MarkupStamp[],
  id: string | null,
): MarkupStamp | undefined {
  const index = findStampIndexById(stamps, id);
  return index >= 0 ? stamps[index] : undefined;
}

export function ensurePageMarkStampIds(marks: PageMarks): PageMarks {
  let changed = false;
  const stamps = marks.stamps.map((stamp) => {
    if (stamp.id) return stamp;
    changed = true;
    return { ...stamp, id: createStampId() };
  });
  return changed ? { ...marks, stamps } : marks;
}

export function ensurePayloadStampIds(payload: MarkupPayload): MarkupPayload {
  let changed = false;
  const pages: MarkupPayload['pages'] = {};
  for (const [key, pageMarks] of Object.entries(payload.pages)) {
    const next = ensurePageMarkStampIds(pageMarks);
    if (next !== pageMarks) changed = true;
    pages[key] = next;
  }
  return changed ? { pages } : payload;
}
