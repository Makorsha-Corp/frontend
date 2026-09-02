import React, { useMemo } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { memberDisplayName, resolveWorkerTokens } from '@/lib/workOrderWorkers';
import type { WorkspaceMember } from '@/types/workspace';

import {
  COMPACT_WORKER_AVATAR_SIZE,
  MAX_VISIBLE_WORKER_AVATARS,
  WorkerAvatarCircle,
  WorkerAvatarOverflowBadge,
  WorkersTooltipList,
} from './workerAvatarDisplay';

export interface WorkOrderEventWorkerDetail {
  label: string;
  names: string;
  userIds?: number[];
}

function tokensForDetail(
  detail: WorkOrderEventWorkerDetail,
  members: WorkspaceMember[],
) {
  if (detail.names?.trim()) {
    return resolveWorkerTokens(detail.names, members);
  }
  if (detail.userIds?.length) {
    return detail.userIds.map((id) => {
      const member = members.find((m) => m.user_id === id);
      return member
        ? { label: memberDisplayName(member), linkedUserId: id }
        : { label: `User #${id}`, linkedUserId: id };
    });
  }
  return [];
}

interface WorkerEventAvatarsProps {
  detail: WorkOrderEventWorkerDetail;
  members?: WorkspaceMember[];
}

const WorkerEventAvatars: React.FC<WorkerEventAvatarsProps> = ({
  detail,
  members = [],
}) => {
  const tokens = useMemo(
    () => tokensForDetail(detail, members),
    [detail, members],
  );

  if (tokens.length === 0) return null;

  const visible = tokens.slice(0, MAX_VISIBLE_WORKER_AVATARS);
  const overflow = tokens.length - visible.length;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[11px] text-muted-foreground">{detail.label}</span>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex min-w-0 items-center leading-none">
              {visible.map((token, index) => (
                <div key={`${token.label}-${index}`} className={cn(index > 0 && '-ml-1.5')}>
                  <WorkerAvatarCircle token={token} sizeClass={COMPACT_WORKER_AVATAR_SIZE} />
                </div>
              ))}
              {overflow > 0 ? (
                <WorkerAvatarOverflowBadge
                  overflow={overflow}
                  sizeClass={COMPACT_WORKER_AVATAR_SIZE}
                  className="-ml-1.5"
                />
              ) : null}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[16rem] text-xs">
            <WorkersTooltipList tokens={tokens} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default WorkerEventAvatars;
