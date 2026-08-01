import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, History, Pencil } from 'lucide-react';
import ProjectMembersTopBar from '@/components/newcomponents/customui/projects/ProjectMembersTopBar';
import ProjectEventLogRow from '@/components/newcomponents/customui/projects/ProjectEventLogRow';
import type { Project } from '@/types/project';
import type { ProjectMember } from '@/types/project';
import type { ProjectEvent } from '@/types/project';
import { formatCurrency, formatProjectStatus, getStatusBadge } from '../projectsPageUtils';
import { cn } from '@/lib/utils';

interface ProjectDetailPanelProps {
  selectedProjectId: number | null;
  selectedProject: Project | null;
  projectMembers: ProjectMember[];
  currentUserId: number | null;
  projectEvents: ProjectEvent[];
  componentsCount: number;
  onManageMembers: () => void;
  onEditProject: () => void;
  className?: string;
}

const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({
  selectedProjectId,
  selectedProject,
  projectMembers,
  currentUserId,
  projectEvents,
  componentsCount,
  onManageMembers,
  onEditProject,
  className,
}) => (
  <div className={cn('min-h-0 min-w-0 flex-1', className)}>
    <Card className="flex h-full min-h-0 flex-col border-border">
      {selectedProject ? (
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-6">
          <ProjectMembersTopBar
            members={projectMembers}
            visibility={selectedProject.visibility ?? 'workspace'}
            currentUserId={currentUserId}
            onManage={onManageMembers}
          />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">{selectedProject.name}</h2>
              <span
                className={cn(
                  'mt-2 inline-block rounded px-2 py-1 text-xs',
                  getStatusBadge(selectedProject.status ?? 'PLANNING')
                )}
              >
                {formatProjectStatus(selectedProject.status)}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onEditProject}
              aria-label="Edit project"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          {selectedProject.description ? (
            <p className="mb-4 text-sm text-muted-foreground">{selectedProject.description}</p>
          ) : null}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {selectedProject.budget != null && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="text-base font-medium tabular-nums text-card-foreground">
                  {formatCurrency(selectedProject.budget)}
                </p>
              </div>
            )}
            {selectedProject.deadline && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Deadline</p>
                <p className="text-base font-medium tabular-nums text-card-foreground">
                  {new Date(selectedProject.deadline).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Components</p>
              <p className="text-base font-medium tabular-nums text-card-foreground">{componentsCount}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Select a component from the list to view tasks, items, and costs</span>
            </div>
          </div>
          <Card className="mt-2 flex max-h-[min(32rem,50vh)] flex-col overflow-hidden border-border">
            <CardHeader className="shrink-0 p-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-muted-foreground" />
                Event Log
                <Badge variant="outline" className="ml-1 font-normal">
                  {projectEvents.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
              {projectEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <History className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectEvents.map((event, idx) => (
                    <ProjectEventLogRow
                      key={event.id}
                      event={event}
                      isLast={idx === projectEvents.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Project not found</p>
        </CardContent>
      )}
    </Card>
  </div>
);

export default ProjectDetailPanel;
