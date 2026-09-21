import type { Attachment } from '@/types/attachment';

export const USER_MENTION_TOKEN_RE = /@\[(\d+)\]/g;
export const ATTACHMENT_MENTION_TOKEN_RE = /@\[a:(\d+)\]/g;

export function toMentionKey(name: string): string {
  return name.trim().replace(/\s+/g, '_');
}

export function attachmentMentionToken(attachmentId: number): string {
  return `@[a:${attachmentId}]`;
}

export function uniqueAttachmentMentionKey(
  fileName: string,
  attachmentId: number,
  existing: Map<string, number>,
): string {
  const base = toMentionKey(fileName);
  if (!existing.has(base) || existing.get(base) === attachmentId) {
    return base;
  }
  return `${base}_${attachmentId}`;
}

export function buildAttachmentNameMap(attachments: Attachment[]): Map<number, string> {
  return new Map(attachments.map((attachment) => [attachment.id, attachment.file_name]));
}

export function discussionEntitySupportsAttachments(entityType: string): boolean {
  return entityType !== 'inventory';
}
