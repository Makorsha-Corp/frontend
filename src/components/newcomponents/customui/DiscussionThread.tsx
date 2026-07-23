import React, { useRef, useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import { MessageSquare, Send, Reply, X, AtSign } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RootState } from '@/app/store';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useGetDiscussionsQuery, useCreateDiscussionMutation } from '@/features/discussions/discussionsApi';
import type { Discussion } from '@/types/discussion';
import type { WorkspaceMember } from '@/types/workspace';
import { DISCUSSION_URL_HASH, ORDER_DISCUSSION_SECTION_ID } from '@/constants/discussion';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <div className="h-7 w-7 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 select-none">
      <span className="text-[11px] font-semibold text-brand-primary">{getInitials(name)}</span>
    </div>
  );
}

function MentionText({ text, members }: { text: string; members: WorkspaceMember[] }) {
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.user_id, m.user_name ?? `User ${m.user_id}`])),
    [members]
  );
  const parts = text.split(/(@\[\d+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^@\[(\d+)\]$/);
        if (match) {
          const name = memberMap.get(parseInt(match[1])) ?? `User ${match[1]}`;
          return (
            <span key={i} className="text-blue-500 font-medium">
              @{name}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// ── Message Input ────────────────────────────────────────────────────────────

interface MessageInputProps {
  entityType: string;
  entityId: number;
  members: WorkspaceMember[];
  parentId?: number | null;
  replyingToName?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}

// Convert "John Doe" → "John_Doe" so mentions are single tokens in the textarea
function toMentionKey(name: string) {
  return name.trim().replace(/\s+/g, '_');
}

const MAX_MENTION_SUGGESTIONS = 6;
/** Match Button size="icon" (h-10) for single-line composer height */
const MESSAGE_INPUT_MIN_HEIGHT_PX = 40;
const MESSAGE_INPUT_MAX_HEIGHT_PX = 160;

function MessageInput({
  entityType,
  entityId,
  members,
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

  const visibleMembers = useMemo(
    () => filteredMembers.slice(0, MAX_MENTION_SUGGESTIONS),
    [filteredMembers]
  );

  useEffect(() => {
    setHighlightedMentionIndex(0);
  }, [mentionSearch, showMentionPicker, visibleMembers.length]);

  // Before submitting: replace @Key with @[userId] tokens the backend understands
  const resolveMessage = (text: string) =>
    text.replace(/@(\S+)/g, (match, key) => {
      const uid = mentionMap.get(key);
      return uid !== undefined ? `@[${uid}]` : match;
    });

  // Build HTML for the mirror div — normal text is transparent so the textarea
  // text shows instead, but mention keys get a blue highlight background.
  const buildMirrorHTML = (text: string) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const highlighted = escaped.replace(/@(\S+)/g, (_, key) =>
      mentionMap.has(key)
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
    const atMatch = val.slice(0, cursor).match(/@(\w*)$/);
    if (atMatch) {
      setMentionSearch(atMatch[1]);
      setMentionAnchorPos(cursor - atMatch[0].length);
      setShowMentionPicker(true);
    } else {
      setShowMentionPicker(false);
      setMentionAnchorPos(null);
    }
  };

  const selectMention = (member: WorkspaceMember) => {
    const cursor = textareaRef.current?.selectionStart ?? message.length;
    const before = message.slice(0, mentionAnchorPos ?? cursor);
    const after = message.slice(cursor);
    const key = toMentionKey(member.user_name ?? `User_${member.user_id}`);
    setMessage(`${before}@${key} ${after}`);
    setMentionMap((prev) => new Map(prev).set(key, member.user_id));
    setShowMentionPicker(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPicker && visibleMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedMentionIndex((i) => (i + 1) % visibleMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedMentionIndex(
          (i) => (i - 1 + visibleMembers.length) % visibleMembers.length
        );
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectMention(visibleMembers[highlightedMentionIndex]);
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
        entity_type: entityType as any,
        entity_id: entityId,
        message: resolveMessage(trimmed),
        parent_id: parentId ?? null,
      }).unwrap();
      setMessage('');
      setMentionMap(new Map());
      requestAnimationFrame(syncTextareaHeight);
      onCancel?.();
    } catch (err) {
      console.error('[DiscussionThread] send failed:', err);
    }
  };

  const placeholder = parentId
    ? 'Write a reply… (Enter to send)'
    : 'Write a message… type @ to mention someone';

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

      {showMentionPicker && visibleMembers.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 z-20 w-56 rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {visibleMembers.map((m, index) => (
            <button
              key={m.user_id}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                index === highlightedMentionIndex ? 'bg-muted' : 'hover:bg-muted/70'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectMention(m);
              }}
              onMouseEnter={() => setHighlightedMentionIndex(index)}
            >
              <MemberAvatar name={m.user_name ?? 'U'} />
              <span className="truncate">{m.user_name}</span>
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

function DiscussionItem({
  discussion,
  members,
  entityType,
  entityId,
  depth = 0,
}: {
  discussion: Discussion;
  members: WorkspaceMember[];
  entityType: string;
  entityId: number;
  depth?: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const authorName = discussion.author?.name ?? 'Unknown';

  return (
    <div className={cn('flex flex-col gap-1.5', depth > 0 && 'ml-9 mt-1.5')}>
      <div className="flex gap-2.5">
        <MemberAvatar name={authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-sm font-medium">{authorName}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(parseISO(discussion.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
            <MentionText text={discussion.message} members={members} />
          </p>
          {depth === 0 && (
            <button
              type="button"
              className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowReply((v) => !v)}
            >
              <Reply className="h-3 w-3" />
              {discussion.replies.length > 0
                ? `${discussion.replies.length} ${discussion.replies.length === 1 ? 'reply' : 'replies'}`
                : 'Reply'}
            </button>
          )}
        </div>
      </div>

      {discussion.replies.map((reply) => (
        <DiscussionItem
          key={reply.id}
          discussion={reply}
          members={members}
          entityType={entityType}
          entityId={entityId}
          depth={1}
        />
      ))}

      {showReply && depth === 0 && (
        <div className="ml-9 mt-1">
          <MessageInput
            entityType={entityType}
            entityId={entityId}
            members={members}
            parentId={discussion.id}
            replyingToName={authorName}
            autoFocus
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Thread (exported) ────────────────────────────────────────────────────────

interface DiscussionThreadProps {
  entityType: string;
  entityId: number;
}

export default function DiscussionThread({ entityType, entityId }: DiscussionThreadProps) {
  const workspace = useSelector((state: RootState) => state.auth.workspace);

  const { data, isLoading } = useGetDiscussionsQuery(
    { entity_type: entityType, entity_id: entityId },
    { skip: !entityId }
  );

  const { data: membersData } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });

  const members = membersData ?? [];
  const discussions = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (window.location.hash !== `#${DISCUSSION_URL_HASH}`) return;

    const scrollToDiscussion = () => {
      document.getElementById(ORDER_DISCUSSION_SECTION_ID)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    const timeoutId = window.setTimeout(scrollToDiscussion, 150);
    return () => window.clearTimeout(timeoutId);
  }, [entityId, entityType, isLoading]);

  return (
    <Card id={ORDER_DISCUSSION_SECTION_ID}>
      <CardHeader className="pb-3 shrink-0">
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
      <CardContent className="flex flex-col gap-4 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : discussions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
            <AtSign className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground">Start the conversation — type @ to mention someone</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-1 -mr-1">
            {discussions.map((d) => (
              <DiscussionItem
                key={d.id}
                discussion={d}
                members={members}
                entityType={entityType}
                entityId={entityId}
              />
            ))}
          </div>
        )}

        <MessageInput
          entityType={entityType}
          entityId={entityId}
          members={members}
        />
      </CardContent>
    </Card>
  );
}
