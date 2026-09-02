import React from 'react';

import { cn } from '@/lib/utils';
import type { WorkerToken } from '@/lib/workOrderWorkers';

import { initialsOf } from './transferOrderApprovals';

export const MAX_VISIBLE_WORKER_AVATARS = 3;

export const COMPACT_WORKER_AVATAR_SIZE = 'h-6 w-6 text-[10px]';
export const DEFAULT_WORKER_AVATAR_SIZE = 'h-7 w-7 text-[11px]';

export function WorkerAvatarCircle({
  token,
  sizeClass,
  className,
}: {
  token: WorkerToken;
  sizeClass: string;
  className?: string;
}) {
  const linked = token.linkedUserId != null;
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background',
        sizeClass,
        linked ? 'bg-brand-primary text-white' : 'bg-muted-foreground/35 text-white',
        className,
      )}
    >
      {initialsOf(token.label)}
    </div>
  );
}

export function WorkersTooltipList({ tokens }: { tokens: WorkerToken[] }) {
  return (
    <ul className="space-y-1">
      {tokens.map((token, index) => (
        <li key={`${token.label}-${index}`} className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold',
              token.linkedUserId != null
                ? 'bg-brand-primary text-white'
                : 'bg-muted-foreground/35 text-white',
            )}
          >
            {initialsOf(token.label)}
          </span>
          <span className="min-w-0 truncate">{token.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function WorkerAvatarOverflowBadge({
  overflow,
  sizeClass,
  className,
}: {
  overflow: number;
  sizeClass: string;
  className?: string;
}) {
  if (overflow <= 0) return null;
  return (
    <span
      className={cn(
        'relative z-10 flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-2 ring-background',
        sizeClass,
        className,
      )}
    >
      +{overflow}
    </span>
  );
}

export function WorkerAvatarStack({
  tokens,
  sizeClass = COMPACT_WORKER_AVATAR_SIZE,
  maxVisible = MAX_VISIBLE_WORKER_AVATARS,
}: {
  tokens: WorkerToken[];
  sizeClass?: string;
  maxVisible?: number;
}) {
  const visible = tokens.slice(0, maxVisible);
  const overflow = tokens.length - visible.length;

  return (
    <div className="flex min-w-0 items-center leading-none">
      {visible.map((token, index) => (
        <div key={`${token.label}-${index}`} className={cn(index > 0 && '-ml-1.5')}>
          <WorkerAvatarCircle token={token} sizeClass={sizeClass} />
        </div>
      ))}
      {overflow > 0 ? (
        <WorkerAvatarOverflowBadge overflow={overflow} sizeClass={sizeClass} className="-ml-1.5" />
      ) : null}
    </div>
  );
}
