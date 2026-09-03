import type { MarkupPayload, MarkupStroke, PageMarks } from '@/types/attachment';

export function createStrokeId(): string {
  return crypto.randomUUID();
}

export function findStrokeIndexById(strokes: MarkupStroke[], id: string | null): number {
  if (!id) return -1;
  return strokes.findIndex((stroke) => stroke.id === id);
}

export function findStrokeById(
  strokes: MarkupStroke[],
  id: string | null,
): MarkupStroke | undefined {
  const index = findStrokeIndexById(strokes, id);
  return index >= 0 ? strokes[index] : undefined;
}

export function ensurePageMarkStrokeIds(marks: PageMarks): PageMarks {
  let changed = false;
  const strokes = marks.strokes.map((stroke) => {
    if (stroke.id) return stroke;
    changed = true;
    return { ...stroke, id: createStrokeId() };
  });
  return changed ? { ...marks, strokes } : marks;
}

export function ensurePayloadStrokeIds(payload: MarkupPayload): MarkupPayload {
  let changed = false;
  const pages: MarkupPayload['pages'] = {};
  for (const [key, pageMarks] of Object.entries(payload.pages)) {
    const next = ensurePageMarkStrokeIds(pageMarks);
    if (next !== pageMarks) changed = true;
    pages[key] = next;
  }
  return changed ? { pages } : payload;
}
