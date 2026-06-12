import React from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen } from 'lucide-react';
import ProjectListPanel from '../panels/ProjectListPanel';
import ComponentListPanel from '../panels/ComponentListPanel';
import ProjectMainPanel from '../panels/ProjectMainPanel';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';

const ProjectsFocusComponentLayout: React.FC<ProjectsPageLayoutProps> = (props) => {
  if (props.selectedComponentId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <p className="min-w-0 truncate text-sm text-card-foreground">
            <span className="font-medium">{props.selectedProject?.name ?? 'Project'}</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span>{props.selectedComponent?.name ?? 'Component'}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1.5"
            onClick={() => props.onLayoutChange('classic')}
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
            Show navigator
          </Button>
        </div>
        <ProjectMainPanel {...props} className="min-h-0 flex-1" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-6">
      <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80 lg:min-h-0">
        <ProjectListPanel
          projects={props.filteredProjects}
          isLoading={props.loadingProjects}
          selectedProjectId={props.selectedProjectId}
          onSelect={props.onProjectSelect}
          onClearSelection={props.onClearProjectSelection}
          onAdd={props.onAddProject}
          onDelete={props.onDeleteProject}
          isDeleting={props.isDeletingProject}
        />
        {props.selectedProjectId != null && (
          <ComponentListPanel
            components={props.components}
            isLoading={props.loadingComponents}
            selectedComponentId={props.selectedComponentId}
            selectedProjectId={props.selectedProjectId}
            onSelect={props.onComponentSelect}
            onAdd={props.onAddComponent}
            onDelete={props.onDeleteComponent}
            isDeleting={props.isDeletingComponent}
          />
        )}
      </div>
      <ProjectMainPanel {...props} className="min-h-0 flex-1" />
    </div>
  );
};

export default ProjectsFocusComponentLayout;
