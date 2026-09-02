import { describe, expect, it } from 'vitest';

import type { AttachmentMarkupEvent } from '@/types/attachment';

import {
  formatMarkupEventTitle,
  formatPagesCompact,
  groupEventsBySession,
  summarizeMarkupSession,
} from './formatMarkupEventDisplay';

function makeEvent(
  overrides: Partial<AttachmentMarkupEvent> & Pick<AttachmentMarkupEvent, 'event_type'>,
): AttachmentMarkupEvent {
  return {
    id: 1,
    user_id: 1,
    user_name: 'Jane Doe',
    is_mine: false,
    session_id: 'session-a',
    description: 'ignored in UI',
    metadata_json: {
      pages: [1],
    },
    created_at: '2026-01-01T12:00:00Z',
    ...overrides,
  };
}

describe('formatPagesCompact', () => {
  it('formats single and consecutive pages', () => {
    expect(formatPagesCompact([1])).toBe('p1');
    expect(formatPagesCompact([1, 2, 3])).toBe('p1–3');
  });

  it('formats non-consecutive pages', () => {
    expect(formatPagesCompact([1, 3])).toBe('p1, p3');
  });
});

describe('formatMarkupEventTitle', () => {
  it('maps event types to short titles', () => {
    expect(formatMarkupEventTitle(makeEvent({ event_type: 'markup_saved' }))).toBe('Saved');
    expect(formatMarkupEventTitle(makeEvent({ event_type: 'markup_updated' }))).toBe('Updated');
    expect(formatMarkupEventTitle(makeEvent({ event_type: 'markup_cleared' }))).toBe('Cleared');
  });
});

describe('summarizeMarkupSession', () => {
  it('summarizes a multi-save session with pages only', () => {
    const summary = summarizeMarkupSession([
      makeEvent({
        id: 2,
        event_type: 'markup_updated',
        created_at: '2026-01-01T12:05:00Z',
        is_mine: true,
        metadata_json: { pages: [1, 2] },
      }),
      makeEvent({
        id: 1,
        event_type: 'markup_saved',
        created_at: '2026-01-01T12:00:00Z',
        is_mine: true,
        metadata_json: { pages: [1] },
      }),
    ]);

    expect(summary.title).toBe('You · Edited');
    expect(summary.subtitle).toBe('p1–2');
    expect(summary.latestAt).toBe('2026-01-01T12:05:00Z');
    expect(summary.iconEventType).toBe('markup_updated');
  });

  it('summarizes a single save session', () => {
    const summary = summarizeMarkupSession([
      makeEvent({
        event_type: 'markup_saved',
        is_mine: true,
      }),
    ]);

    expect(summary.title).toBe('You · Saved');
    expect(summary.subtitle).toBe('p1');
  });

  it('summarizes a cleared session without subtitle', () => {
    const summary = summarizeMarkupSession([
      makeEvent({
        event_type: 'markup_cleared',
        metadata_json: { pages: [] },
      }),
    ]);

    expect(summary.title).toBe('Jane Doe · Cleared');
    expect(summary.subtitle).toBeNull();
    expect(summary.iconEventType).toBe('markup_cleared');
  });
});

describe('groupEventsBySession', () => {
  it('groups consecutive events by session id', () => {
    const groups = groupEventsBySession([
      makeEvent({ id: 1, session_id: 'a', event_type: 'markup_saved' }),
      makeEvent({ id: 2, session_id: 'a', event_type: 'markup_updated' }),
      makeEvent({ id: 3, session_id: 'b', event_type: 'markup_saved' }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].events).toHaveLength(2);
    expect(groups[1].events).toHaveLength(1);
  });
});
