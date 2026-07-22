import React, { useState, useEffect, useMemo } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { useAppSelector } from '@/app/hooks';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderScopeSeparatorClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import MachinesInlineLocationFilters from '@/components/newcomponents/customui/MachinesInlineLocationFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import {
  useGetProjectsQuery,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useGetProjectEventsQuery,
  useAddProjectMemberMutation,
  useRemoveProjectMemberMutation,
  useSetProjectVisibilityMutation,
} from '@/features/projects/projectsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useGetProjectComponentsQuery, useDeleteProjectComponentMutation } from '@/features/projectComponents/projectComponentsApi';
import {
  useGetProjectComponentTasksQuery,
  useUpdateProjectComponentTaskMutation,
  useDeleteProjectComponentTaskMutation,
} from '@/features/projectComponentTasks/projectComponentTasksApi';
import {
  useGetProjectComponentNotesQuery,
  useDeleteProjectComponentNoteMutation,
} from '@/features/projectComponentNotes/projectComponentNotesApi';
import { useGetProjectComponentItemsQuery } from '@/features/projectComponentItems/projectComponentItemsApi';
import { useGetMiscellaneousProjectCostsQuery } from '@/features/miscellaneousProjectCosts/miscellaneousProjectCostsApi';
import { useGetProjectComponentTotalCostQuery } from '@/features/ledgers/ledgersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Project } from '@/types/project';
import type { ProjectComponent } from '@/types/projectComponent';
import type { ProjectComponentNote } from '@/types/projectComponentNote';
import type { ProjectComponentTask } from '@/types/projectComponentTask';
import type { ProjectVisibility } from '@/types/project';
import { FolderKanban, Search, Plus } from 'lucide-react';
import AddProjectDialog from '@/components/newcomponents/customui/AddProjectDialog';
import AddProjectComponentDialog from '@/components/newcomponents/customui/AddProjectComponentDialog';
import AddProjectComponentTaskDialog from '@/components/newcomponents/customui/AddProjectComponentTaskDialog';
import ProjectComponentNoteDialog from '@/components/newcomponents/customui/ProjectComponentNoteDialog';
import ManageProjectMembersDialog from '@/components/newcomponents/customui/projects/ManageProjectMembersDialog';
import AddProjectComponentItemDialog from '@/components/newcomponents/customui/AddProjectComponentItemDialog';
import AddMiscellaneousProjectCostDialog from '@/components/newcomponents/customui/AddMiscellaneousProjectCostDialog';
import EditProjectDialog from '@/components/newcomponents/customui/EditProjectDialog';
import EditProjectComponentDialog from '@/components/newcomponents/customui/EditProjectComponentDialog';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import ProjectsPageLayout from '@/components/newcomponents/customui/projects/ProjectsPageLayout';
import ProjectLayoutSwitcher from '@/components/newcomponents/customui/projects/ProjectLayoutSwitcher';
import {
  DEFAULT_PROJECT_LAYOUT,
  type ProjectLayoutMode,
} from '@/components/newcomponents/customui/projects/projectLayoutModes';
import { PROJECT_STATUSES } from '@/components/newcomponents/customui/projects/projectsPageUtils';
import {
  singleFactoryToSlice,
  sliceToSingleFactoryId,
} from '@/lib/machinesLocationFilterAdapters';
import type { MachinesLocationFilterSlice } from '@/lib/machinesLocationFilters';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const ProjectsPage: React.FC = () => {
  const { factory: globalFactory, user, workspace } = useAppSelector((state) => state.auth);
  const [factoryId, setFactoryId] = useState<number | null>(() => globalFactory?.id ?? null);
  const [layoutMode, setLayoutMode] = useState<ProjectLayoutMode>(DEFAULT_PROJECT_LAYOUT);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddMiscCostOpen, setIsAddMiscCostOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isEditComponentOpen, setIsEditComponentOpen] = useState(false);
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ProjectComponentNote | null>(null);
  const [isNoteViewOpen, setIsNoteViewOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [leftGroupTab, setLeftGroupTab] = useState<'items' | 'misc'>('items');
  const [rightGroupTab, setRightGroupTab] = useState<'notes' | 'tasks' | 'documents'>('notes');

  useEffect(() => {
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id]);

  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery({
      skip: 0,
      limit: 200,
      factory_id: factoryId ?? undefined,
      project_status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const { data: componentsData, isLoading: loadingComponents } = useGetProjectComponentsQuery(
    { skip: 0, limit: 100, project_id: selectedProjectId ?? undefined },
    { skip: !selectedProjectId }
  );
  const components = Array.isArray(componentsData) ? componentsData : [];
  const { data: componentNotes = [] } = useGetProjectComponentNotesQuery(
    { skip: 0, limit: 100, project_component_id: selectedComponentId ?? undefined },
    { skip: !selectedComponentId }
  );
  const { data: tasks = [] } = useGetProjectComponentTasksQuery(
    {
      skip: 0,
      limit: 100,
      project_component_id: selectedComponentId ?? undefined,
      is_note: false,
    },
    { skip: !selectedComponentId }
  );
  const { data: componentItems = [] } = useGetProjectComponentItemsQuery(
    { skip: 0, limit: 100, project_component_id: selectedComponentId ?? undefined },
    { skip: !selectedComponentId }
  );
  const { data: miscCosts = [] } = useGetMiscellaneousProjectCostsQuery(
    {
      skip: 0,
      limit: 100,
      project_component_id: selectedComponentId ?? undefined,
    },
    { skip: !selectedComponentId }
  );
  const { data: totalCost } = useGetProjectComponentTotalCostQuery(selectedComponentId ?? 0, {
    skip: !selectedComponentId,
  });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 100 });
  const { data: projectMembersData } = useGetProjectMembersQuery(selectedProjectId ?? 0, {
    skip: !selectedProjectId,
  });
  const { data: projectEvents = [] } = useGetProjectEventsQuery(selectedProjectId ?? 0, {
    skip: !selectedProjectId,
  });
  const { data: workspaceMembers = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });

  const projectMembers = projectMembersData?.members ?? [];

  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();
  const [addProjectMember] = useAddProjectMemberMutation();
  const [removeProjectMember] = useRemoveProjectMemberMutation();
  const [setProjectVisibility] = useSetProjectVisibilityMutation();
  const [deleteComponent, { isLoading: isDeletingComponent }] = useDeleteProjectComponentMutation();
  const [updateTask] = useUpdateProjectComponentTaskMutation();
  const [deleteTask] = useDeleteProjectComponentTaskMutation();
  const [deleteNote] = useDeleteProjectComponentNoteMutation();

  const selectedProject = selectedProjectData ?? projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedComponent = components.find((c) => c.id === selectedComponentId);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const assignableMembers = useMemo(() => {
    const memberIds = new Set(projectMembers.map((m) => m.user_id));
    return workspaceMembers.filter((m) => m.status === 'active' && !memberIds.has(m.user_id));
  }, [workspaceMembers, projectMembers]);

  const factoryLocationValue = useMemo(() => singleFactoryToSlice(factoryId), [factoryId]);

  const handleFactoryLocationChange = (slice: Partial<MachinesLocationFilterSlice>) => {
    if (slice.factory_ids === undefined) return;
    const nextId = sliceToSingleFactoryId({ factory_ids: slice.factory_ids });
    setFactoryId(nextId);
    setSelectedProjectId(null);
    setSelectedProjectData(null);
    setSelectedComponentId(null);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id);
    setSelectedProjectData(project);
    setSelectedComponentId(null);
  };

  const handleClearProjectSelection = () => {
    setSelectedProjectId(null);
    setSelectedProjectData(null);
    setSelectedComponentId(null);
  };

  const handleComponentSelect = (component: ProjectComponent) => {
    setSelectedComponentId(component.id);
    setLeftGroupTab('items');
    setRightGroupTab('notes');
  };

  const handleLeftGroupAdd = () => {
    if (leftGroupTab === 'items') {
      setIsAddItemOpen(true);
      return;
    }
    setIsAddMiscCostOpen(true);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Deactivate project "${project.name}"?`)) return;
    try {
      await deleteProject(project.id).unwrap();
      toast.success('Project deactivated');
      setSelectedProjectId(null);
      setSelectedProjectData(null);
      setSelectedComponentId(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate project');
    }
  };

  const handleDeleteComponent = async (component: ProjectComponent) => {
    if (!window.confirm(`Delete component "${component.name}"?`)) return;
    try {
      await deleteComponent(component.id).unwrap();
      toast.success('Component deleted');
      setSelectedComponentId(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete component');
    }
  };

  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      await updateTask({ id: taskId, data: { is_completed: !isCompleted } }).unwrap();
      toast.success(isCompleted ? 'Task marked incomplete' : 'Task completed');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleOpenNote = (note: ProjectComponentNote) => {
    setSelectedNote(note);
    setIsNoteViewOpen(true);
  };

  const handleDeleteNote = async (note: ProjectComponentNote) => {
    if (!window.confirm(`Delete note "${note.name}"?`)) return;
    try {
      await deleteNote({ id: note.id, project_component_id: note.project_component_id }).unwrap();
      toast.success('Note deleted');
      if (selectedNote?.id === note.id) {
        setIsNoteViewOpen(false);
        setSelectedNote(null);
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete note');
    }
  };

  const handleAddProjectMember = async (memberUserId: number) => {
    if (!selectedProjectId) return;
    try {
      await addProjectMember({ projectId: selectedProjectId, user_id: memberUserId }).unwrap();
      toast.success('Member added');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add member');
    }
  };

  const handleRemoveProjectMember = async (memberUserId: number) => {
    if (!selectedProjectId) return;
    try {
      await removeProjectMember({ projectId: selectedProjectId, userId: memberUserId }).unwrap();
      toast.success('Member removed');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove member');
    }
  };

  const handleVisibilityChange = async (visibility: ProjectVisibility) => {
    if (!selectedProjectId) return;
    try {
      const updated = await setProjectVisibility({
        projectId: selectedProjectId,
        visibility,
      }).unwrap();
      setSelectedProjectData(updated);
      toast.success(
        visibility === 'invited_only'
          ? 'Project visible to invited members only'
          : 'Project visible to everyone in workspace'
      );
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update visibility');
    }
  };

  const handleDeleteTask = async (task: ProjectComponentTask) => {
    if (!window.confirm(`Delete task "${task.name}"?`)) return;
    try {
      await deleteTask(task.id).unwrap();
      toast.success('Task deleted');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete task');
    }
  };

  const getItemName = (itemId: number) => items.find((i) => i.id === itemId)?.name ?? `Item #${itemId}`;

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <DashboardNavbar />
        <div className="flex flex-1 min-w-0 flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-sm">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">No Factories Set Up</h2>
          <p className="mx-auto mb-8 max-w-md leading-relaxed text-muted-foreground">
            You need to create a factory before you can maintain projects. Set up a factory to start tracking projects,
            components, and related costs.
          </p>
          <Button
            size="lg"
            className="bg-brand-primary shadow-md transition-all hover:bg-brand-primary-hover"
            onClick={() => setIsAddFactoryOpen(true)}
          >
            Create Your First Factory
          </Button>
          <AddFactoryDialog open={isAddFactoryOpen} onOpenChange={setIsAddFactoryOpen} factories={factories} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardNavbar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader sticky>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <FolderKanban className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Projects</h1>
              <div className={appShellHeaderScopeSeparatorClass} aria-hidden />
              <MachinesInlineLocationFilters
                which="factories"
                variant="toolbar"
                value={factoryLocationValue}
                onChange={handleFactoryLocationChange}
                factories={factories}
                sections={[]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ProjectLayoutSwitcher value={layoutMode} onChange={setLayoutMode} />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn('w-[140px] border-border bg-background', appShellHeaderControlClass)}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn('pl-9 border-border bg-background', appShellHeaderControlClass)}
                />
              </div>
              <Button
                className={cn('bg-brand-primary hover:bg-brand-primary-hover', appShellHeaderControlClass)}
                onClick={() => setIsAddProjectOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add project
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-8">
          <ProjectsPageLayout
            layout={layoutMode}
            onLayoutChange={setLayoutMode}
            filteredProjects={filteredProjects}
            loadingProjects={loadingProjects}
            selectedProjectId={selectedProjectId}
            components={components}
            loadingComponents={loadingComponents}
            selectedComponentId={selectedComponentId}
            selectedProject={selectedProject}
            selectedComponent={selectedComponent}
            projectMembers={projectMembers}
            currentUserId={user?.id ?? null}
            projectEvents={projectEvents}
            componentItems={componentItems}
            miscCosts={miscCosts}
            componentNotes={componentNotes}
            tasks={tasks}
            totalCost={totalCost}
            leftGroupTab={leftGroupTab}
            rightGroupTab={rightGroupTab}
            isDeletingProject={isDeletingProject}
            isDeletingComponent={isDeletingComponent}
            onProjectSelect={handleProjectSelect}
            onClearProjectSelection={handleClearProjectSelection}
            onComponentSelect={handleComponentSelect}
            onAddProject={() => setIsAddProjectOpen(true)}
            onAddComponent={() => setIsAddComponentOpen(true)}
            onDeleteProject={handleDeleteProject}
            onDeleteComponent={handleDeleteComponent}
            onManageMembers={() => setIsManageMembersOpen(true)}
            onEditProject={() => setIsEditProjectOpen(true)}
            onEditComponent={() => setIsEditComponentOpen(true)}
            onLeftGroupTabChange={setLeftGroupTab}
            onRightGroupTabChange={setRightGroupTab}
            onLeftGroupAdd={handleLeftGroupAdd}
            onAddNote={() => setIsAddNoteOpen(true)}
            onAddTask={() => setIsAddTaskOpen(true)}
            onOpenNote={handleOpenNote}
            onDeleteNote={handleDeleteNote}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            getItemName={getItemName}
          />
        </div>
      </div>

      <AddProjectDialog
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        defaultFactoryId={factoryId}
        onSuccess={(project) => {
          if (project.factory_id) setFactoryId(project.factory_id);
          setSelectedProjectId(project.id);
          setSelectedProjectData(project);
          setSelectedComponentId(null);
        }}
      />
      <EditProjectDialog
        open={isEditProjectOpen}
        onOpenChange={setIsEditProjectOpen}
        project={selectedProject}
        onSuccess={(updated) => setSelectedProjectData(updated)}
      />
      <EditProjectComponentDialog
        open={isEditComponentOpen}
        onOpenChange={setIsEditComponentOpen}
        component={selectedComponent ?? null}
      />
      {selectedProjectId && (
        <AddProjectComponentDialog
          open={isAddComponentOpen}
          onOpenChange={setIsAddComponentOpen}
          projectId={selectedProjectId}
          onSuccess={(id) => setSelectedComponentId(id)}
        />
      )}
      {selectedComponentId && (
        <AddProjectComponentTaskDialog
          open={isAddTaskOpen}
          onOpenChange={setIsAddTaskOpen}
          projectComponentId={selectedComponentId}
        />
      )}
      {selectedComponentId && (
        <AddProjectComponentTaskDialog
          open={isAddNoteOpen}
          onOpenChange={setIsAddNoteOpen}
          projectComponentId={selectedComponentId}
          isNote
        />
      )}
      <ProjectComponentNoteDialog
        open={isNoteViewOpen}
        onOpenChange={(open) => {
          setIsNoteViewOpen(open);
          if (!open) setSelectedNote(null);
        }}
        note={selectedNote}
      />
      {selectedComponentId && (
        <AddProjectComponentItemDialog
          open={isAddItemOpen}
          onOpenChange={setIsAddItemOpen}
          projectComponentId={selectedComponentId}
        />
      )}
      {selectedComponentId && (
        <AddMiscellaneousProjectCostDialog
          open={isAddMiscCostOpen}
          onOpenChange={setIsAddMiscCostOpen}
          projectComponentId={selectedComponentId}
        />
      )}
      {selectedProject && (
        <ManageProjectMembersDialog
          open={isManageMembersOpen}
          onOpenChange={setIsManageMembersOpen}
          members={projectMembers}
          visibility={selectedProject.visibility ?? 'workspace'}
          assignableMembers={assignableMembers}
          createdByUserId={selectedProject.created_by}
          onVisibilityChange={handleVisibilityChange}
          onAddMember={handleAddProjectMember}
          onRemoveMember={handleRemoveProjectMember}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
