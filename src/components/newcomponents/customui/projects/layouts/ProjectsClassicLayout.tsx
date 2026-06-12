import React from 'react';
import ProjectListPanel from '../panels/ProjectListPanel';
import ComponentListPanel from '../panels/ComponentListPanel';
import ProjectMainPanel from '../panels/ProjectMainPanel';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';

const ProjectsClassicLayout: React.FC<ProjectsPageLayoutProps> = (props) => (
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

export default ProjectsClassicLayout;
