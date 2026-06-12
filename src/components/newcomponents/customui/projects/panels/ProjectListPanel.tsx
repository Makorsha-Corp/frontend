import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Loader2, Trash2, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/project';
import { formatProjectStatus, getStatusBadge, projectNavigatorRowBaseClass, projectNavigatorRowSelectedClass } from '../projectsPageUtils';

interface ProjectListPanelProps {
  projects: Project[];
  isLoading: boolean;
  selectedProjectId: number | null;
  onSelect: (project: Project) => void;
  onClearSelection?: () => void;
  onAdd: () => void;
  onDelete: (project: Project) => void;
  isDeleting: boolean;
  className?: string;
}

const ProjectListPanel: React.FC<ProjectListPanelProps> = ({
  projects,
  isLoading,
  selectedProjectId,
  onSelect,
  onClearSelection,
  onAdd,
  onDelete,
  isDeleting,
  className,
}) => (
  <Card className={cn('flex min-h-0 flex-1 flex-col border-border', className)}>
    <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <CardTitle className="text-base">Projects</CardTitle>
        <Button size="icon" variant="outline" className="h-7 w-7 shrink-0" onClick={onAdd} title="Add project">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {selectedProjectId != null && onClearSelection ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
          onClick={onClearSelection}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Overview
        </Button>
      ) : null}
    </CardHeader>
    <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      ) : projects.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">No projects found</div>
      ) : (
        <div className="divide-y divide-border">
          {projects.map((project) => (
            <div
              key={project.id}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted/50',
                projectNavigatorRowBaseClass,
                selectedProjectId === project.id && projectNavigatorRowSelectedClass
              )}
              onClick={() => onSelect(project)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-card-foreground">{project.name ?? 'Unnamed'}</div>
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-xs',
                    getStatusBadge(project.status ?? 'PLANNING')
                  )}
                >
                  {formatProjectStatus(project.status)}
                </span>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(project)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deactivate project</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default ProjectListPanel;
