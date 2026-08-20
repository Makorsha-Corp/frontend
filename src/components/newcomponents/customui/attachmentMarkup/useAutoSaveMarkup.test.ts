import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MarkupPayload } from '@/types/attachment';

import {
  MARKUP_AUTOSAVE_DEBOUNCE_MS,
  createDebouncedMarkupSave,
} from './markupAutoSaveScheduler';

describe('createDebouncedMarkupSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces until idle', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const payload: MarkupPayload = {
      pages: {
        '1': {
          strokes: [
            {
              color: '#000',
              width: 0.018,
              points: [
                { x: 0.1, y: 0.2 },
                { x: 0.3, y: 0.4 },
              ],
            },
          ],
          texts: [],
          scribbles: [],
        },
      },
    };

    const scheduler = createDebouncedMarkupSave(save, MARKUP_AUTOSAVE_DEBOUNCE_MS);
    scheduler.schedule(payload);

    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(MARKUP_AUTOSAVE_DEBOUNCE_MS);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(payload);
  });

  it('flush runs immediately', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const payload: MarkupPayload = { pages: {} };
    const scheduler = createDebouncedMarkupSave(save);

    scheduler.schedule(payload);
    await scheduler.flush();

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(payload);
  });
});
