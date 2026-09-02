import type { AttachmentMarkupEvent } from '@/types/attachment';

export interface MarkupSessionSummary {
  title: string;
  subtitle: string | null;
  latestAt: string;
  iconEventType: string;
}

function normalizePages(pages: Array<number | string>): Array<number | string> {
  return [...pages].sort((left, right) => {
    if (typeof left === 'number' && typeof right === 'number') {
      return left - right;
    }
    return String(left).localeCompare(String(right));
  });
}

export function formatPagesCompact(pages: Array<number | string>): string | null {
  if (pages.length === 0) return null;

  const sorted = normalizePages(pages);
  const numeric = sorted.filter((page): page is number => typeof page === 'number');

  if (numeric.length === sorted.length && numeric.length > 1) {
    const isConsecutive = numeric.every(
      (page, index) => index === 0 || page === numeric[index - 1] + 1,
    );
    if (isConsecutive) {
      return numeric.length === 1 ? `p${numeric[0]}` : `p${numeric[0]}–${numeric[numeric.length - 1]}`;
    }
  }

  return sorted.map((page) => `p${page}`).join(', ');
}

export function formatMarkupActorLabel(event: AttachmentMarkupEvent): string {
  return event.is_mine ? 'You' : event.user_name;
}

export function formatMarkupEventTitle(event: AttachmentMarkupEvent): string {
  switch (event.event_type) {
    case 'markup_saved':
      return 'Saved';
    case 'markup_updated':
      return 'Updated';
    case 'markup_cleared':
      return 'Cleared';
    default:
      return 'Edited';
  }
}

function sessionVerb(events: AttachmentMarkupEvent[]): string {
  const saveEvents = events.filter((event) => event.event_type !== 'markup_cleared');
  const hasClear = events.some((event) => event.event_type === 'markup_cleared');

  if (events.length > 0 && events.every((event) => event.event_type === 'markup_cleared')) {
    return 'Cleared';
  }
  if (saveEvents.length === 1 && saveEvents[0].event_type === 'markup_saved' && !hasClear) {
    return 'Saved';
  }
  return 'Edited';
}

function collectSessionPages(events: AttachmentMarkupEvent[]): Array<number | string> {
  const pageSet = new Set<number | string>();
  for (const event of events) {
    const pages = event.metadata_json?.pages;
    if (!Array.isArray(pages)) continue;
    for (const page of pages) {
      pageSet.add(page);
    }
  }
  return normalizePages([...pageSet]);
}

function sessionIconEventType(events: AttachmentMarkupEvent[]): string {
  const latest = events[0];
  if (!latest) return 'default';
  if (latest.event_type === 'markup_cleared') return 'markup_cleared';
  const verb = sessionVerb(events);
  if (verb === 'Saved') return 'markup_saved';
  if (verb === 'Cleared') return 'markup_cleared';
  return 'markup_updated';
}

export function summarizeMarkupSession(events: AttachmentMarkupEvent[]): MarkupSessionSummary {
  const actor = events[0] ? formatMarkupActorLabel(events[0]) : 'Someone';
  const verb = sessionVerb(events);
  const subtitle =
    verb === 'Cleared' ? null : formatPagesCompact(collectSessionPages(events));

  return {
    title: `${actor} · ${verb}`,
    subtitle,
    latestAt: events[0]?.created_at ?? new Date(0).toISOString(),
    iconEventType: sessionIconEventType(events),
  };
}

export type MarkupSessionGroup = {
  sessionId: string | null;
  events: AttachmentMarkupEvent[];
};

export function groupEventsBySession(events: AttachmentMarkupEvent[]): MarkupSessionGroup[] {
  const groups: MarkupSessionGroup[] = [];
  for (const event of events) {
    const last = groups[groups.length - 1];
    if (last && last.sessionId === event.session_id) {
      last.events.push(event);
      continue;
    }
    groups.push({
      sessionId: event.session_id,
      events: [event],
    });
  }
  return groups;
}
