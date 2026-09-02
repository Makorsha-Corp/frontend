import type { MarkupPayload, PageMarks } from '@/types/attachment';

import { setPageMarks } from './pageMarks';

/** Mirror of backend `MAX_MARKUP_POINTS` in app/schemas/attachment_markup.py */
export const MAX_MARKUP_POINTS = 50_000;

export function countMarkupPoints(payload: MarkupPayload): number {
  let total = 0;
  for (const page of Object.values(payload.pages)) {
    for (const stroke of [...page.strokes, ...page.scribbles]) {
      total += stroke.points.length;
    }
    total += page.texts.length;
    total += page.stamps.length;
  }
  return total;
}

export function wouldExceedMarkupBudget(
  payload: MarkupPayload,
  page: number,
  nextMarks: PageMarks,
): boolean {
  const trial = setPageMarks(payload, page, nextMarks);
  return countMarkupPoints(trial) > MAX_MARKUP_POINTS;
}
