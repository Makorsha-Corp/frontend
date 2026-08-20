import type { MarkupPayload, PageMarks } from '@/types/attachment';

export function emptyPageMarks(): PageMarks {
  return { strokes: [], texts: [], scribbles: [] };
}

export function getPageMarks(payload: MarkupPayload, page: number): PageMarks {
  return payload.pages[String(page)] ?? emptyPageMarks();
}

export function setPageMarks(
  payload: MarkupPayload,
  page: number,
  marks: PageMarks,
): MarkupPayload {
  const key = String(page);
  const nextPages = { ...payload.pages };
  const hasContent =
    marks.strokes.length > 0 || marks.texts.length > 0 || marks.scribbles.length > 0;
  if (hasContent) {
    nextPages[key] = marks;
  } else {
    delete nextPages[key];
  }
  return { pages: nextPages };
}

export function isPayloadEmpty(payload: MarkupPayload): boolean {
  if (!payload.pages || Object.keys(payload.pages).length === 0) {
    return true;
  }
  return Object.values(payload.pages).every(
    (page) =>
      page.strokes.length === 0 &&
      page.texts.length === 0 &&
      page.scribbles.length === 0,
  );
}

export function clonePayload(payload: MarkupPayload): MarkupPayload {
  return JSON.parse(JSON.stringify(payload)) as MarkupPayload;
}
