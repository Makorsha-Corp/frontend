import React, { useRef, useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Send, Reply, X, AtSign, Paperclip } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RootState } from '@/app/store';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import AttachmentPreviewDialog from '@/components/newcomponents/customui/AttachmentPreviewDialog';
import { useListAttachmentsQuery } from '@/features/attachments/attachmentsApi';
import { useGetDiscussionsQuery, useCreateDiscussionMutation } from '@/features/discussions/discussionsApi';
import {
  attachmentMentionToken,
  buildAttachmentNameMap,
  discussionEntitySupportsAttachments,
  toMentionKey,
  uniqueAttachmentMentionKey,
} from '@/lib/discussionMentions';
import type { Attachment, AttachmentEntityType } from '@/types/attachment';
import type { Discussion } from '@/types/discussion';
import type { WorkspaceMember } from '@/types/workspace';
import type { DiscussionEntityType } from '@/types/discussion';
import { discussionMessageDomId } from '@/constants/discussion';
import {
  formatAbsoluteFromApi,
  formatDiscussionDayLabelFromApi,
  isSameCalendarDayFromApi,
} from '@/utils/datetime';
import { useDisplayTimezone } from '@/hooks/useDisplayTimezone';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MemberAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <div
      className={cn(
        'rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 select-none',
        size === 'sm' ? 'h-4 w-4' : 'h-7 w-7',
      )}
    >
      <span
        className={cn(
          'font-semibold text-brand-primary',
          size === 'sm' ? 'text-[8px]' : 'text-[11px]',
        )}
      >
        {getInitials(name)}
      </span>
    </div>
  );
}

function truncateDiscussionPreview(message: string, maxLen = 100): string {
  const singleLine = message.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, maxLen)}…`;
}

interface TimelineEntry {
  discussion: Discussion;
  parent?: Discussion;
}

function flattenDiscussionTimeline(roots: Discussion[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const root of roots) {
    entries.push({ discussion: root, parent: undefined });
    for (const reply of root.replies) {
      entries.push({ discussion: reply, parent: root });
    }
  }
  return entries.sort(
    (a, b) =>
      new Date(a.discussion.created_at).getTime() - new Date(b.discussion.created_at).getTime(),
  );
}

function DiscussionDayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3" role="separator" aria-label={label}>
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function DiscussionHoverTimestamp({
  createdAt,
  timeZone,
}: {
  createdAt: string;
  timeZone: string;
}) {
  const label = formatAbsoluteFromApi(createdAt, timeZone);

  return (
    <span
      className="shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity group-hover/message:opacity-100"
      aria-hidden="true"
      title={label}
    >
      {label}
    </span>
  );
}

function DiscussionReplyPreview({
  parent,
  members,
  attachmentNames,
  onOpenAttachment,
  onJumpToParent,
}: {
  parent: Discussion;
  members: WorkspaceMember[];
  attachmentNames: Map<number, string>;
  onOpenAttachment?: (attachmentId: number) => void;
  onJumpToParent: () => void;
}) {
  const authorName = parent.author?.name ?? 'Unknown';

  return (
    <button
      type="button"
      onClick={onJumpToParent}
      aria-label={`Jump to message from ${authorName}`}
      className="relative z-[1] mb-1 flex min-w-0 w-full cursor-pointer items-center gap-1.5 rounded-sm pl-9 text-left hover:bg-muted/50"
    >
      <MemberAvatar name={authorName} size="sm" />
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{authorName}</span>
      <span className="min-w-0 truncate text-xs text-muted-foreground">
        <MentionText
          text={truncateDiscussionPreview(parent.message)}
          members={members}
          attachmentNames={attachmentNames}
          onOpenAttachment={onOpenAttachment}
        />
      </span>
    </button>
  );
}

function MentionText({
  text,
  members,
  attachmentNames,
  onOpenAttachment,
}: {
  text: string;
  members: WorkspaceMember[];
  attachmentNames: Map<number, string>;
  onOpenAttachment?: (attachmentId: number) => void;
}) {
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m.user_name ?? `User ${m.user_id}`])),
    [members]
  );
  const parts = text.split(/(@\[\d+\]|@\[a:\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const userMatch = part.match(/^@\[(\d+)\]$/);
        if (userMatch) {
          const userId = parseInt(userMatch[1], 10);
          const name = memberMap.get(userId) ?? `User ${userId}`;
          return (
            <span key={i} className="font-medium text-blue-500">
              @{name}
            </span>
          );
        }
        const attachmentMatch = part.match(/^@\[a:(\d+)\]$/);
        if (attachmentMatch) {
          const attachmentId = parseInt(attachmentMatch[1], 10);
          const fileName = attachmentNames.get(attachmentId) ?? `attachment-${attachmentId}`;
          if (!onOpenAttachment) {
            return (
              <span key={i} className="font-medium text-blue-500">
                @{fileName}
              </span>
            );
          }
          return (
            <button
              key={i}
              type="button"
              className="font-medium text-blue-500 hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                onOpenAttachment(attachmentId);
              }}
            >
              @{fileName}
            </button>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// ── Message Input ────────────────────────────────────────────────────────────

interface MessageInputProps {
  entityType: DiscussionEntityType;
  entityId: number;
  members: WorkspaceMember[];
  attachments: Attachment[];
  parentId?: number | null;
  replyingToName?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

type MentionSuggestion =
  | { kind: 'user'; member: WorkspaceMember }
  | { kind: 'attachment'; attachment: Attachment };

const MAX_MENTION_SUGGESTIONS = 6;
/** Match Button size="icon" (h-10) for single-line composer height */
const MESSAGE_INPUT_MIN_HEIGHT_PX = 40;
const MESSAGE_INPUT_MAX_HEIGHT_PX = 160;

function MessageInput({
  entityType,
  entityId,
  members,
  attachments,
  parentId,
  replyingToName,
  autoFocus,
  onCancel,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionAnchorPos, setMentionAnchorPos] = useState<number | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0);
  // key → userId  (e.g. "John_Doe" → 2)
  const [mentionMap, setMentionMap] = useState<Map<string, number>>(new Map());
  const [attachmentMentionMap, setAttachmentMentionMap] = useState<Map<string, number>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const [createDiscussion, { isLoading }] = useCreateDiscussionMutation();

  const syncTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(
      Math.max(el.scrollHeight, MESSAGE_INPUT_MIN_HEIGHT_PX),
      MESSAGE_INPUT_MAX_HEIGHT_PX,
    );
    el.style.height = `${next}px`;
  }, []);

  useLayoutEffect(() => {
    syncTextareaHeight();
  }, [message, syncTextareaHeight]);

  const filteredMembers = useMemo(
    () =>
      members.filter((m) =>
        mentionSearch
          ? (m.user_name ?? '').toLowerCase().includes(mentionSearch.toLowerCase())
          : true
      ),
    [members, mentionSearch]
  );

  const filteredAttachments = useMemo(
    () =>
      attachments.filter((attachment) =>
        mentionSearch
          ? attachment.file_name.toLowerCase().includes(mentionSearch.toLowerCase())
          : true
      ),
    [attachments, mentionSearch]
  );

  const mentionSuggestions = useMemo((): MentionSuggestion[] => {
    const suggestions: MentionSuggestion[] = filteredMembers.map((member) => ({
      kind: 'user',
      member,
    }));
    for (const attachment of filteredAttachments) {
      suggestions.push({ kind: 'attachment', attachment });
    }
    return suggestions.slice(0, MAX_MENTION_SUGGESTIONS);
  }, [filteredAttachments, filteredMembers]);

  useEffect(() => {
    setHighlightedMentionIndex(0);
  }, [mentionSearch, showMentionPicker, mentionSuggestions.length]);

  const isMentionHighlighted = (key: string) =>
    mentionMap.has(key) || attachmentMentionMap.has(key);

  // Before submitting: replace @Key with @[userId] / @[a:id] tokens
  const resolveMessage = (text: string) =>
    text.replace(/@([^\s@]+)/g, (match, key) => {
      const uid = mentionMap.get(key);
      if (uid !== undefined) return `@[${uid}]`;
      const attachmentId = attachmentMentionMap.get(key);
      if (attachmentId !== undefined) return attachmentMentionToken(attachmentId);
      return match;
    });

  // Build HTML for the mirror div — normal text is transparent so the textarea
  // text shows instead, but mention keys get a blue highlight background.
  const buildMirrorHTML = (text: string) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlighted = escaped.replace(/@([^\s@]+)/g, (_, key) =>
      isMentionHighlighted(key)
        ? `<mark style="background:rgba(59,130,246,0.18);border-radius:3px;padding:0 2px;color:inherit;">@${key}</mark>`
        : `@${key}`
    );
    return highlighted + '\n'; // trailing newline prevents height collapse
  };

  const syncScroll = () => {
    if (mirrorRef.current && textareaRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    syncScroll();
    requestAnimationFrame(syncTextareaHeight);
    const cursor = e.target.selectionStart ?? val.length;
    const atMatch = val.slice(0, cursor).match(/@([^\s@]*)$/);
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setMentionAnchorPos(cursor - atMatch[0].length);
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
      setMentionAnchorPos(null);
    }
  };

  const insertMention = (key: string) => {
    const cursor = textareaRef.current?.selectionStart ?? message.length;
    const before = message.slice(0, mentionAnchorPos ?? cursor);
    const after = message.slice(cursor);
    setMessage(`${before}@${key} ${after}`);
    setShowMentionPicker(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const selectMemberMention = (member: WorkspaceMember) => {
    const key = toMentionKey(member.user_name ?? `User_${member.user_id}`);
    insertMention(key);
    setMentionMap((prev) => new Map(prev).set(key, member.user_id));
  };

  const selectAttachmentMention = (attachment: Attachment) => {
    const key = uniqueAttachmentMentionKey(
      attachment.file_name,
      attachment.id,
      attachmentMentionMap,
    );
    insertMention(key);
    setAttachmentMentionMap((prev) => new Map(prev).set(key, attachment.id));
  };

  const selectMentionSuggestion = (suggestion: MentionSuggestion) => {
    if (suggestion.kind === 'user') {
      selectMemberMention(suggestion.member);
      return;
    }
    selectAttachmentMention(suggestion.attachment);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedMentionIndex((i) => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedMentionIndex(
          (i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length
        );
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectMentionSuggestion(mentionSuggestions[highlightedMentionIndex]);
        return;
      }
    }

    if (e.key === 'Escape') {
      setShowMentionPicker(false);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !showMentionPicker) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;
    try {
      await createDiscussion({
        entity_type: entityType,
        entity_id: entityId,
        message: resolveMessage(trimmed),
        parent_id: parentId ?? null,
      }).unwrap();
      setMessage('');
      setMentionMap(new Map());
      setAttachmentMentionMap(new Map());
      requestAnimationFrame(syncTextareaHeight);
      onCancel?.();
    } catch (err) {
      console.error('[DiscussionThread] send failed:', err);
    }
  };

  const placeholder = parentId
    ? 'Write a reply… (Enter to send)'
    : 'Write a message… type @ to mention someone or an attachment';

  return (
    <div className="relative flex flex-col gap-1.5">
      {replyingToName && (
        <div className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
          <span>
            Replying to{' '}
            <span className="font-medium text-foreground">{replyingToName}</span>
          </span>
          <button type="button" onClick={onCancel} className="hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {showMentionPicker && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 z-20 w-72 rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {mentionSuggestions.map((suggestion, index) => (
            <button
              key={
                suggestion.kind === 'user'
                  ? `user-${suggestion.member.user_id}`
                  : `attachment-${suggestion.attachment.id}`
              }
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                index === highlightedMentionIndex ? 'bg-muted' : 'hover:bg-muted/70'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectMentionSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedMentionIndex(index)}
            >
              {suggestion.kind === 'user' ? (
                <>
                  <MemberAvatar name={suggestion.member.user_name ?? 'U'} />
                  <span className="truncate">{suggestion.member.user_name}</span>
                </>
              ) : (
                <>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="min-w-0 truncate">{suggestion.attachment.file_name}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/*
          Container provides the visual border/background.
          Inside: a mirror div (for highlight marks) sits behind a transparent textarea.
          The user reads text from the mirror; the textarea captures input + shows caret.
        */}
        <div className="relative flex-1 min-h-10 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background overflow-hidden">
          {/* Mirror — same text as textarea but with mention highlights */}
          <div
            ref={mirrorRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden px-3 py-2 text-sm text-foreground"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              lineHeight: '1.5',
            }}
            dangerouslySetInnerHTML={{ __html: buildMirrorHTML(message) }}
          />
          {/* Transparent textarea on top — text is invisible so mirror shows through */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            autoFocus={autoFocus}
            rows={1}
            placeholder={placeholder}
            className="relative block w-full resize-none overflow-y-auto bg-transparent px-3 py-2 text-sm leading-normal placeholder:text-muted-foreground focus:outline-none"
            style={{
              color: message ? 'transparent' : undefined,
              caretColor: 'var(--foreground, currentColor)',
              minHeight: MESSAGE_INPUT_MIN_HEIGHT_PX,
              maxHeight: MESSAGE_INPUT_MAX_HEIGHT_PX,
              height: MESSAGE_INPUT_MIN_HEIGHT_PX,
            }}
          />
        </div>
        <Button
          type="button"
          size="icon"
          disabled={!message.trim() || isLoading}
          onClick={handleSend}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Single Message ───────────────────────────────────────────────────────────

function sameDiscussionAuthor(a: Discussion, b: Discussion) {
  const aId = a.author?.id;
  const bId = b.author?.id;
  return aId != null && bId != null && aId === bId;
}

function DiscussionMessageRow({
  message,
  members,
  attachmentNames,
  onOpenAttachment,
  createdAt,
  timeZone,
  enableReplyPopover,
  replyCount,
  onReply,
  showReplyComposer,
  showTimestamp = true,
}: {
  message: string;
  members: WorkspaceMember[];
  attachmentNames: Map<number, string>;
  onOpenAttachment?: (attachmentId: number) => void;
  createdAt: string;
  timeZone: string;
  enableReplyPopover: boolean;
  replyCount: number;
  onReply: () => void;
  showReplyComposer: boolean;
  showTimestamp?: boolean;
}) {
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showReplyComposer) {
      setPopoverPos(null);
    }
  }, [showReplyComposer]);

  useEffect(() => {
    if (!popoverPos) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target) || textRef.current?.contains(target)) {
        return;
      }
      setPopoverPos(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [popoverPos]);

  const handleTextClick = (e: React.MouseEvent) => {
    if (!enableReplyPopover || showReplyComposer) return;
    setPopoverPos((prev) => {
      if (prev) return null;
      return { x: e.clientX, y: e.clientY };
    });
  };

  const replyLabel =
    replyCount > 0
      ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
      : 'Reply';

  return (
    <>
      <div className="group/message flex items-baseline gap-2">
        <div
          ref={textRef}
          onClick={enableReplyPopover ? handleTextClick : undefined}
          className={cn(
            'm-0 flex-1 min-w-0 text-sm leading-snug text-foreground/90 whitespace-pre-wrap break-words',
            enableReplyPopover && 'cursor-pointer',
          )}
        >
          <MentionText
            text={message}
            members={members}
            attachmentNames={attachmentNames}
            onOpenAttachment={onOpenAttachment}
          />
        </div>
        {showTimestamp ? (
          <div className="shrink-0 self-baseline leading-none">
            <DiscussionHoverTimestamp createdAt={createdAt} timeZone={timeZone} />
          </div>
        ) : null}
      </div>

      {enableReplyPopover && popoverPos && !showReplyComposer
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-50 rounded-md border border-border bg-popover p-1 shadow-md"
              style={{ left: popoverPos.x + 8, top: popoverPos.y - 36 }}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={() => {
                  setPopoverPos(null);
                  onReply();
                }}
              >
                <Reply className="h-3.5 w-3.5" />
                {replyLabel}
              </Button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function DiscussionItem({
  discussion,
  members,
  attachments,
  attachmentNames,
  onOpenAttachment,
  entityType,
  entityId,
  timeZone,
  readOnly = false,
  isGroupedWithPrevious = false,
  parentDiscussion,
  onScrollToMessage,
}: {
  discussion: Discussion;
  members: WorkspaceMember[];
  attachments: Attachment[];
  attachmentNames: Map<number, string>;
  onOpenAttachment: (attachmentId: number) => void;
  entityType: DiscussionEntityType;
  entityId: number;
  timeZone: string;
  readOnly?: boolean;
  isGroupedWithPrevious?: boolean;
  parentDiscussion?: Discussion;
  onScrollToMessage: (messageId: number) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const authorName = discussion.author?.name ?? 'Unknown';
  const isReply = parentDiscussion != null;
  const isRoot = !discussion.parent_id;

  return (
    <div>
      {isReply ? (
        <div className="group/message relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[0.8125rem] top-2 z-0 h-3 w-[1.4375rem] rounded-tl-sm border-l-2 border-t-2 border-muted-foreground/40"
          />
          <DiscussionReplyPreview
            parent={parentDiscussion}
            members={members}
            attachmentNames={attachmentNames}
            onOpenAttachment={onOpenAttachment}
            onJumpToParent={() => onScrollToMessage(parentDiscussion.id)}
          />
          <div className="relative z-[1] flex items-baseline gap-2.5">
            <MemberAvatar name={authorName} />
            <span className="text-sm font-medium leading-none">{authorName}</span>
          </div>
          <div className="relative z-[1] mt-0.5 pl-9">
            <DiscussionMessageRow
              message={discussion.message}
              members={members}
              attachmentNames={attachmentNames}
              onOpenAttachment={onOpenAttachment}
              createdAt={discussion.created_at}
              timeZone={timeZone}
              enableReplyPopover={false}
              replyCount={0}
              onReply={() => setShowReply(true)}
              showReplyComposer={showReply}
              showTimestamp
            />
          </div>
        </div>
      ) : (
        <>
          {!isGroupedWithPrevious ? (
            <div className="flex items-center gap-2.5">
              <MemberAvatar name={authorName} />
              <span className="text-sm font-medium leading-none">{authorName}</span>
            </div>
          ) : null}
          <div className={cn('pl-9', isGroupedWithPrevious ? 'mt-1' : 'mt-0.5')}>
            <DiscussionMessageRow
              message={discussion.message}
              members={members}
              attachmentNames={attachmentNames}
              onOpenAttachment={onOpenAttachment}
              createdAt={discussion.created_at}
              timeZone={timeZone}
              enableReplyPopover={isRoot && !readOnly}
              replyCount={discussion.replies.length}
              onReply={() => setShowReply(true)}
              showReplyComposer={showReply}
            />
          </div>
        </>
      )}

      {showReply && isRoot && !readOnly ? (
        <div className="mt-1 pl-9">
          <MessageInput
            entityType={entityType}
            entityId={entityId}
            members={members}
            attachments={attachments}
            parentId={discussion.id}
            replyingToName={authorName}
            autoFocus
            onCancel={() => setShowReply(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

// ── Thread (exported) ────────────────────────────────────────────────────────

interface DiscussionThreadProps {
  entityType: DiscussionEntityType;
  entityId: number;
  readOnly?: boolean;
  /** Stretch card to fill parent row height with internal scroll. */
  fillHeight?: boolean;
  /** Fixed-height message area for order collaboration row. */
  compactBody?: boolean;
  /** Tailwind height class for compact card body (default h-[17.0625rem]). */
  compactBodyHeightClass?: string;
  /** Tailwind min-height class for compact scroll area (default min-h-[11.05rem]). */
  compactBodyMinHeightClass?: string;
  /** Inside collaboration tab card — omit outer card + section title. */
  embeddedInTabs?: boolean;
  className?: string;
}

export default function DiscussionThread({
  entityType,
  entityId,
  readOnly = false,
  fillHeight = false,
  compactBody = false,
  compactBodyHeightClass = 'h-[17.0625rem]',
  compactBodyMinHeightClass = 'min-h-[11.05rem]',
  embeddedInTabs = false,
  className,
}: DiscussionThreadProps) {
  const [highlightedMessageId, setHighlightedMessageId] = useState<number | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const hasInitialScrollRef = useRef(false);
  const prevTimelineLengthRef = useRef(0);
  const workspace = useSelector((state: RootState) => state.auth.workspace);
  const timeZone = useDisplayTimezone();

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    hasInitialScrollRef.current = false;
    prevTimelineLengthRef.current = 0;
  }, [entityId, entityType]);

  const scrollToDiscussionMessage = useCallback((messageId: number) => {
    const el = document.getElementById(discussionMessageDomId(messageId));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMessageId(messageId);
    window.setTimeout(() => setHighlightedMessageId(null), 1500);
  }, []);

  const { data, isLoading } = useGetDiscussionsQuery(
    { entity_type: entityType, entity_id: entityId },
    { skip: !entityId }
  );

  const { data: membersData } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });

  const attachmentEntityType = discussionEntitySupportsAttachments(entityType)
    ? (entityType as AttachmentEntityType)
    : null;

  const { data: attachmentsData } = useListAttachmentsQuery(
    {
      entity_type: attachmentEntityType ?? 'support_ticket',
      entity_id: entityId,
    },
    { skip: !entityId || attachmentEntityType == null },
  );

  const members = membersData ?? [];
  const attachments = attachmentsData?.items ?? [];
  const attachmentNames = useMemo(() => buildAttachmentNameMap(attachments), [attachments]);

  const openAttachmentPreview = useCallback(
    (attachmentId: number) => {
      const attachment = attachments.find((item) => item.id === attachmentId);
      if (attachment) {
        setPreviewAttachment(attachment);
      }
    },
    [attachments],
  );
  const discussions = data?.items ?? [];
  const total = data?.total ?? 0;

  useLayoutEffect(() => {
    if (isLoading) return;

    const timelineLength = flattenDiscussionTimeline(discussions).length;
    if (timelineLength === 0) return;

    if (!hasInitialScrollRef.current) {
      scrollMessagesToBottom('auto');
      requestAnimationFrame(() => scrollMessagesToBottom('auto'));
      hasInitialScrollRef.current = true;
      prevTimelineLengthRef.current = timelineLength;
      return;
    }

    if (timelineLength > prevTimelineLengthRef.current) {
      scrollMessagesToBottom('smooth');
    }
    prevTimelineLengthRef.current = timelineLength;
  }, [discussions, isLoading, scrollMessagesToBottom]);

  const renderMessageArea = () => {
    if (isLoading) {
      return (
        <div
          className={cn(
            'flex items-center justify-center text-sm text-muted-foreground',
            compactBody ? cn('h-full', compactBodyMinHeightClass) : 'py-8',
          )}
        >
          Loading…
        </div>
      );
    }

    if (discussions.length === 0) {
      return (
        <div
          className={cn(
            'rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 px-4 py-8 text-center',
            compactBody ? cn('h-full', compactBodyMinHeightClass) : null,
          )}
        >
          <AtSign className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground">
            {readOnly
              ? 'No discussion messages on this voided order.'
              : 'Start the conversation — type @ to mention someone or an attachment'}
          </p>
        </div>
      );
    }

    const timeline = flattenDiscussionTimeline(discussions);

    return (
      <div className="flex flex-col">
        {timeline.map((entry, index) => {
          const prev = index > 0 ? timeline[index - 1] : null;
          const isReply = entry.discussion.parent_id != null;
          const isGroupedWithPrevious =
            index > 0 &&
            !isReply &&
            prev != null &&
            !prev.discussion.parent_id &&
            sameDiscussionAuthor(prev.discussion, entry.discussion) &&
            isSameCalendarDayFromApi(
              prev.discussion.created_at,
              entry.discussion.created_at,
              timeZone
            );

          const spacingClass = cn(
            index > 0 &&
              (isReply ? 'mt-2.5' : isGroupedWithPrevious ? 'mt-1' : 'mt-4'),
          );

          const showDayDivider =
            index === 0 ||
            (prev != null &&
              !isSameCalendarDayFromApi(
                prev.discussion.created_at,
                entry.discussion.created_at,
                timeZone
              ));

          return (
            <React.Fragment key={entry.discussion.id}>
              {showDayDivider ? (
                <DiscussionDayDivider
                  label={formatDiscussionDayLabelFromApi(entry.discussion.created_at, timeZone)}
                />
              ) : null}
              <div
                id={discussionMessageDomId(entry.discussion.id)}
                className={cn(
                  spacingClass,
                  highlightedMessageId === entry.discussion.id &&
                    'rounded-md bg-brand-primary/10 ring-1 ring-brand-primary/25 transition-colors',
                )}
              >
                <DiscussionItem
                  discussion={entry.discussion}
                  parentDiscussion={entry.parent}
                  members={members}
                  attachments={attachments}
                  attachmentNames={attachmentNames}
                  onOpenAttachment={openAttachmentPreview}
                  entityType={entityType}
                  entityId={entityId}
                  timeZone={timeZone}
                  readOnly={readOnly}
                  isGroupedWithPrevious={isGroupedWithPrevious}
                  onScrollToMessage={scrollToDiscussionMessage}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const threadBody = (
    <>
      {readOnly ? (
        <p className="shrink-0 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          This order is voided — discussion is read-only.
        </p>
      ) : null}

      {compactBody ? (
        <div
          ref={messagesScrollRef}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto pr-2.5',
            compactBodyMinHeightClass,
          )}
        >
          {renderMessageArea()}
        </div>
      ) : isLoading ? (
        renderMessageArea()
      ) : discussions.length === 0 ? (
        renderMessageArea()
      ) : (
        <div
          ref={messagesScrollRef}
          className={cn(
            'flex flex-col gap-4 overflow-y-auto pr-2.5',
            fillHeight ? 'min-h-0 flex-1' : embeddedInTabs ? 'max-h-[min(20rem,40vh)]' : 'max-h-80',
          )}
        >
          {renderMessageArea()}
        </div>
      )}

      {!readOnly ? (
        <div className="shrink-0">
          <MessageInput
            entityType={entityType}
            entityId={entityId}
            members={members}
            attachments={attachments}
          />
        </div>
      ) : null}

      <AttachmentPreviewDialog
        attachment={previewAttachment}
        open={previewAttachment != null}
        onOpenChange={(open) => {
          if (!open) setPreviewAttachment(null);
        }}
      />
    </>
  );

  if (embeddedInTabs) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {threadBody}
      </div>
    );
  }

  return (
    <Card className={cn((fillHeight || compactBody) && 'flex h-full min-h-0 flex-col', className)}>
      <CardHeader className="p-4 pb-3 shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Discussion
          {total > 0 && (
            <Badge variant="outline" className="ml-1 font-normal">
              {total}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'flex flex-col gap-4 p-4 pt-0',
          fillHeight && 'min-h-0 flex-1 overflow-hidden',
          compactBody && cn(compactBodyHeightClass, 'min-h-0 shrink-0 overflow-hidden'),
        )}
      >
        {threadBody}
      </CardContent>
    </Card>
  );
}
