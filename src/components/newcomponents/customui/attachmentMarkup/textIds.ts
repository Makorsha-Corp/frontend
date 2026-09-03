import type { MarkupPayload, MarkupText, PageMarks } from '@/types/attachment';

export function createTextId(): string {
  return crypto.randomUUID();
}

export function findTextIndexById(texts: MarkupText[], id: string | null): number {
  if (!id) return -1;
  return texts.findIndex((text) => text.id === id);
}

export function findTextById(
  texts: MarkupText[],
  id: string | null,
): MarkupText | undefined {
  const index = findTextIndexById(texts, id);
  return index >= 0 ? texts[index] : undefined;
}

export function ensurePageMarkTextIds(marks: PageMarks): PageMarks {
  let changed = false;
  const texts = marks.texts.map((text) => {
    if (text.id) return text;
    changed = true;
    return { ...text, id: createTextId() };
  });
  return changed ? { ...marks, texts } : marks;
}

export function ensurePayloadTextIds(payload: MarkupPayload): MarkupPayload {
  let changed = false;
  const pages: MarkupPayload['pages'] = {};
  for (const [key, pageMarks] of Object.entries(payload.pages)) {
    const next = ensurePageMarkTextIds(pageMarks);
    if (next !== pageMarks) changed = true;
    pages[key] = next;
  }
  return changed ? { pages } : payload;
}
