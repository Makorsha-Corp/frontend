import React from 'react';
import ProjectListPanel from '../panels/ProjectListPanel';
import ComponentListPanel from '../panels/ComponentListPanel';
import ProjectMainPanel from '../panels/ProjectMainPanel';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';

const ProjectsStackedLayout: React.FC<ProjectsPageLayoutProps> = (props) => (
  <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
    <div className="grid max-h-[42%] min-h-0 shrink-0 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2 md:gap-6">
      <ProjectListPanel
        projects={props.filteredProjects}
        isLoading={props.loadingProjects}
        selectedProjectId={props.selectedProjectId}
        onSelect={props.onProjectSelect}
        onAdd={props.onAddProject}
        onDelete={props.onDeleteProject}
        isDeleting={props.isDeletingProject}
        className="min-h-0"
      />
      <ComponentListPanel
        components={props.components}
        isLoading={props.loadingComponents}
        selectedComponentId={props.selectedComponentId}
        selectedProjectId={props.selectedProjectId}
        onSelect={props.onComponentSelect}
        onAdd={props.onAddComponent}
        onDelete={props.onDeleteComponent}
        isDeleting={props.isDeletingComponent}
        className="min-h-0"
      />
    </div>
    <ProjectMainPanel {...props} className="min-h-0 flex-1" />
  </div>
);

export default ProjectsStackedLayout;
