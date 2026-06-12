import React from 'react';
import ProjectsOverviewPanel from '../ProjectsOverviewPanel';
import ProjectsClassicLayout from './ProjectsClassicLayout';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';

const ProjectsOverviewLayout: React.FC<ProjectsPageLayoutProps> = (props) => (
  <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
    <ProjectsOverviewPanel projects={props.filteredProjects} />
    <div className="min-h-0 flex-1 overflow-hidden">
      <ProjectsClassicLayout {...props} />
    </div>
  </div>
);

export default ProjectsOverviewLayout;
