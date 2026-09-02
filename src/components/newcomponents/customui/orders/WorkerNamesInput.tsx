import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Check, User, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WorkspaceMember } from '@/types/workspace';
import { cn } from '@/lib/utils';
import {
  filterMemberSuggestions,
  joinWorkerNames,
  memberDisplayName,
  parseWorkerNames,
  resolveWorkerTextToMembers,
  resolveWorkerTokens,
  type WorkerToken,
} from '@/lib/workOrderWorkers';
import {
  COMPACT_WORKER_AVATAR_SIZE,
  MAX_VISIBLE_WORKER_AVATARS,
  WorkerAvatarCircle,
  WorkerAvatarOverflowBadge,
  WorkersTooltipList,
} from './workerAvatarDisplay';

const TOKEN_SPLIT = /[,;]+/;

export interface WorkerNamesInputProps {
  id?: string;
  label?: React.ReactNode;
  value: string;
  onChange: (value: string, matchedUserIds: number[]) => void;
  onCommit?: (value: string, matchedUserIds: number[]) => void;
  members: WorkspaceMember[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  hideLabel?: boolean;
  /** Where member suggestions open relative to the field (footer forms use top). */
  suggestionsPlacement?: 'top' | 'bottom';
  /** Footer uses overlapping avatars to keep row height fixed. */
  chipDisplay?: 'full' | 'avatars';
}

function FullWorkerChip({
  chip,
  index,
  onRemove,
}: {
  chip: WorkerToken;
  index: number;
  onRemove: (index: number) => void;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
        chip.linkedUserId != null
          ? 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary'
          : 'border-border bg-background text-muted-foreground',
      )}
    >
      {chip.linkedUserId != null ? (
        <Check className="h-3 w-3 shrink-0 text-brand-primary" aria-hidden />
      ) : (
        <User className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      )}
      <span className="truncate">{chip.label}</span>
      <button
        type="button"
        className="rounded-sm opacity-70 hover:opacity-100"
        aria-label={`Remove ${chip.label}`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onRemove(index)}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function AvatarWorkerChips({
  chips,
  onRemove,
}: {
  chips: WorkerToken[];
  onRemove: (index: number) => void;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const visible = chips.slice(0, MAX_VISIBLE_WORKER_AVATARS);
  const hidden = chips.slice(MAX_VISIBLE_WORKER_AVATARS);
  const overflow = hidden.length;

  if (chips.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center leading-none">
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {visible.map((chip, index) => (
                <div
                  key={`${chip.label}-${chip.linkedUserId ?? 'text'}-${index}`}
                  className={cn('group relative', index > 0 && '-ml-1.5')}
                >
                  <WorkerAvatarCircle token={chip} sizeClass={COMPACT_WORKER_AVATAR_SIZE} />
                  <button
                    type="button"
                    aria-label={`Remove ${chip.label}`}
                    className="absolute -right-1 -top-1 z-20 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-background text-foreground shadow ring-1 ring-border group-hover:flex"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onRemove(index)}
                  >
                    <X className="h-2 w-2" />
                  </button>
                </div>
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[16rem] text-xs">
            <WorkersTooltipList tokens={chips} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {overflow > 0 ? (
        <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${overflow} more workers`}
              className={cn('inline-flex shrink-0', overflow > 0 && '-ml-1.5')}
              onMouseDown={(event) => event.preventDefault()}
            >
              <WorkerAvatarOverflowBadge overflow={overflow} sizeClass={COMPACT_WORKER_AVATAR_SIZE} />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="z-[70] w-56 p-2">
            <ul className="space-y-1">
              {hidden.map((chip, hiddenIndex) => {
                const chipIndex = MAX_VISIBLE_WORKER_AVATARS + hiddenIndex;
                return (
                  <li
                    key={`${chip.label}-${chip.linkedUserId ?? 'text'}-${chipIndex}`}
                    className="flex items-center justify-between gap-2 rounded-sm px-1 py-0.5 text-sm hover:bg-muted"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <WorkerAvatarCircle token={chip} sizeClass="h-5 w-5 text-[9px]" />
                      <span className="truncate">{chip.label}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${chip.label}`}
                      className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onRemove(chipIndex);
                        if (hidden.length <= 1) setOverflowOpen(false);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

const WorkerNamesInput: React.FC<WorkerNamesInputProps> = ({
  id,
  label,
  value,
  onChange,
  onCommit,
  members,
  placeholder = 'Type name, pick suggestion, or comma…',
  hint,
  required = false,
  className,
  inputClassName,
  hideLabel = false,
  suggestionsPlacement = 'bottom',
  chipDisplay = 'full',
}) => {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAvatarMode = chipDisplay === 'avatars';

  useEffect(() => {
    setDraft('');
  }, [value]);

  const chips = useMemo(() => resolveWorkerTokens(value, members), [value, members]);

  const linkedMemberIds = useMemo(
    () => new Set(chips.map((chip) => chip.linkedUserId).filter((id): id is number => id != null)),
    [chips],
  );

  const suggestions = useMemo(
    () =>
      filterMemberSuggestions(members, draft).filter(
        (member) => !linkedMemberIds.has(member.user_id),
      ),
    [members, draft, linkedMemberIds],
  );

  const commitValue = (next: string) => {
    const resolution = resolveWorkerTextToMembers(next, members);
    const displayText = resolution.displayText || next.trim();
    onChange(displayText, resolution.matchedUserIds);
    onCommit?.(displayText, resolution.matchedUserIds);
  };

  const commitDraft = (rawDraft: string) => {
    const parts = parseWorkerNames(rawDraft);
    if (!parts.length) return;
    const existing = parseWorkerNames(value);
    commitValue(joinWorkerNames([...existing, ...parts]));
    setDraft('');
  };

  const removeChipAt = (index: number) => {
    const labels = chips.map((chip) => chip.label);
    labels.splice(index, 1);
    commitValue(joinWorkerNames(labels));
  };

  const handleFocus = () => {
    if (blurTimer.current != null) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setOpen(true);
  };

  const handleBlur = () => {
    blurTimer.current = window.setTimeout(() => {
      setOpen(false);
      if (draft.trim()) {
        commitDraft(draft);
      }
    }, 120);
  };

  const handleDraftChange = (next: string) => {
    if (TOKEN_SPLIT.test(next)) {
      const parts = next.split(TOKEN_SPLIT);
      const remainder = (parts.pop() ?? '').trimStart();
      const toCommit = parts.map((part) => part.trim()).filter(Boolean);

      if (toCommit.length) {
        const existing = parseWorkerNames(value);
        commitValue(joinWorkerNames([...existing, ...toCommit]));
      }

      setDraft(remainder);
    } else {
      setDraft(next);
    }

    setOpen(true);
  };

  const handleDraftKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (draft.trim()) {
        commitDraft(draft);
      }
      setOpen(false);
      return;
    }

    if (event.key === 'Backspace' && !draft && chips.length > 0) {
      removeChipAt(chips.length - 1);
    }
  };

  const appendSuggestion = (member: WorkspaceMember) => {
    const existing = parseWorkerNames(value);
    const next = joinWorkerNames([...existing, memberDisplayName(member)]);
    commitValue(next);
    setDraft('');
    setOpen(false);
  };

  return (
    <div className={cn('grid gap-1.5', className)}>
      {!hideLabel && label != null ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
      ) : null}

      <div className="relative">
        <div
          data-suggestions-placement={suggestionsPlacement}
          data-chip-display={chipDisplay}
          className={cn(
            'relative rounded-md border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
            isAvatarMode ? 'h-9 py-0' : 'min-h-9 py-1.5',
          )}
          onMouseDown={(event) => {
            if ((event.target as HTMLElement).closest('button')) return;
            if (event.target !== inputRef.current) {
              event.preventDefault();
              inputRef.current?.focus();
            }
            setOpen(true);
          }}
        >
          <div
            className={cn(
              'flex items-center gap-1',
              isAvatarMode ? 'h-full min-w-0 flex-nowrap overflow-hidden' : 'min-h-6 flex-wrap gap-1.5',
            )}
          >
            {isAvatarMode ? (
              <AvatarWorkerChips chips={chips} onRemove={removeChipAt} />
            ) : (
              chips.map((chip, index) => (
                <FullWorkerChip
                  key={`${chip.label}-${chip.linkedUserId ?? 'text'}-${index}`}
                  chip={chip}
                  index={index}
                  onRemove={removeChipAt}
                />
              ))
            )}

            <Input
              ref={inputRef}
              id={id}
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleDraftKeyDown}
              placeholder={chips.length === 0 ? placeholder : isAvatarMode ? 'Add…' : ''}
              className={cn(
                'flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
                isAvatarMode
                  ? 'h-full min-h-0 min-w-[3rem] shrink text-sm'
                  : 'h-6 min-w-[8rem]',
                inputClassName,
              )}
              autoComplete="off"
            />
          </div>
        </div>

        {open && suggestions.length > 0 ? (
          <div
            className={cn(
              'absolute left-0 right-0 z-[70] max-h-44 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md',
              suggestionsPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
            )}
          >
            {suggestions.map((member) => (
              <button
                key={member.user_id}
                type="button"
                className="flex w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => appendSuggestion(member)}
              >
                {memberDisplayName(member)}
                {member.user_position ? (
                  <span className="ml-1 text-muted-foreground">· {member.user_position}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
};

export default WorkerNamesInput;
