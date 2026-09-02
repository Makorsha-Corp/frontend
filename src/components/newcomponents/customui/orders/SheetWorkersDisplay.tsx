import React, { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  parseWorkerNames,
  resolveWorkerTokens,
} from '@/lib/workOrderWorkers';
import type { WorkspaceMember } from '@/types/workspace';
import {
  COMPACT_WORKER_AVATAR_SIZE,
  DEFAULT_WORKER_AVATAR_SIZE,
  MAX_VISIBLE_WORKER_AVATARS,
  WorkerAvatarCircle,
  WorkerAvatarOverflowBadge,
  WorkersTooltipList,
} from './workerAvatarDisplay';
import { SHEET_META } from './workOrderSheetTypography';

export interface SheetWorkersDisplayProps {
  workers: string;
  members?: WorkspaceMember[];
  compact?: boolean;
}

function SheetWorkersEmpty() {
  return <span className={cn(SHEET_META, 'italic')}>No workers</span>;
}

const SheetWorkersDisplay: React.FC<SheetWorkersDisplayProps> = ({
  workers,
  members = [],
  compact = true,
}) => {
  const tokens = useMemo(() => {
    if (!workers || workers === '—') return [];
    return resolveWorkerTokens(workers, members);
  }, [workers, members]);

  if (tokens.length === 0) {
    if (workers && workers !== '—' && parseWorkerNames(workers).length > 0) {
      const fallbackTokens = parseWorkerNames(workers).map((label) => ({
        label,
        linkedUserId: null,
      }));
      return (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex min-w-0 items-center leading-none">
                <WorkerAvatarCircle token={fallbackTokens[0]!} sizeClass={COMPACT_WORKER_AVATAR_SIZE} />
                {fallbackTokens.length > 1 ? (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    +{fallbackTokens.length - 1}
                  </span>
                ) : null}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[16rem] text-xs">
              <WorkersTooltipList tokens={fallbackTokens} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return <SheetWorkersEmpty />;
  }

  const visible = tokens.slice(0, MAX_VISIBLE_WORKER_AVATARS);
  const overflow = tokens.length - visible.length;
  const avatarSize = compact ? COMPACT_WORKER_AVATAR_SIZE : DEFAULT_WORKER_AVATAR_SIZE;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex min-w-0 items-center leading-none">
            {visible.map((token, index) => (
              <div key={`${token.label}-${index}`} className={cn(index > 0 && '-ml-1.5')}>
                <WorkerAvatarCircle token={token} sizeClass={avatarSize} />
              </div>
            ))}
            {overflow > 0 ? (
              <WorkerAvatarOverflowBadge overflow={overflow} sizeClass={avatarSize} className="-ml-1.5" />
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[16rem] text-xs">
          <WorkersTooltipList tokens={tokens} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SheetWorkersDisplay;
