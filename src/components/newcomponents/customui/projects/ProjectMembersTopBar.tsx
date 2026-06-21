import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Users, Wrench } from 'lucide-react';
import type { ProjectMember, ProjectVisibility } from '@/types/project';
import { projectMemberAvatarColor } from './projectsPageUtils';

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export interface ProjectMembersTopBarProps {
  members: ProjectMember[];
  visibility: ProjectVisibility;
  currentUserId: number | null;
  onManage: () => void;
}

const ProjectMembersTopBar: React.FC<ProjectMembersTopBarProps> = ({
  members,
  visibility,
  currentUserId,
  onManage,
}) => (
  <div className="flex flex-nowrap items-center gap-x-4 border-b border-border bg-muted/20 px-4 py-3">
    <div className="flex shrink-0 items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
      <span className="text-sm font-semibold text-card-foreground">Members</span>
      <Badge variant="outline" className="font-normal shrink-0">
        {members.length}
      </Badge>
      <Badge
        variant="outline"
        className={cn(
          'font-normal shrink-0 text-xs',
          visibility === 'invited_only'
            ? 'border-brand-primary/30 text-brand-primary'
            : 'text-muted-foreground'
        )}
      >
        {visibility === 'invited_only' ? 'Invited only' : 'Everyone'}
      </Badge>
    </div>

    <TooltipProvider delayDuration={150}>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        {members.length === 0 ? (
          <span className="text-xs text-muted-foreground">No members — use Manage to invite</span>
        ) : (
          members.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    projectMemberAvatarColor(member.user_id)
                  )}
                >
                  {initialsOf(member.user_name)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[14rem]">
                <p className="font-medium">
                  {member.user_name ?? `User #${member.user_id}`}
                  {member.user_id === currentUserId ? ' (you)' : ''}
                </p>
                {(member.user_position || member.user_email) && (
                  <p className="text-xs text-muted-foreground">
                    {member.user_position || member.user_email}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))
        )}
      </div>
    </TooltipProvider>

    <Button type="button" size="sm" variant="outline" className="ml-auto h-8 shrink-0" onClick={onManage}>
      <Wrench className="mr-1 h-4 w-4" />
      Manage
    </Button>
  </div>
);

export default ProjectMembersTopBar;
