import React from 'react';
import ProjectListPanel from '../panels/ProjectListPanel';
import ComponentListPanel from '../panels/ComponentListPanel';
import ProjectMainPanel from '../panels/ProjectMainPanel';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';

const ProjectsThreeColumnLayout: React.FC<ProjectsPageLayoutProps> = (props) => (
  <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_minmax(0,2fr)] lg:gap-6">
    <ProjectListPanel
      projects={props.filteredProjects}
      isLoading={props.loadingProjects}
      selectedProjectId={props.selectedProjectId}
      onSelect={props.onProjectSelect}
      onAdd={props.onAddProject}
      onDelete={props.onDeleteProject}
      isDeleting={props.isDeletingProject}
      className="min-h-[200px] lg:min-h-0"
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
      className="min-h-[200px] lg:min-h-0"
    />
    <ProjectMainPanel {...props} className="min-h-[280px] lg:min-h-0" />
  </div>
);

export default ProjectsThreeColumnLayout;
