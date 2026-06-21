import React from 'react';
import ProjectDetailPanel from './ProjectDetailPanel';
import ComponentWorkspacePanel from './ComponentWorkspacePanel';
import ProjectsOverviewPanel from '../ProjectsOverviewPanel';
import type { ProjectsPageLayoutProps } from '../projectsPageTypes';
import { cn } from '@/lib/utils';

type ProjectMainPanelProps = Pick<
  ProjectsPageLayoutProps,
  | 'filteredProjects'
  | 'loadingProjects'
  | 'selectedProjectId'
  | 'selectedComponentId'
  | 'selectedProject'
  | 'selectedComponent'
  | 'projectMembers'
  | 'currentUserId'
  | 'projectEvents'
  | 'components'
  | 'totalCost'
  | 'leftGroupTab'
  | 'rightGroupTab'
  | 'componentItems'
  | 'miscCosts'
  | 'componentNotes'
  | 'tasks'
  | 'onProjectSelect'
  | 'onManageMembers'
  | 'onEditProject'
  | 'onEditComponent'
  | 'onLeftGroupTabChange'
  | 'onRightGroupTabChange'
  | 'onLeftGroupAdd'
  | 'onAddNote'
  | 'onAddTask'
  | 'onOpenNote'
  | 'onDeleteNote'
  | 'onToggleTask'
  | 'onDeleteTask'
  | 'getItemName'
> & { className?: string };

const ProjectMainPanel: React.FC<ProjectMainPanelProps> = ({
  filteredProjects,
  loadingProjects,
  selectedComponentId,
  selectedProjectId,
  selectedProject,
  selectedComponent,
  projectMembers,
  currentUserId,
  projectEvents,
  components,
  totalCost,
  leftGroupTab,
  rightGroupTab,
  componentItems,
  miscCosts,
  componentNotes,
  tasks,
  onProjectSelect,
  onManageMembers,
  onEditProject,
  onEditComponent,
  onLeftGroupTabChange,
  onRightGroupTabChange,
  onLeftGroupAdd,
  onAddNote,
  onAddTask,
  onOpenNote,
  onDeleteNote,
  onToggleTask,
  onDeleteTask,
  getItemName,
  className,
}) => {
  if (selectedComponentId) {
    return (
      <ComponentWorkspacePanel
        className={className}
        selectedProject={selectedProject}
        selectedComponent={selectedComponent}
        componentsCount={components.length}
        totalCost={totalCost}
        leftGroupTab={leftGroupTab}
        rightGroupTab={rightGroupTab}
        componentItems={componentItems}
        miscCosts={miscCosts}
        componentNotes={componentNotes}
        tasks={tasks}
        onEditProject={onEditProject}
        onEditComponent={onEditComponent}
        onLeftGroupTabChange={onLeftGroupTabChange}
        onRightGroupTabChange={onRightGroupTabChange}
        onLeftGroupAdd={onLeftGroupAdd}
        onAddNote={onAddNote}
        onAddTask={onAddTask}
        onOpenNote={onOpenNote}
        onDeleteNote={onDeleteNote}
        onToggleTask={onToggleTask}
        onDeleteTask={onDeleteTask}
        getItemName={getItemName}
      />
    );
  }

  if (!selectedProjectId) {
    return (
      <ProjectsOverviewPanel
        className={cn('min-h-0 min-w-0 flex-1', className)}
        variant="embedded"
        projects={filteredProjects}
        loading={loadingProjects}
        onProjectSelect={onProjectSelect}
      />
    );
  }

  return (
    <ProjectDetailPanel
      className={className}
      selectedProjectId={selectedProjectId}
      selectedProject={selectedProject}
      projectMembers={projectMembers}
      currentUserId={currentUserId}
      projectEvents={projectEvents}
      componentsCount={components.length}
      onManageMembers={onManageMembers}
      onEditProject={onEditProject}
    />
  );
};

export default ProjectMainPanel;
