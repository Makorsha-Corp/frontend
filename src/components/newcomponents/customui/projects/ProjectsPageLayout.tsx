import React from 'react';
import ProjectsClassicLayout from './layouts/ProjectsClassicLayout';
import ProjectsTreeNavigatorLayout from './layouts/ProjectsTreeNavigatorLayout';
import ProjectsThreeColumnLayout from './layouts/ProjectsThreeColumnLayout';
import ProjectsFocusComponentLayout from './layouts/ProjectsFocusComponentLayout';
import ProjectsOverviewLayout from './layouts/ProjectsOverviewLayout';
import ProjectsStackedLayout from './layouts/ProjectsStackedLayout';
import type { ProjectsPageLayoutProps } from './projectsPageTypes';

const ProjectsPageLayout: React.FC<ProjectsPageLayoutProps> = (props) => {
  const { layout } = props;

  let content: React.ReactNode;
  switch (layout) {
    case 'treeNavigator':
      content = <ProjectsTreeNavigatorLayout {...props} />;
      break;
    case 'threeColumn':
      content = <ProjectsThreeColumnLayout {...props} />;
      break;
    case 'focusComponent':
      content = <ProjectsFocusComponentLayout {...props} />;
      break;
    case 'overview':
      content = <ProjectsOverviewLayout {...props} />;
      break;
    case 'stacked':
      content = <ProjectsStackedLayout {...props} />;
      break;
    case 'classic':
    default:
      content = <ProjectsClassicLayout {...props} />;
      break;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {content}
    </div>
  );
};

export default ProjectsPageLayout;
