import React from 'react';
import ProjectNavigatorTree from '../panels/ProjectNavigatorTree';
import ProjectMainPanel from '../panels/ProjectMainPanel';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';

const ProjectsTreeNavigatorLayout: React.FC<ProjectsPageLayoutProps> = (props) => (
  <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-6">
    <div className="w-full shrink-0 lg:w-80 lg:min-h-0 lg:flex lg:flex-col">
      <ProjectNavigatorTree
        projects={props.filteredProjects}
        components={props.components}
        loadingProjects={props.loadingProjects}
        loadingComponents={props.loadingComponents}
        selectedProjectId={props.selectedProjectId}
        selectedComponentId={props.selectedComponentId}
        onProjectSelect={props.onProjectSelect}
        onComponentSelect={props.onComponentSelect}
        onAddProject={props.onAddProject}
        onAddComponent={props.onAddComponent}
        onDeleteProject={props.onDeleteProject}
        onDeleteComponent={props.onDeleteComponent}
        isDeletingProject={props.isDeletingProject}
        isDeletingComponent={props.isDeletingComponent}
      />
    </div>
    <ProjectMainPanel {...props} className="min-h-0 flex-1" />
  </div>
);

export default ProjectsTreeNavigatorLayout;
