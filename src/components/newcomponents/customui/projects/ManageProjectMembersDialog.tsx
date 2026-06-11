import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Eye, UserPlus, Users, X } from 'lucide-react';
import type { ProjectMember, ProjectVisibility } from '@/types/project';
import type { WorkspaceMember } from '@/types/workspace';

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarColor = (userId: number): string => {
  const colors = [
    'bg-brand-primary',
    'bg-green-600',
    'bg-amber-600',
    'bg-sky-600',
    'bg-rose-600',
    'bg-violet-600',
    'bg-teal-600',
  ];
  return colors[userId % colors.length];
};

export interface ManageProjectMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ProjectMember[];
  visibility: ProjectVisibility;
  assignableMembers: WorkspaceMember[];
  createdByUserId: number | null;
  onVisibilityChange: (visibility: ProjectVisibility) => void;
  onAddMember: (userId: number) => void;
  onRemoveMember: (userId: number) => void;
  disabled?: boolean;
}

const ManageProjectMembersDialog: React.FC<ManageProjectMembersDialogProps> = ({
  open,
  onOpenChange,
  members,
  visibility,
  assignableMembers,
  createdByUserId,
  onVisibilityChange,
  onAddMember,
  onRemoveMember,
  disabled = false,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[min(66vh,32rem)] max-h-[66vh] w-[min(42rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
      <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4">
        <DialogTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-muted-foreground" />
          Manage project members
        </DialogTitle>
        <DialogDescription>
          Control who can see this project and invite workspace members to collaborate.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="project-visibility" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            Who can see this project
          </Label>
          <Select
            value={visibility}
            disabled={disabled}
            onValueChange={(v) => onVisibilityChange(v as ProjectVisibility)}
          >
            <SelectTrigger id="project-visibility" className="h-9 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace">Everyone in workspace</SelectItem>
              <SelectItem value="invited_only">Invited members only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {visibility === 'invited_only' && (
          <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2">
            Only invited members, the project creator, and workspace owners/managers can see this project.
          </p>
        )}

        {assignableMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Select
              value=""
              disabled={disabled}
              onValueChange={(v) => onAddMember(Number(v))}
            >
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Add member..." />
              </SelectTrigger>
              <SelectContent>
                {assignableMembers.map((m) => (
                  <SelectItem key={m.user_id} value={String(m.user_id)}>
                    {m.user_name ?? `User #${m.user_id}`}
                    {m.user_position ? ` · ${m.user_position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Invited members
          </p>
          {members.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No members invited yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                        avatarColor(m.user_id)
                      )}
                    >
                      {initialsOf(m.user_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {m.user_name ?? `User #${m.user_id}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.user_position || m.user_email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {m.user_id === createdByUserId && (
                      <Badge variant="outline" className="text-xs">
                        Creator
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveMember(m.user_id)}
                      disabled={disabled || m.user_id === createdByUserId}
                      title={
                        m.user_id === createdByUserId
                          ? 'Cannot remove project creator'
                          : 'Remove member'
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ManageProjectMembersDialog;
