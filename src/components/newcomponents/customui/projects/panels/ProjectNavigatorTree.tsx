import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/project';
import type { ProjectComponent } from '@/types/projectComponent';
import { formatProjectStatus, getStatusBadge, projectNavigatorRowBaseClass, projectNavigatorRowSelectedClass } from '../projectsPageUtils';

interface ProjectNavigatorTreeProps {
  projects: Project[];
  components: ProjectComponent[];
  loadingProjects: boolean;
  loadingComponents: boolean;
  selectedProjectId: number | null;
  selectedComponentId: number | null;
  onProjectSelect: (project: Project) => void;
  onComponentSelect: (component: ProjectComponent) => void;
  onAddProject: () => void;
  onAddComponent: () => void;
  onDeleteProject: (project: Project) => void;
  onDeleteComponent: (component: ProjectComponent) => void;
  isDeletingProject: boolean;
  isDeletingComponent: boolean;
  className?: string;
}

const ProjectNavigatorTree: React.FC<ProjectNavigatorTreeProps> = ({
  projects,
  components,
  loadingProjects,
  loadingComponents,
  selectedProjectId,
  selectedComponentId,
  onProjectSelect,
  onComponentSelect,
  onAddProject,
  onAddComponent,
  onDeleteProject,
  onDeleteComponent,
  isDeletingProject,
  isDeletingComponent,
  className,
}) => {
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(selectedProjectId);

  useEffect(() => {
    if (selectedProjectId != null) setExpandedProjectId(selectedProjectId);
  }, [selectedProjectId]);

  const selectProject = (project: Project) => {
    setExpandedProjectId(project.id);
    onProjectSelect(project);
  };

  const toggleExpandViaChevron = (project: Project) => {
    if (expandedProjectId === project.id) {
      setExpandedProjectId(null);
      return;
    }
    setExpandedProjectId(project.id);
    onProjectSelect(project);
  };

  return (
    <Card className={cn('flex min-h-0 flex-1 flex-col border-border', className)}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Projects</CardTitle>
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={onAddProject} title="Add project">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No projects found</div>
        ) : (
          <div className="divide-y divide-border">
            {projects.map((project) => {
              const isExpanded = expandedProjectId === project.id;
              const isSelected = selectedProjectId === project.id;
              return (
                <div key={project.id}>
                  <div
                    className={cn(
                      'flex items-center gap-1 px-3 py-2.5 hover:bg-muted/50',
                      projectNavigatorRowBaseClass,
                      isSelected && projectNavigatorRowSelectedClass
                    )}
                  >
                    <button
                      type="button"
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted"
                      onClick={() => toggleExpandViaChevron(project)}
                      aria-label={isExpanded ? 'Collapse project' : 'Expand project'}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectProject(project)}
                    >
                      <div className="truncate font-medium text-card-foreground">{project.name ?? 'Unnamed'}</div>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs',
                          getStatusBadge(project.status ?? 'PLANNING')
                        )}
                      >
                        {formatProjectStatus(project.status)}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 shrink-0 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => onDeleteProject(project)}
                      disabled={isDeletingProject}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border/60 bg-muted/10 pb-2">
                      <div className="flex items-center justify-between px-3 py-2 pl-9 pr-3">
                        <span className="text-base font-semibold leading-none tracking-tight text-card-foreground">
                          Components
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 shrink-0"
                          onClick={onAddComponent}
                          disabled={!isSelected}
                          title="Add component"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {loadingComponents && isSelected ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                        </div>
                      ) : !isSelected ? (
                        <p className="px-9 py-2 text-xs text-muted-foreground">Select project to load components</p>
                      ) : components.length === 0 ? (
                        <p className="px-9 py-2 text-xs text-muted-foreground">No components</p>
                      ) : (
                        components.map((component) => (
                          <div
                            key={component.id}
                            className={cn(
                              'flex cursor-pointer items-center justify-between gap-2 py-2 pl-9 pr-3 hover:bg-muted/40',
                              projectNavigatorRowBaseClass,
                              selectedComponentId === component.id && projectNavigatorRowSelectedClass
                            )}
                            onClick={() => onComponentSelect(component)}
                          >
                            <span className="truncate text-sm text-card-foreground">{component.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 shrink-0 p-0 text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteComponent(component);
                              }}
                              disabled={isDeletingComponent}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectNavigatorTree;
